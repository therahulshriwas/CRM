// backend/utils/socketAuth.js
// Shared Socket.io connection middleware that verifies the JWT access token from the handshake.
// Used in: sockets/dashboardSocket.js and sockets/chatSocket.js to authenticate connections once.

const jwt = require('jsonwebtoken');

// Socket.io middleware — attaches the decoded user to socket.user or rejects the connection.
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token.'));
  }
}

module.exports = socketAuthMiddleware;
