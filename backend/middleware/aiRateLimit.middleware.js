// backend/middleware/aiRateLimit.middleware.js
// Enterprise-grade rate limiting for AI endpoints. Provides:
//   1. Per-user request rate limiting (falls back to IP when user is missing).
//   2. Active SSE stream limiting (concurrent-stream cap per user).
// In-memory only — no Redis dependency. Designed to be mounted on the
// /api/ai router AFTER authentication so req.user is available.
//
// Used in: backend/routes/ai.routes.js.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;          // 1 minute rolling window
const RATE_LIMIT_MAX_REQUESTS = 20;               // 20 requests per window per user
const STREAM_LIMIT_MAX_CONCURRENT = 2;            // max 2 concurrent SSE streams per user
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;        // garbage-collect stale entries every 5 min

// In-memory stores (process-scoped).
// requestCounts:  { [userId]: { [windowStart]: count } }
// activeStreams:  { [userId]: count }
const requestCounts = new Map();
const activeStreams = new Map();

let cleanupScheduled = false;

function getUserId(req) {
  // Prefer the authenticated user id; fall back to IP for unauthenticated callers.
  if (req.user && req.user.id) return String(req.user.id);
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

function pruneWindows(store, userId, now) {
  const windows = store.get(userId);
  if (!windows) return;
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  let hasAlive = false;
  for (const [ts, count] of Object.entries(windows)) {
    if (Number(ts) < cutoff) {
      delete windows[ts];
    } else {
      hasAlive = true;
    }
  }
  if (!hasAlive) store.delete(userId);
}

// Periodic garbage collection for stale window entries.
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [userId, windows] of requestCounts.entries()) {
      pruneWindows(requestCounts, userId, now);
    }
  }, CLEANUP_INTERVAL_MS);
}
scheduleCleanup();

/**
 * Rate limiter middleware for AI request endpoints.
 * Returns 429 with Retry-After header when the per-user request quota is exceeded.
 */
function aiRateLimiter() {
  return (req, res, next) => {
    const userId = getUserId(req);
    // Compute the current window per-request so the bucket actually rolls over
    // as time passes (previously captured once at middleware creation, which
    // froze every user to a single bucket and locked them out after 20 calls).
    const now = Date.now();
    const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;

    // --- Request count check ---
    let windows = requestCounts.get(userId);
    if (!windows) {
      windows = {};
      requestCounts.set(userId, windows);
    }

    // Write the incremented count BEFORE pruning: pruning drops users with no
    // alive window, so pruning a freshly-created empty object would discard the
    // counter on every request and the quota would never accumulate.
    let count = windows[windowStart] || 0;
    count += 1;
    windows[windowStart] = count;

    pruneWindows(requestCounts, userId, now);

    if (count > RATE_LIMIT_MAX_REQUESTS) {
      const retryAfter = Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
      res.set('Retry-After', String(Math.max(retryAfter, 1)));
      return res.status(429).json({
        message: 'Too many AI requests. Please wait before sending more.',
        error: 'AI_RATE_LIMITED',
      });
    }

    next();
  };
}

/**
 * SSE stream concurrency limiter.
 * Middleware that tracks active streams per user and rejects new ones
 * when the per-user concurrent-stream cap is exceeded.
 *
 * Usage: mount before the route handler.
 * Cleanup happens automatically on res.end() / res.close() / 'close' / 'error'.
 *
 * Returns 429 with Retry-After when max concurrent streams are reached.
 */
function aiStreamLimiter() {
  return (req, res, next) => {
    const userId = getUserId(req);

    const current = activeStreams.get(userId) || 0;
    if (current >= STREAM_LIMIT_MAX_CONCURRENT) {
      res.set('Retry-After', '1');
      return res.status(429).json({
        message: 'Too many concurrent AI streams. Please close an existing conversation first.',
        error: 'AI_STREAM_LIMIT',
      });
    }

    activeStreams.set(userId, current + 1);

    // --- Cleanup on any response termination ---
    // Guarded so it runs exactly once: 'finish'/'close'/'error' and the raw
    // request's 'aborted'/'close' can all fire for a single stream, and a
    // double-decrement would corrupt the concurrency counter.
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      const val = activeStreams.get(userId) || 0;
      if (val <= 1) {
        activeStreams.delete(userId);
      } else {
        activeStreams.set(userId, val - 1);
      }
    };

    // Client disconnect / abort (covers normal completion via 'close' too).
    res.on('close', cleanup);
    res.on('error', cleanup);
    req.on('aborted', cleanup);
    req.on('close', cleanup);
    req.on('error', cleanup);

    next();
  };
}

module.exports = {
  aiRateLimiter,
  aiStreamLimiter,
  // Exported for testing / introspection
  _stores: { requestCounts, activeStreams },
  _config: {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    maxConcurrentStreams: STREAM_LIMIT_MAX_CONCURRENT,
  },
};
