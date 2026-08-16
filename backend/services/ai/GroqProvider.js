// backend/services/ai/GroqProvider.js
// Groq implementation of the AIProvider contract. Handles SDK initialization, single-shot
// and streaming completions, retry with exponential backoff, rate-limit (429) detection,
// request timeouts, and normalization of Groq-specific errors onto the shared AIError codes.
// The controller never touches Groq directly — it always goes through AIService.
// Used in: backend/services/ai/AIService.js (registered provider).

const AIProvider = require('./AIProvider');

// Small helper to build a normalized AI error.
function aiError(code, message, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Determine how long to wait before retrying based on a provider error/response.
function getRetryDelay(attempt, retryAfterMs) {
  if (retryAfterMs && retryAfterMs > 0) return retryAfterMs;
  // Exponential backoff with jitter: 500ms, 1000ms, 2000ms ...
  const base = 500 * 2 ** attempt;
  return base + Math.floor(Math.random() * 250);
}

// Shared message normalization: the app always passes the OpenAI-style shape
// [{ role: 'system'|'user'|'assistant', content }], which Groq accepts verbatim.
function normalizeMessages(messages) {
  return (messages || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role || 'user', content: m.content }));
}

class GroqProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.timeoutMs = config.timeoutMs || this.timeoutMs;
    this.maxRetries = config.maxRetries ?? this.maxRetries;
    this._client = null;
  }

  // Lazily initializes the Groq SDK. Uses the `groq-sdk` package so all wire-level
  // concerns (headers, transport) are handled by the official SDK.
  getClient() {
    if (this._client) return this._client;
    if (!this.apiKey) {
      throw aiError('AI_NOT_CONFIGURED', 'AI is not configured. Set GROQ_API_KEY in backend/.env to enable the assistant.');
    }
    // eslint-disable-next-line global-require
    const Groq = require('groq-sdk');
    this._client = new Groq({
      apiKey: this.apiKey,
      timeout: this.timeoutMs,
      maxRetries: 0, // we implement our own retry/backoff below
    });
    return this._client;
  }

  // Returns true when a response/error status is retryable (transient failures).
  isRetryableStatus(status) {
    return status === 429 || (status >= 500 && status <= 599);
  }

  // Builds the request body shared by generate() and stream().
  buildBody(messages, options = {}) {
    return {
      model: this.model,
      messages: normalizeMessages(messages),
      max_tokens: options.maxTokens ?? this.maxTokens,
      temperature: options.temperature ?? this.temperature,
      stream: options.stream === true,
    };
  }

  // Runs the non-streaming completion with retry + timeout.
  async generate({ messages, options = {} } = {}) {
    const client = this.getClient();
    const body = this.buildBody(messages, options);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let lastError = null;
      for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
        try {
          const completion = await client.chat.completions.create(body, {
            signal: controller.signal,
          });
          const text = (completion?.choices?.[0]?.message?.content || '').trim();
          const usage = completion?.usage
            ? { inputTokens: completion.usage.prompt_tokens, outputTokens: completion.usage.completion_tokens }
            : undefined;
          return { text, usage };
        } catch (error) {
          const normalized = this.normalizeError(error);

          // Non-retryable (or out of retries): surface immediately.
          if (normalized.code === 'AI_TIMEOUT') throw normalized;
          if (normalized.code === 'AI_PROVIDER_ERROR' && !this.isRetryableStatus(normalized.status)) {
            throw normalized;
          }

          lastError = normalized;
          if (attempt >= this.maxRetries) break;

          const retryAfterMs = Number.isFinite(Number(normalized.retryAfterMs)) ? normalized.retryAfterMs : 0;
          const wait = getRetryDelay(attempt, retryAfterMs);
          // Never wait longer than the overall timeout.
          await Promise.race([sleep(wait), new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(aiError('AI_TIMEOUT', 'AI request timed out.')), { once: true }))]);
        }
      }
      throw lastError || aiError('AI_PROVIDER_ERROR', 'AI provider error.');
    } finally {
      clearTimeout(timer);
    }
  }

  // Runs the streaming completion and yields { text } deltas as they arrive.
  async *stream({ messages, options = {} } = {}) {
    const client = this.getClient();
    const body = this.buildBody(messages, { ...options, stream: true });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let lastError = null;
      for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
        try {
          const stream = await client.chat.completions.create(body, {
            signal: controller.signal,
          });
          for await (const chunk of stream) {
            const delta = chunk?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              yield { text: delta };
            }
          }
          return; // stream completed
        } catch (error) {
          const normalized = this.normalizeError(error);

          if (normalized.code === 'AI_TIMEOUT') throw normalized;
          if (normalized.code === 'AI_PROVIDER_ERROR' && !this.isRetryableStatus(normalized.status)) {
            throw normalized;
          }

          lastError = normalized;
          if (attempt >= this.maxRetries) break;

          const retryAfterMs = Number.isFinite(Number(normalized.retryAfterMs)) ? normalized.retryAfterMs : 0;
          const wait = getRetryDelay(attempt, retryAfterMs);
          await Promise.race([sleep(wait), new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(aiError('AI_TIMEOUT', 'AI request timed out.')), { once: true }))]);
        }
      }
      throw lastError || aiError('AI_PROVIDER_ERROR', 'AI provider error.');
    } finally {
      clearTimeout(timer);
    }
  }

  // Maps Groq SDK errors onto the shared error codes.
  normalizeError(error) {
    const status = error?.status;
    const message = error?.error?.message || error?.message || 'AI provider error.';

    // Timeouts (SDK AbortError or our own).
    if (error?.name === 'AbortError' || error?.code === 'AI_TIMEOUT' || error?.constructor?.name === 'APIConnectionTimeoutError') {
      return aiError('AI_TIMEOUT', 'The AI request timed out. Please try again.');
    }

    // Missing/invalid credentials.
    if (error?.code === 'AI_NOT_CONFIGURED') return error;
    if (status === 401 || status === 403) {
      return aiError('AI_NOT_CONFIGURED', 'AI authentication failed. Check GROQ_API_KEY in backend/.env.');
    }

    // Rate limit / quota exceeded — expose retryAfterMs when the provider tells us.
    if (status === 429) {
      const retryAfter = error?.headers?.get?.('retry-after') || error?.retryAfter;
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : 0;
      const quotaMessage = /quota|exceeded|limit/i.test(message)
        ? 'The AI assistant quota is exhausted. Please try again later or ask an admin to increase the plan.'
        : 'The AI assistant is temporarily rate-limited. Please try again in a moment.';
      return aiError('AI_RATE_LIMITED', quotaMessage, { status, retryAfterMs });
    }

    // Everything else is an upstream provider failure.
    return aiError('AI_PROVIDER_ERROR', message, { status });
  }
}

module.exports = GroqProvider;
