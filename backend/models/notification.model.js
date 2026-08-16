// backend/models/notification.model.js
// Defines the Notification model (id, user_id, type, title, message, read).
// Used in: backend/models/index.js (associations) and notification controllers/socket.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general', // e.g. message, deal, reminder
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'notifications',
  updatedAt: false, // Notifications are immutable; only `read` flips via explicit update
});

module.exports = Notification;
