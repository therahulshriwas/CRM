// backend/server.js
// Main entry point for the Express backend. Syncs DB models, configures middlewares, mounts API routes, and binds Socket.io.
// Used in: backend start/dev scripts.

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Configs and models initialization
const { connectDB, sequelize } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initDashboardSocket } = require('./sockets/dashboardSocket');
const seedDatabase = require('./utils/seed');
const runMigrations = require('./utils/migrations');
const errorHandler = require('./middleware/error.middleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimit.middleware');
const validateQuery = require('./middleware/query.middleware');

// Routes imports
const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');
const dealRoutes = require('./routes/deal.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationRoutes = require('./routes/notification.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const aiRoutes = require('./routes/ai.routes');
const reportRoutes = require('./routes/report.routes');
const customerRoutes = require('./routes/customer.routes');
const calendarRoutes = require('./routes/calendar.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();
const server = http.createServer(app);

// 1. Establish database connection and sync tables
async function startServer() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured in production.');
  }
  await connectDB();

  // Migrations are the production schema contract AND the fresh-install path:
  // they create all core tables idempotently, so they run before sync. sync
  // remains opt-in for local development and only fills any residual gaps.
  await runMigrations();
  if (process.env.DB_SYNC === 'true' && process.env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: false, force: false });
  }

  // Seed default dataset in development mode
  if (process.env.NODE_ENV === 'development') {
    await seedDatabase();
  }

  // 2. Global middlewares configuration
  app.use(helmet({
    // Avatars/covers are served from the API origin and loaded cross-origin by
    // <img> tags from the client origin, so relax the resource policy for them.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(morgan('dev'));
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Serve uploaded profile images (avatars / covers) as static assets.
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // 3. Connect Socket.io
  const io = initSocket(server);
  initDashboardSocket(io);
  const initChatSocket = require('./sockets/chatSocket');
  initChatSocket(io);

  // 4. Mount API route handlers
  app.use('/api', apiLimiter);
  app.use('/api', validateQuery);
  app.use('/api/auth', authLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/deals', dealRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/employees', employeeRoutes);

  // Health check route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // 5. Global central error handling middleware (must be registered last)
  app.use(errorHandler);

  // 6. Listen on configured port
  const PORT = process.env.PORT || 5002;
  server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Critical failure on server startup:', error.stack);
  process.exit(1);
});
