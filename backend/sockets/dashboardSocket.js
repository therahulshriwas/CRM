// backend/sockets/dashboardSocket.js
// Handles real-time dashboard subscriptions via Socket.io, validating JWTs and pushing tailored stats.
// Used in: backend/server.js and database controller operations.

const { calculateDashboardStats } = require('../controllers/dashboard.controller');
const socketAuthMiddleware = require('../utils/socketAuth');

let globalIo = null;

// Sets up Socket.io middleware and connection handlers for the dashboard
function initDashboardSocket(io) {
  globalIo = io;

  // Middleware to authenticate socket connections using JWT tokens
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id} (User: ${socket.user.email}, Role: ${socket.user.role})`);

    // Immediately push initial stats to the connected client
    sendDashboardUpdateToSocket(socket).catch(console.error);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
}

// Sends role-filtered dashboard stats to a single connected socket client
async function sendDashboardUpdateToSocket(socket) {
  try {
    const stats = await calculateDashboardStats(socket.user);
    socket.emit('dashboard:update', stats);
  } catch (error) {
    console.error(`Failed to push dashboard update to socket ${socket.id}:`, error.message);
  }
}

// Broadcasts updated dashboard statistics to all connected clients individually, respecting their roles
async function broadcastDashboardUpdate() {
  if (!globalIo) {
    console.warn('Socket.io server not initialized for dashboard broadcasts.');
    return;
  }

  const sockets = await globalIo.fetchSockets();
  for (const socket of sockets) {
    // Re-verify and update stats for each active socket based on its specific user context
    sendDashboardUpdateToSocket(socket).catch(console.error);
  }
}

module.exports = {
  initDashboardSocket,
  broadcastDashboardUpdate,
};
