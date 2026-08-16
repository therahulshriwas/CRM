// backend/middleware/rateLimit.middleware.js
// Express rate-limiting middleware protecting sensitive endpoints (auth) from brute force and abuse.
// Used in: backend/server.js on the /api/auth router.

const rateLimit = require('express-rate-limit');

// Strict limiter for authentication endpoints (login/register/refresh).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again later.' },
});

// General API limiter applied globally as a defensive baseline.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again later.' },
});

module.exports = { authLimiter, apiLimiter };
