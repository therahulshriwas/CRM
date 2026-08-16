// backend/models/passwordReset.model.js
// Defines the PasswordReset model storing hashed OTPs for the forgot/reset password flow.
// Used in: backend/models/index.js (associations) and auth controllers.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PasswordReset = sequelize.define('PasswordReset', {
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
  otp_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'password_resets',
  updatedAt: false,
});

module.exports = PasswordReset;
