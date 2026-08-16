// backend/controllers/calendar.controller.js
// Calendar module — flattens deals (by close_date) and activities into a unified event stream
// for the calendar view. Respects role-based visibility via getRoleFilter.
// Secure route: admin, team_lead, agent.

const { Deal, Lead, Activity } = require('../models');
const { Op } = require('sequelize');
const { getRoleFilter } = require('./lead.controller');

// Returns calendar events for a given month (defaults to the current month).
async function getCalendarEvents(req, res, next) {
  try {
    const roleFilter = await getRoleFilter(req.user);
    const { year, month } = req.query;
    const now = new Date();
    const y = parseInt(year, 10) || now.getFullYear();
    const m = parseInt(month, 10) || now.getMonth() + 1; // 1-12

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    // Deal milestones: deals with a close date inside the month window.
    const deals = await Deal.findAll({
      where: {
        ...roleFilter,
        close_date: { [Op.gte]: start, [Op.lt]: end },
      },
      include: [{ model: Lead, as: 'lead', attributes: ['id', 'name'] }],
      order: [['close_date', 'ASC']],
    });

    // Activities recorded inside the month window, scoped to visible deals.
    const activityWhere = {
      created_at: { [Op.gte]: start, [Op.lt]: end },
    };
    if (roleFilter.owner_id) {
      activityWhere.deal_id = { [Op.in]: deals.map((d) => d.id) };
    }

    const activities = await Activity.findAll({
      where: activityWhere,
      include: [{ model: Deal, as: 'deal', attributes: ['id', 'title'] }],
      order: [['created_at', 'ASC']],
    });

    const events = [
      ...deals.map((d) => ({
        id: `deal-${d.id}`,
        type: 'deal',
        title: d.title,
        date: d.close_date,
        stage: d.stage,
        value: parseFloat(d.value || 0),
        customer: d.lead?.name || '—',
        dealId: d.id,
      })),
      ...activities.map((a) => ({
        id: `activity-${a.id}`,
        type: 'activity',
        title: a.deal?.title ? `${a.notes || a.type} — ${a.deal.title}` : a.notes || a.type,
        date: a.created_at,
        notes: a.notes,
      })),
    ];

    return res.json({ events, month: m, year: y });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCalendarEvents };
