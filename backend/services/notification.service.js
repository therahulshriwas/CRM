// backend/services/notification.service.js
// Creates in-app notifications and pushes them live to the recipient's socket room (user:<id>).
// Used in: sockets/chatSocket.js, deal controllers, and profile/avatar change flows.

const { User, Notification } = require('../models');
const { getIO } = require('../config/socket');

// Creates a notification record and emits a live notification:new event to the user's room.
async function createNotification({ userId, type = 'general', title, message }) {
  const notification = await Notification.create({ user_id: userId, type, title, message });

  const io = getIO();
  io.to(`user:${userId}`).emit('notification:new', notification);

  return notification;
}

// Creates the same notification for several recipients at once and pushes each live.
async function createNotificationsForUsers({ userIds = [], type = 'general', title, message }) {
  if (!userIds.length) return [];
  const notifications = await Notification.bulkCreate(
    userIds.map((userId) => ({ user_id: userId, type, title, message }))
  );

  const io = getIO();
  for (const notification of notifications) {
    io.to(`user:${notification.user_id}`).emit('notification:new', notification);
  }

  return notifications;
}

// Sends a notification to every active admin (used for profile/account audit events).
async function notifyAdmins({ type = 'general', title, message }) {
  const admins = await User.findAll({
    where: { role: 'admin', status: 'active' },
    attributes: ['id'],
  });
  return createNotificationsForUsers({ userIds: admins.map((a) => a.id), type, title, message });
}

module.exports = { createNotification, createNotificationsForUsers, notifyAdmins };
