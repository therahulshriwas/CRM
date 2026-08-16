// backend/middleware/role.middleware.js
// Express middleware to enforce role-based access control.
// Used in: backend/routes/ to restrict endpoints by user role.

// Middleware factory that accepts an array of allowed roles
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
}

module.exports = requireRole;
