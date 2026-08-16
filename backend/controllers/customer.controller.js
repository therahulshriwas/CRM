// backend/controllers/customer.controller.js
// Customer module — aggregates leads that have deals into a customer directory with lifetime value,
// deal count, and last purchase date. Respects role-based visibility via getRoleFilter.
// Secure route: admin, team_lead, agent.

const { Lead, Deal } = require('../models');
const { Op } = require('sequelize');
const { getRoleFilter } = require('./lead.controller');

// Lists customers (leads with at least one deal) with aggregate purchase stats.
async function getCustomers(req, res, next) {
  try {
    const roleFilter = await getRoleFilter(req.user);
    const { search, page = 1, limit = 12 } = req.query;

    const whereClause = { ...roleFilter };
    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (ch) => `\\${ch}`);
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${escaped}%` } },
        { email: { [Op.like]: `%${escaped}%` } },
      ];
    }

    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);
    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 12;
    if (limitNum > 100) limitNum = 100;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: leads } = await Lead.findAndCountAll({
      where: whereClause,
      include: [{ model: Deal, as: 'deals', required: true }],
      distinct: true,
      order: [['created_at', 'DESC']],
      offset,
      limit: limitNum,
    });

    // Build customer objects from leads that have at least one deal.
    const customers = leads
      .map((lead) => {
        const deals = lead.deals || [];
        if (deals.length === 0) return null;
        const totalValue = deals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        const wonDeals = deals.filter((d) => d.stage === 'Won');
        const lastPurchase = deals
          .map((d) => d.close_date)
          .filter(Boolean)
          .sort((a, b) => new Date(b) - new Date(a))[0];
        return {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          dealCount: deals.length,
          wonDeals: wonDeals.length,
          totalValue,
          lastPurchase: lastPurchase || null,
          createdAt: lead.created_at,
        };
      })
      .filter(Boolean);

    return res.json({
      customers,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCustomers };
