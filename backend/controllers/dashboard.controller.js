// backend/controllers/dashboard.controller.js
// Aggregates dashboard analytics data (KPI stats, charts, activities, deals) with role filtering.
// Used in: backend/routes/dashboard.routes.js and backend/sockets/dashboardSocket.js

const { Lead, Deal, User, Activity } = require('../models');
const { getRoleFilter } = require('./lead.controller');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// Aggregates dashboard data based on user role and ID
async function calculateDashboardStats(user) {
  const roleFilter = await getRoleFilter(user);

  // 1. Fetch leads count
  const totalLeads = await Lead.count({ where: roleFilter });
  const newLeads = await Lead.count({
    where: {
      ...roleFilter,
      status: 'New',
    },
  });

  // 2. Fetch deals count and details
  const deals = await Deal.findAll({
    where: roleFilter,
    include: [{ model: Lead, as: 'lead' }],
  });

  // Calculate stats
  const wonDeals = deals.filter(d => d.stage === 'Won');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
  const totalProfit = totalRevenue * 0.85; // Est. 85% profit margin

  // Unique customers (leads with won deals)
  const customerIds = new Set(wonDeals.map(d => d.lead_id));
  const totalCustomers = customerIds.size;

  // Conversion rate (leads with won deals / total leads)
  const conversionRate = totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0;

  // 3. Revenue Overview Timeline (Grouped by month for the last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: monthNames[d.getMonth()],
    });
  }
  const revenueByMonth = {};
  months.forEach((m) => {
    revenueByMonth[m.key] = { month: m.month, revenue: 0 };
  });
  wonDeals.forEach(deal => {
    if (deal.close_date) {
      const closeDate = new Date(deal.close_date);
      const key = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
      if (revenueByMonth[key]) {
        revenueByMonth[key].revenue += parseFloat(deal.value || 0);
      }
    }
  });
  const revenueTimeline = months.map((m) => revenueByMonth[m.key]);

  // 3b. Leads trend: new leads created per month over the last 6 months (powers the stat-card sparkline).
  const leadsTrendRaw = await Lead.findAll({
    where: roleFilter,
    attributes: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
    raw: true,
  });
  const leadsByMonth = {};
  months.forEach((m) => { leadsByMonth[m.key] = { month: m.month, count: 0 }; });
  leadsTrendRaw.forEach((row) => {
    if (row.month in leadsByMonth) leadsByMonth[row.month].count = parseInt(row.count, 10);
  });
  const leadsTrend = months.map((m) => leadsByMonth[m.key]);

  // 3c. Customers trend: won deals closed per month over the last 6 months (new customers per month).
  const customersTrendRaw = await Deal.findAll({
    where: { ...roleFilter, stage: 'Won' },
    attributes: [[sequelize.fn('DATE_FORMAT', sequelize.col('close_date'), '%Y-%m'), 'month'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('close_date'), '%Y-%m')],
    raw: true,
  });
  const customersByMonth = {};
  months.forEach((m) => { customersByMonth[m.key] = { month: m.month, count: 0 }; });
  customersTrendRaw.forEach((row) => {
    if (row.month in customersByMonth) customersByMonth[row.month].count = parseInt(row.count, 10);
  });
  const customersTrend = months.map((m) => customersByMonth[m.key]);

  // 3d. Growth: month-over-month revenue change (%) between the two most recent months.
  const monthValues = revenueTimeline.map((r) => r.revenue);
  const growth = monthValues.length >= 2 && monthValues[monthValues.length - 2] > 0
    ? Math.round(((monthValues[monthValues.length - 1] - monthValues[monthValues.length - 2]) / monthValues[monthValues.length - 2]) * 100)
    : 0;

  // 4. Sales by Source (Donut Chart data)
  // Counts deals per lead source
  const sourceCounts = {};
  deals.forEach(deal => {
    const source = deal.lead?.source || 'Website';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const salesBySource = Object.keys(sourceCounts).map(source => ({
    source,
    count: sourceCounts[source],
    percentage: deals.length > 0 ? Math.round((sourceCounts[source] / deals.length) * 100) : 0,
  }));

  // 5. Recent Deals list (top 5)
  const recentDeals = await Deal.findAll({
    where: roleFilter,
    include: [
      { model: Lead, as: 'lead', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'owner', attributes: ['id', 'name', 'role', 'avatar_url'] },
    ],
    limit: 5,
    order: [['created_at', 'DESC']],
  });

  // 6. Recent Activities list (top 5)
  const activityWhere = {};
  if (user.role === 'agent') {
    // Agent only sees activities of their own deals
    const userDeals = deals.map(d => d.id);
    activityWhere.deal_id = { [Op.in]: userDeals };
  } else if (user.role === 'team_lead') {
    // Team lead sees activities of their own + agents' deals
    const userDeals = deals.map(d => d.id);
    activityWhere.deal_id = { [Op.in]: userDeals };
  }

  const recentActivities = await Activity.findAll({
    where: activityWhere,
    include: [
      {
        model: Deal,
        as: 'deal',
        attributes: ['id', 'title'],
      },
    ],
    limit: 5,
    order: [['created_at', 'DESC']],
  });

  // 7. Pipeline stage aggregation (for the compact kanban preview)
  const pipeline = {
    Qualified: deals.filter(d => d.stage === 'Qualified').map(d => d.id).length,
    Proposal: deals.filter(d => d.stage === 'Proposal').map(d => d.id).length,
    Negotiation: deals.filter(d => d.stage === 'Negotiation').map(d => d.id).length,
    Won: deals.filter(d => d.stage === 'Won').map(d => d.id).length,
    Lost: deals.filter(d => d.stage === 'Lost').map(d => d.id).length,
  };

  return {
    kpis: {
      totalRevenue,
      totalProfit,
      totalCustomers,
      newLeads,
      conversionRate,
      growth, // real month-over-month revenue change (%)
    },
    charts: {
      revenueTimeline,
      salesBySource,
      leadsTrend,
      customersTrend,
    },
    deals,          // ALL role-scoped deals (forecast + funnel use full pipeline)
    recentDeals,    // top 5 for the dashboard table
    recentActivities,
    pipeline,
  };
}

// Controller entry point for dashboard stats HTTP requests
// Secure route: admin, team_lead, agent.
async function getDashboardStats(req, res, next) {
  try {
    const stats = await calculateDashboardStats(req.user);
    return res.json(stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  calculateDashboardStats,
};

