// backend/controllers/notification.controller.js
// In-app notification management: listing, marking single/all read, and unread counts.
// Secure routes: admin, team_lead, agent (each user only accesses their own notifications).

const { Notification } = require('../models');

// Lists the current user's notifications, newest first.
async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    return res.json({
      notifications: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Returns the unread notification count for the topbar badge.
async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, read: false },
    });
    return res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
}

// Marks a single notification as read (ownership enforced).
async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    await notification.update({ read: true });
    return res.json({ notification });
  } catch (error) {
    next(error);
  }
}

// Marks all of the current user's notifications as read.
async function markAllRead(req, res, next) {
  try {
    await Notification.update(
      { read: true },
      { where: { user_id: req.user.id, read: false } }
    );
    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
