// backend/models/activity.model.js
// Defines the Activity database model (id, deal_id, type, notes, created_at).
// Used in: backend/models/index.js (associations) and dashboard/deals controllers.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  deal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'deals',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'note', // e.g. deal_created, stage_change, payment, task, note
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'activities',
  updatedAt: false, // Activities are typically write-once history records
});

module.exports = Activity;
