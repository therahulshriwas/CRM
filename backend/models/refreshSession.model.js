// backend/models/refreshSession.model.js
// Stores hashed refresh-token sessions for rotation, reuse detection, and revocation.
// Used in: auth controller and the production migration runner.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RefreshSession = sequelize.define('RefreshSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  token_hash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: { type: DataTypes.DATE, allowNull: true },
  replaced_by_hash: { type: DataTypes.STRING(128), allowNull: true },
}, {
  tableName: 'refresh_sessions',
  indexes: [
    { fields: ['user_id', 'revoked_at'] },
    { unique: true, fields: ['token_hash'] },
  ],
});

module.exports = RefreshSession;
