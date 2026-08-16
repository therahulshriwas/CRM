// backend/controllers/ai.controller.js
// Wires the AI copilot use cases to AIService. This controller:
//   - NEVER calls Groq (or any provider) directly â€” everything goes through AIService.
//   - Builds role-scoped CRM context (current entity, recent activities, upcoming
//     events, dashboard summary) so answers are grounded and never leak hidden data.
//   - Exposes both JSON (assistant, draft-follow-up) and SSE streaming (chat) responses.
// Used in: backend/routes/ai.routes.js.

const { Lead, Deal, User, Activity, Notification } = require('../models');
const { Op } = require('sequelize');
const { getRoleFilter } = require('./lead.controller');
const aiService = require('../services/ai/AIService');

// ---- Context helpers -------------------------------------------------------

// Loads a single lead the user is authorized to see, applying the exact same
// role-scoped access rules as the REST `getLeadById()` endpoint. Returns {}
// when the entity is absent or out of scope (never leaks hidden data).
async function loadScopedLead(user, entityId) {
  const roleFilter = await getRoleFilter(user);
  const lead = await Lead.findOne({
    where: { id: entityId, ...roleFilter },
    include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'role', 'avatar_url'] }],
  });
  if (!lead) return {};
  return {
    currentLead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
    },
  };
}

// Loads a single deal the user is authorized to see, applying the exact same
// role-scoped access rules as list/query filtering. Returns {} when absent or
// out of scope.
async function loadScopedDeal(user, entityId) {
  const roleFilter = await getRoleFilter(user);
  const deal = await Deal.findOne({
    where: { id: entityId, ...roleFilter },
    include: [{ model: Lead, as: 'lead', attributes: ['id', 'name', 'email'] }],
  });
  if (!deal) return {};
  return {
    currentDeal: {
      id: deal.id,
      title: deal.title,
      stage: deal.stage,
      value: parseFloat(deal.value || 0),
    },
  };
}

// Loads the "current entity" the user is looking at (lead / deal / customer).
// Returns {} when the user has no access â€” role-scoped via getRoleFilter().
async function resolveCurrentEntity(user, context = {}) {
  const { entityType, entityId } = context || {};
  if (!entityType || !entityId) return {};

  if (entityType === 'lead') {
    return loadScopedLead(user, entityId);
  }

  if (entityType === 'deal') {
    return loadScopedDeal(user, entityId);
  }

  if (entityType === 'customer') {
    // Customers are derived from won deals owned by the user (or team).
    const roleFilter = await getRoleFilter(user);
    const deal = await Deal.findOne({
      where: { id: entityId, stage: 'Won', ...roleFilter },
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'name', 'email'] }],
    });
    if (!deal) {
      // Fall back to lead-scoped access using the same RBAC rules.
      return loadScopedLead(user, entityId);
    }
    const wonTotal = await Deal.sum('value', {
      where: { lead_id: deal.lead_id, stage: 'Won', ...roleFilter },
    });
    return {
      currentCustomer: {
        name: deal.lead?.name || 'Customer',
        email: deal.lead?.email || null,
        totalRevenue: parseFloat(wonTotal || 0),
      },
    };
  }

  return {};
}

// Builds a dashboard summary (role-scoped) for grounding answers.
async function buildDashboardSummary(user) {
  const roleFilter = await getRoleFilter(user);
  const totalLeads = await Lead.count({ where: roleFilter });
  const deals = await Deal.findAll({ where: roleFilter, include: [{ model: Lead, as: 'lead', attributes: ['source'] }] });
  const wonDeals = deals.filter((d) => d.stage === 'Won');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
  const totalCustomers = new Set(wonDeals.map((d) => d.lead_id)).size;
  const newLeads = await Lead.count({ where: { ...roleFilter, status: 'New' } });
  const conversionRate = totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0;
  const pipeline = {
    Qualified: deals.filter((d) => d.stage === 'Qualified').length,
    Proposal: deals.filter((d) => d.stage === 'Proposal').length,
    Negotiation: deals.filter((d) => d.stage === 'Negotiation').length,
    Won: wonDeals.length,
    Lost: deals.filter((d) => d.stage === 'Lost').length,
  };
  return {
    totalRevenue,
    totalProfit: totalRevenue * 0.85,
    totalCustomers,
    newLeads,
    conversionRate,
    growth: 0,
    pipeline,
  };
}

// Gathers the full, role-scoped context snapshot passed to AIService.
async function buildContext(user, clientContext = {}) {
  const roleFilter = await getRoleFilter(user);

  const [leads, deals, activities, notifications, upcomingDeals, currentEntity] = await Promise.all([
    Lead.findAll({
      where: roleFilter,
      attributes: ['id', 'name', 'status', 'source', 'owner_id'],
      include: [{ model: User, as: 'owner', attributes: ['name'] }],
      limit: 20,
      order: [['id', 'DESC']],
    }),
    Deal.findAll({
      where: roleFilter,
      attributes: ['id', 'title', 'stage', 'value', 'owner_id'],
      include: [{ model: User, as: 'owner', attributes: ['name'] }],
      limit: 20,
      order: [['id', 'DESC']],
    }),
    Activity.findAll({
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'title'] }],
      order: [['created_at', 'DESC']],
      limit: 10,
    }),
    Notification.findAll({
      where: { user_id: user.id },
      attributes: ['type', 'title', 'message', 'read'],
      limit: 10,
      order: [['id', 'DESC']],
    }),
    Deal.findAll({
      where: {
        ...roleFilter,
        close_date: { [Op.gte]: new Date() },
        stage: { [Op.ne]: 'Lost' },
      },
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'name'] }],
      order: [['close_date', 'ASC']],
      limit: 10,
    }),
    resolveCurrentEntity(user, clientContext),
  ]);

  // Scope recent activities to deals the user can see.
  const visibleDealIds = new Set(deals.map((d) => d.id));
  const scopedActivities = activities.filter((a) => visibleDealIds.has(a.deal_id)).slice(0, 10);

  return {
    ...currentEntity,
    page: clientContext?.page || null,
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name,
      status: l.status,
      source: l.source,
      owner_name: l.owner?.name || 'Unassigned',
    })),
    deals: deals.map((d) => ({
      id: d.id,
      title: d.title,
      stage: d.stage,
      value: d.value,
      owner_name: d.owner?.name || 'Unassigned',
    })),
    activities: scopedActivities.map((a) => ({
      type: a.type,
      notes: a.notes,
      deal_title: a.deal?.title || null,
    })),
    upcomingEvents: upcomingDeals.map((d) => ({
      title: d.title,
      date: d.close_date,
      value: parseFloat(d.value || 0),
      stage: d.stage,
    })),
    dashboardSummary: await buildDashboardSummary(user),
    notifications: notifications.map((n) => ({ type: n.type, title: n.title, message: n.message, read: n.read })),
  };
}

// Normalizes thrown AI errors into stable HTTP responses.
function handleAIError(error, res) {
  if (error.code === 'AI_NOT_CONFIGURED') {
    return res.status(503).json({ message: 'AI assistant is not configured. Set GROQ_API_KEY in backend/.env to enable it.' });
  }
  if (error.code === 'AI_RATE_LIMITED') {
    return res.status(503).json({ message: error.message || 'The AI assistant is temporarily unavailable. Please try again in a moment.' });
  }
  if (error.code === 'AI_TIMEOUT') {
    return res.status(504).json({ message: 'The AI request timed out. Please try again.' });
  }
  if (error.code === 'AI_PROVIDER_ERROR') {
    return res.status(502).json({ message: 'The AI assistant is temporarily unavailable. Please try again in a moment.' });
  }
  return res.status(500).json({ message: 'Something went wrong generating a response.' });
}

// ---- Handlers --------------------------------------------------------------

// POST /api/ai/assistant â€” non-streaming JSON response (backward compatible).
async function askAssistant(req, res, next) {
  try {
    const { message, history, context } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'A non-empty "message" is required.' });
    }

    const ctx = await buildContext(req.user, context);
    const result = await aiService.askAssistant({ user: req.user, message: message.trim(), history, context: ctx });
    return res.json({ message: 'Assistant reply generated.', data: { text: result.text, usage: result.usage } });
  } catch (error) {
    if (error.code) return handleAIError(error, res);
    next(error);
  }
}

// POST /api/ai/chat â€” streaming SSE response (text/event-stream).
// Emits: data: {"type":"start"} / {"type":"token","text":"..."} / {"type":"done","usage":...} / {"type":"error","message":"..."}
async function chat(req, res, next) {
  const { message, history, context } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'A non-empty "message" is required.' });
  }

  // SSE handshake headers.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  send({ type: 'start' });

  const handleFailure = (error) => {
    const status = { AI_NOT_CONFIGURED: 503, AI_RATE_LIMITED: 503, AI_TIMEOUT: 504, AI_PROVIDER_ERROR: 502 };
    send({ type: 'error', status: status[error.code] || 500, message: error.message || 'The AI assistant is temporarily unavailable.' });
    res.end();
  };

  try {
    const ctx = await buildContext(req.user, context);
    let fullText = '';
    for await (const delta of aiService.streamChat({ user: req.user, message: message.trim(), history, context: ctx })) {
      if (delta?.text) {
        fullText += delta.text;
        send({ type: 'token', text: delta.text });
      }
    }
    send({ type: 'done', usage: undefined });
    res.end();
  } catch (error) {
    if (error.code) return handleFailure(error);
    send({ type: 'error', status: 500, message: 'Something went wrong generating a response.' });
    res.end();
  }
}

// POST /api/ai/draft-follow-up â€” draft a follow-up message for a lead.
async function draftFollowUp(req, res, next) {
  try {
    const { leadId } = req.body;
    if (!leadId || Number.isNaN(Number(leadId))) {
      return res.status(400).json({ message: 'A valid "leadId" is required.' });
    }

    // Fetch the lead using the exact same role-scoped filter as REST getLeadById().
    // team_lead gets access only to agents/team_leads they manage, never to admin-owned leads.
    const roleFilter = await getRoleFilter(req.user);
    const lead = await Lead.findOne({
      where: { id: leadId, ...roleFilter },
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'role', 'avatar_url'] }],
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    const recentActivity = await Activity.findOne({
      where: { deal_id: { [Op.in]: (await Deal.findAll({ where: { lead_id: lead.id }, attributes: ['id'] })).map((d) => d.id) } },
      order: [['id', 'DESC']],
      attributes: ['type', 'notes'],
    });

    const result = await aiService.draftFollowUp({
      user: req.user,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source,
        owner_name: lead.owner?.name,
      },
      context: {
        lastActivity: recentActivity ? `${recentActivity.type}: ${recentActivity.notes || ''}`.trim() : null,
      },
    });

    return res.json({ message: 'Follow-up draft generated.', data: { text: result.text } });
  } catch (error) {
    if (error.code) return handleAIError(error, res);
    next(error);
  }
}

module.exports = { askAssistant, chat, draftFollowUp };

