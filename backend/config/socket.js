// backend/config/socket.js
// Initializes and exports the Socket.io server instance.
// Used in: backend/server.js and various socket handlers under backend/sockets/

const { Server } = require('socket.io');

let io = null;

// Configures and initializes Socket.io on the HTTP server
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  return io;
}

// Retrieves the initialized io instance
function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
}

module.exports = { initSocket, getIO };
