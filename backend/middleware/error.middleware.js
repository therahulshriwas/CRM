// backend/middleware/error.middleware.js
// Global Express error handling middleware that sends consistent JSON error responses.
// Used in: backend/server.js as the final middleware.

function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  } else {
    console.error('Unhandled server error:', err.name || 'Error');
  }

  const statusCode = err.statusCode
    || (err.name === 'SequelizeValidationError' ? 400 : null)
    || (err.name === 'SequelizeUniqueConstraintError' ? 409 : null)
    || 500;
  const message = statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Request failed.');

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Only return stack traces in development mode for security reasons
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = errorHandler;
