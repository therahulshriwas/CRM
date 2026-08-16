// backend/services/ai/AIProvider.js
// Abstract base contract every AI provider must implement. This file defines the
// provider-agnostic interface used by AIService — it contains NO provider-specific
// logic and is never instantiated directly. Adding a new provider means creating a
// subclass (e.g. GroqProvider) and registering it in AIService.
//
// Interface:
//   constructor(config)                 — receives normalized config (apiKey, model, maxTokens, temperature)
//   async generate({ messages, options })   -> { text, usage? }
//   async *stream({ messages, options })    -> async generator yielding { text } deltas
//   normalizeError(error)                   -> standard AIError with a stable `code`
//
// Error codes (single source of truth, consumed by the controller):
//   AI_NOT_CONFIGURED  — missing/invalid credentials; 503
//   AI_RATE_LIMITED    — provider quota/rate limit;    503
//   AI_TIMEOUT         — request exceeded timeout;     504
//   AI_PROVIDER_ERROR  — upstream provider failure;    502

class AIProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.maxTokens = config.maxTokens || 1024;
    this.temperature = config.temperature ?? 0.7;
    this.timeoutMs = config.timeoutMs || 120000;
    this.maxRetries = config.maxRetries ?? 2;
  }

  // Subclasses must implement: single complete response.
  // Returns { text, usage? }.
  async generate() {
    throw new Error(`${this.constructor.name} must implement generate()`);
  }

  // Subclasses must implement: token-by-token streaming.
  // Returns an async generator of { text } objects.
  // eslint-disable-next-line require-yield
  async *stream() {
    throw new Error(`${this.constructor.name} must implement stream()`);
  }

  // Converts an arbitrary thrown error into a normalized error with a stable code.
  // Subclasses extend this to map provider-specific errors onto the shared codes.
  normalizeError(error) {
    if (error && error.code && ['AI_NOT_CONFIGURED', 'AI_RATE_LIMITED', 'AI_TIMEOUT', 'AI_PROVIDER_ERROR'].includes(error.code)) {
      return error;
    }
    const normalized = new Error(error?.message || 'AI provider error.');
    normalized.code = 'AI_PROVIDER_ERROR';
    normalized.originalError = error;
    return normalized;
  }
}

module.exports = AIProvider;
