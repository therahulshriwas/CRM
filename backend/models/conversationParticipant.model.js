// backend/models/conversationParticipant.model.js
// Defines the conversation_participants join model linking users to conversations.
// Used in: backend/models/index.js (associations) and chat controllers/socket.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ConversationParticipant = sequelize.define('ConversationParticipant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id',
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'conversation_participants',
  updatedAt: false, // Participants are immutable membership records
  indexes: [{ unique: true, fields: ['conversation_id', 'user_id'] }],
});

module.exports = ConversationParticipant;
