// backend/models/lead.model.js
// Defines the Lead database model (id, owner_id, name, phone, email, source, status).
// Used in: backend/models/index.js (associations) and leads controllers.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Website', // e.g. Website, Referral, Cold Call, LinkedIn
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'New', // e.g. New, Contacted, Qualified, Lost
  },
}, {
  tableName: 'leads',
});

module.exports = Lead;
