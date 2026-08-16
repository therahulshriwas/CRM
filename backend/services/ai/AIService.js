// backend/services/ai/AIService.js
// The ONLY AI module imported anywhere else in the app (controllers). It owns the
// provider registry (future provider abstraction), CRM context injection, conversation
// memory/history, system-prompt building, role awareness and tool-calling preparation.
// The controller never calls a provider directly — it always goes through this service.
// Used in: backend/controllers/ai.controller.js.

const GroqProvider = require('./GroqProvider');

// Shared helper for normalized AI errors (mirrors AIProvider codes).
function aiError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Cap on how much conversation history we feed the model to bound token usage.
const MAX_HISTORY_MESSAGES = 16;

// ---------------------------------------------------------------------------
// Tool calling preparation (schemas only, no execution wiring yet).
// These are exposed to providers that support native function calling when
// AI_TOOLS_ENABLED=true. Kept declarative so future providers/tool execution
// can be added without touching controllers.
// ---------------------------------------------------------------------------
const CRMTools = [
  {
    type: 'function',
    function: {
      name: 'get_lead_detail',
      description: 'Fetch full details for a specific lead by ID.',
      parameters: {
        type: 'object',
        properties: { leadId: { type: 'integer', description: 'The lead ID.' } },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_deal_detail',
      description: 'Fetch full details for a specific deal by ID.',
      parameters: {
        type: 'object',
        properties: { dealId: { type: 'integer', description: 'The deal ID.' } },
        required: ['dealId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Suggest navigating the user to a CRM page.',
      parameters: {
        type: 'object',
        properties: { page: { type: 'string', description: 'Target page name, e.g. leads, deals, dashboard.' } },
        required: ['page'],
      },
    },
  },
];

function prepareTools() {
  return process.env.AI_TOOLS_ENABLED === 'true' ? CRMTools : undefined;
}

// Maps a CRM role to a plain-English permissions summary used in the system prompt.
function describePermissions(role) {
  if (role === 'admin') {
    return 'Full access: can view and manage every lead, deal, customer, employee and report across the entire CRM.';
  }
  if (role === 'team_lead') {
    return 'Team visibility: can view and manage own leads/deals plus those owned by agents in the team. Cannot modify employee records or global settings.';
  }
  return 'Personal scope: can only view and manage leads and deals they own. Cannot see other users\' data, employees, or global settings.';
}

// Builds the compact, role-scoped CRM context block that grounds every answer.
function buildContextBlock(context) {
  const lines = [];

  if (context.leads?.length) {
    lines.push('Your accessible leads:');
    context.leads.forEach((l) => {
      lines.push(`- Lead #${l.id}: ${l.name} | status: ${l.status} | source: ${l.source} | owner: ${l.owner_name}`);
    });
  }
  if (context.deals?.length) {
    lines.push('Your accessible deals:');
    context.deals.forEach((d) => {
      lines.push(`- Deal #${d.id}: ${d.title} | stage: ${d.stage} | value: $${d.value} | owner: ${d.owner_name}`);
    });
  }
  if (context.activities?.length) {
    lines.push('Recent activities:');
    context.activities.forEach((a) => {
      lines.push(`- ${a.type}${a.deal_title ? ` on "${a.deal_title}"` : ''}: ${a.notes || ''}`.trim());
    });
  }
  if (context.upcomingEvents?.length) {
    lines.push('Upcoming meetings / deadlines:');
    context.upcomingEvents.forEach((e) => {
      const when = e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon';
      lines.push(`- ${when}: ${e.title}${e.value ? ` ($${e.value})` : ''}`);
    });
  }
  if (context.dashboardSummary) {
    const d = context.dashboardSummary;
    lines.push('Dashboard summary:');
    lines.push(`- Revenue: $${d.totalRevenue || 0}, profit: $${d.totalProfit || 0}, customers: ${d.totalCustomers || 0}, new leads: ${d.newLeads || 0}, conversion: ${d.conversionRate || 0}%, growth: ${d.growth || 0}%`);
    if (d.pipeline) {
      lines.push(`- Pipeline: ${Object.entries(d.pipeline).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    }
  }
  if (context.currentLead) {
    lines.push('Current lead in view:');
    lines.push(`- #${context.currentLead.id}: ${context.currentLead.name} | email: ${context.currentLead.email || '—'} | phone: ${context.currentLead.phone || '—'} | status: ${context.currentLead.status} | source: ${context.currentLead.source}`);
  }
  if (context.currentDeal) {
    lines.push('Current deal in view:');
    lines.push(`- #${context.currentDeal.id}: ${context.currentDeal.title} | stage: ${context.currentDeal.stage} | value: $${context.currentDeal.value}`);
  }
  if (context.currentCustomer) {
    lines.push('Current customer in view:');
    lines.push(`- ${context.currentCustomer.name} | email: ${context.currentCustomer.email || '—'} | revenue: $${context.currentCustomer.totalRevenue || 0}`);
  }
  if (context.notifications?.length) {
    lines.push('Recent notifications:');
    context.notifications.forEach((n) => lines.push(`- ${n.type}: ${n.message}`));
  }

  if (!lines.length) lines.push('No CRM data available for this user yet.');
  return lines.join('\n');
}

// Builds the system prompt: identity, role awareness, injected context, tool guidance.
function buildSystemPrompt({ user, context = {} }) {
  const sections = [
    'You are the AI Copilot inside a sales CRM called Antigravity.',
    'Answer questions about the user\'s CRM data only. Be concise, practical and accurate.',
    'Never invent data not present in the context below; if unknown, say so and suggest where to look.',
  ];

  sections.push(`User: ${user.name} <${user.email}>`);
  sections.push(`Role: ${user.role}`);
  if (user.department) sections.push(`Department: ${user.department}`);
  sections.push(`Permissions: ${describePermissions(user.role)}`);

  if (context.page) sections.push(`Current page: ${context.page}`);

  if (context.tools?.length) {
    sections.push('Available tools (call when useful): ' + context.tools.map((t) => t.function?.name || t.name).join(', '));
  }

  sections.push('');
  sections.push('Current CRM context:');
  sections.push(buildContextBlock(context));

  return sections.join('\n');
}

// Builds the full messages array: system prompt + trimmed history + the user turn.
function buildMessages({ systemPrompt, history = [], userMessage }) {
  const trimmed = history
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY_MESSAGES);

  return [systemPrompt, ...trimmed, { role: 'user', content: userMessage }]
    .filter(Boolean);
}

class AIService {
  constructor() {
    // Provider registry — the future provider abstraction seam. Adding a provider
    // is just a new entry here plus a provider file extending AIProvider.
    this.registry = {
      groq: (config) => new GroqProvider(config),
    };
  }

  // Resolves the configured provider. Missing/unknown provider => AI_NOT_CONFIGURED.
  resolveProvider() {
    const name = (process.env.AI_PROVIDER || 'groq').toLowerCase();
    const factory = this.registry[name];
    if (!factory) {
      throw aiError('AI_NOT_CONFIGURED', `Unknown AI provider "${name}". Set AI_PROVIDER to a supported provider (groq).`);
    }
    const config = {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.AI_MODEL || 'openai/gpt-oss-20b',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '120000', 10),
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    };
    return factory(config);
  }

  // Non-streaming assistant completion.
  async askAssistant({ user, message, history = [], context = {} }) {
    const provider = this.resolveProvider();
    const systemPrompt = buildSystemPrompt({ user, context });
    const messages = buildMessages({ systemPrompt, history, userMessage: message });
    const tools = prepareTools();
    return provider.generate({ messages, options: tools ? { tools } : {} });
  }

  // Streaming assistant completion — yields { text } deltas.
  async *streamChat({ user, message, history = [], context = {} }) {
    const provider = this.resolveProvider();
    const systemPrompt = buildSystemPrompt({ user, context });
    const messages = buildMessages({ systemPrompt, history, userMessage: message });
    const tools = prepareTools();
    yield* provider.stream({ messages, options: tools ? { tools } : {} });
  }

  // Follow-up drafting use case.
  async draftFollowUp({ user, lead, context = {} }) {
    const provider = this.resolveProvider();
    const systemPrompt = [
      'You are a sales assistant inside a CRM.',
      'Draft a short, professional follow-up message (2-4 sentences) for the given lead.',
      'Match a warm, concise sales tone. Do not invent contact details beyond what is provided.',
      'Return only the message body, with no subject line, greeting ceremony or sign-off unless the lead context calls for it.',
    ].join('\n');

    const leadContext = [
      `Lead: ${lead.name}`,
      lead.email ? `Email: ${lead.email}` : '',
      lead.phone ? `Phone: ${lead.phone}` : '',
      `Status: ${lead.status} | Source: ${lead.source}`,
      `Owner: ${lead.owner_name || user.name}`,
      context.lastActivity ? `Last activity: ${context.lastActivity}` : '',
    ].filter(Boolean).join('\n');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Write a follow-up for:\n${leadContext}` },
    ];

    return provider.generate({ messages, options: { maxTokens: 350, temperature: 0.6 } });
  }
}

// Export a singleton so provider SDKs are initialized lazily once per process.
module.exports = new AIService();
module.exports.AIService = AIService;
module.exports.CRMTools = CRMTools;
