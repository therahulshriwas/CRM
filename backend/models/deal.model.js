// backend/models/deal.model.js
// Defines the Deal database model (id, lead_id, owner_id, title, value, stage, close_date).
// Used in: backend/models/index.js (associations) and deals controllers.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Deal = sequelize.define('Deal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  lead_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'leads',
      key: 'id',
    },
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  stage: {
    type: DataTypes.ENUM('Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'),
    allowNull: false,
    defaultValue: 'Qualified',
  },
  close_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'deals',
});

module.exports = Deal;
