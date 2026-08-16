// backend/models/user.model.js
// Defines the User database model (id, name, email, password_hash, role).
// Used in: backend/models/index.js (associations) and auth controllers.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'team_lead', 'agent'),
    allowNull: false,
    defaultValue: 'agent',
  },
  phone: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  avatar_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  cover_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  company: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'users',
  hooks: {
    // Hashes password before storing a new user record
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    // Hashes password before updating an existing user record if the password has changed
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
  },
});

// Verifies if the entered password matches the stored password hash
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = User;
