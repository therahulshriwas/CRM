// backend/models/index.js
// Sets up relationships between database models and exports them.
// Used in: controllers, middleware, and database sync setups.

const { sequelize } = require('../config/db');
const User = require('./user.model');
const Lead = require('./lead.model');
const Deal = require('./deal.model');
const Activity = require('./activity.model');
const Conversation = require('./conversation.model');
const ConversationParticipant = require('./conversationParticipant.model');
const Message = require('./message.model');
const Notification = require('./notification.model');
const PasswordReset = require('./passwordReset.model');
const RefreshSession = require('./refreshSession.model');

// User <-> Lead Association
User.hasMany(Lead, { foreignKey: 'owner_id', as: 'leads' });
Lead.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User <-> Deal Association
User.hasMany(Deal, { foreignKey: 'owner_id', as: 'deals' });
Deal.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Lead <-> Deal Association
Lead.hasMany(Deal, { foreignKey: 'lead_id', as: 'deals' });
Deal.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// Deal <-> Activity Association
Deal.hasMany(Activity, { foreignKey: 'deal_id', as: 'activities', onDelete: 'CASCADE' });
Activity.belongsTo(Deal, { foreignKey: 'deal_id', as: 'deal' });

// Conversation <-> Participants (many-to-many through conversation_participants)
Conversation.belongsToMany(User, {
  through: ConversationParticipant,
  foreignKey: 'conversation_id',
  otherKey: 'user_id',
  as: 'participants',
});
User.belongsToMany(Conversation, {
  through: ConversationParticipant,
  foreignKey: 'user_id',
  otherKey: 'conversation_id',
  as: 'conversations',
});
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
ConversationParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Conversation <-> Messages
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

// User <-> Sent Messages
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// User <-> Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Password Resets
User.hasMany(PasswordReset, { foreignKey: 'user_id', as: 'passwordResets', onDelete: 'CASCADE' });
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Refresh Sessions
User.hasMany(RefreshSession, { foreignKey: 'user_id', as: 'refreshSessions', onDelete: 'CASCADE' });
RefreshSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Lead,
  Deal,
  Activity,
  Conversation,
  ConversationParticipant,
  Message,
  Notification,
  PasswordReset,
  RefreshSession,
};
