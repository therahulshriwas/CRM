// backend/controllers/report.controller.js
// Generates extended analytics for the Reports page: activity heatmap, conversion funnel,
// lead source trends, and deal velocity. All aggregations are role-scoped.
// Used in: backend/routes/report.routes.js.

const { Lead, Deal, Activity } = require('../models');
const { getRoleFilter } = require('./lead.controller');
const { Op } = require('sequelize');

// Activity heatmap: count activities grouped by day of week and hour.
async function getActivityHeatmap(user) {
  const roleFilter = await getRoleFilter(user);
  const activities = await Activity.findAll({
    where: {
      deal_id: {
        [Op.in]: (
          await Deal.findAll({ where: roleFilter, attributes: ['id'] })
        ).map((d) => d.id),
      },
    },
    attributes: ['created_at'],
    raw: true,
  });

  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  activities.forEach((a) => {
    const date = new Date(a.created_at);
    const day = date.getDay(); // 0=Sun ... 6=Sat
    const hour = date.getHours();
    heatmap[day][hour] += 1;
  });

  return heatmap;
}

// Conversion funnel: leads by status progression.
async function getConversionFunnel(user) {
  const roleFilter = await getRoleFilter(user);
  const leads = await Lead.findAll({ where: roleFilter, attributes: ['status'] });
  const funnel = {};
  leads.forEach((lead) => {
    funnel[lead.status] = (funnel[lead.status] || 0) + 1;
  });
  return funnel;
}

// Lead source trend over the last 6 months.
async function getLeadSourceTrend(user) {
  const roleFilter = await getRoleFilter(user);
  const leads = await Lead.findAll({
    where: roleFilter,
    attributes: ['source', 'created_at'],
    raw: true,
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const trend = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trend[key] = { month: monthNames[d.getMonth()], counts: {} };
  }

  leads.forEach((lead) => {
    const created = new Date(lead.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    if (trend[key]) {
      trend[key].counts[lead.source] = (trend[key].counts[lead.source] || 0) + 1;
    }
  });

  return Object.values(trend);
}

// Deal velocity: average days to close per stage.
async function getDealVelocity(user) {
  const roleFilter = await getRoleFilter(user);
  const wonDeals = await Deal.findAll({
    where: { ...roleFilter, stage: 'Won' },
    attributes: ['stage', 'created_at', 'close_date'],
    raw: true,
  });

  const stageDurations = {};
  const stageCounts = {};

  wonDeals.forEach((deal) => {
    if (deal.close_date) {
      const created = new Date(deal.created_at);
      const closed = new Date(deal.close_date);
      const days = Math.max(1, Math.round((closed - created) / (1000 * 60 * 60 * 24)));
      stageDurations['Won'] = (stageDurations['Won'] || 0) + days;
      stageCounts['Won'] = (stageCounts['Won'] || 0) + 1;
    }
  });

  const velocity = Object.keys(stageDurations).map((stage) => ({
    stage,
    avgDays: stageCounts[stage] > 0 ? Math.round(stageDurations[stage] / stageCounts[stage]) : 0,
    count: stageCounts[stage] || 0,
  }));

  return velocity;
}

async function getReports(req, res, next) {
  try {
    const [heatmap, funnel, sourceTrend, velocity] = await Promise.all([
      getActivityHeatmap(req.user),
      getConversionFunnel(req.user),
      getLeadSourceTrend(req.user),
      getDealVelocity(req.user),
    ]);

    return res.json({ heatmap, funnel, sourceTrend, velocity });
  } catch (error) {
    next(error);
  }
}

module.exports = { getReports };
