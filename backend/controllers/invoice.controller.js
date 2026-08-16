// backend/controllers/invoice.controller.js
// Invoices module â€” derives invoice records from won deals. Amounts come from deal value,
// dates from close_date, and statuses are inferred (Paid for won deals). Respects role visibility.
// Secure route: admin, team_lead, agent.

const { Deal, Lead, User } = require('../models');
const { Op } = require('sequelize');
const { getRoleFilter } = require('./lead.controller');

// Lists invoices (won deals) with customer/owner info, optionally filtered by status/search.
async function getInvoices(req, res, next) {
  try {
    const roleFilter = await getRoleFilter(req.user);
    const { status, search, page = 1, limit = 12 } = req.query;

    const whereClause = { ...roleFilter, stage: 'Won' };

    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);
    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 12;
    if (limitNum > 100) limitNum = 100;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: deals } = await Deal.findAndCountAll({
      where: whereClause,
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'role', 'avatar_url'] },
      ],
      order: [['close_date', 'DESC']],
      offset,
      limit: limitNum,
    });

    const invoices = deals.map((d, idx) => ({
      id: d.id,
      number: `INV-${String(d.id).padStart(4, '0')}`,
      customer: d.lead?.name || 'â€”',
      customerEmail: d.lead?.email || '',
      title: d.title,
      amount: parseFloat(d.value || 0),
      issueDate: d.created_at,
      dueDate: d.close_date || d.created_at,
      status: 'Paid',
      owner: d.owner?.name || 'â€”',
      createdAt: d.created_at,
    }));

    // Total metrics across all won deals (not just the page).
    const allWon = await Deal.findAll({
      where: { ...roleFilter, stage: 'Won' },
      attributes: ['id', 'value', 'close_date'],
    });
    const totals = {
      invoiceCount: allWon.length,
      totalAmount: allWon.reduce((sum, d) => sum + parseFloat(d.value || 0), 0),
    };

    return res.json({
      invoices,
      totals,
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

module.exports = { getInvoices };

