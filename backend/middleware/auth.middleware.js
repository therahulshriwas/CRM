// backend/middleware/auth.middleware.js
// Express middleware to authenticate API requests by verifying JWT access tokens.
// Used in: backend/routes/ to secure routes.

const jwt = require('jsonwebtoken');

// Middleware to verify the JWT access token sent in the Authorization header
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // The token is expected in the format "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // Contains id, email, role, and name
    next();
  } catch (error) {
    // 401 (not 403) so the client interceptor knows it can transparently refresh.
    return res.status(401).json({ message: 'Access token expired or invalid.' });
  }
}

module.exports = authenticateToken;
