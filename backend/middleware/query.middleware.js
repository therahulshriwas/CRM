// backend/middleware/query.middleware.js
// Validates and bounds shared pagination query parameters before controller execution.
// Used in: backend/server.js for every API route that accepts optional pagination.

function validateQuery(req, res, next) {
  const page = req.query.page;
  const limit = req.query.limit;
  if (page !== undefined && (!/^\d+$/.test(String(page)) || Number(page) < 1)) {
    return res.status(400).json({ message: 'page must be a positive integer.' });
  }
  if (limit !== undefined && (!/^\d+$/.test(String(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({ message: 'limit must be an integer between 1 and 100.' });
  }
  next();
}

module.exports = validateQuery;
