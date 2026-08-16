// backend/models/conversation.model.js
// Defines the Conversation model (id, type direct/group, optional name, created_by).
// Used in: backend/models/index.js (associations) and chat controllers/socket.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
    defaultValue: 'direct',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true, // Required for group conversations, null for direct
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'conversations',
});

module.exports = Conversation;
