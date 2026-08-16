// backend/controllers/employee.controller.js
// Employees module — directory of team members with live performance stats: deals owned,
// leads owned, won value, and open pipeline. Admins/team leads see the full roster.
// Secure route: admin, team_lead, agent.

const { User, Deal, Lead } = require('../models');
const { Op } = require('sequelize');

// Lists team members with aggregated performance metrics.
async function getEmployees(req, res, next) {
  try {
    // Agents only see themselves; managers/admins see the whole roster.
    const whereClause = req.user.role === 'agent'
      ? { id: req.user.id }
      : req.user.role === 'team_lead'
        ? { role: ['agent', 'team_lead'] }
        : {};

    const employees = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'avatar_url', 'created_at'],
      order: [['name', 'ASC']],
    });

    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const [dealCount, openPipeline, wonDeals, leadCount] = await Promise.all([
          Deal.count({ where: { owner_id: emp.id } }),
          Deal.count({ where: { owner_id: emp.id, stage: { [Op.notIn]: ['Won', 'Lost'] } } }),
          Deal.findAll({
            where: { owner_id: emp.id, stage: 'Won' },
            attributes: ['value'],
          }),
          Lead.count({ where: { owner_id: emp.id } }),
        ]);
        const wonValue = wonDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          avatar_url: emp.avatar_url,
          joinedAt: emp.created_at,
          dealCount,
          openPipeline,
          wonValue,
          leadCount,
        };
      })
    );

    const totals = enriched.reduce(
      (acc, e) => ({
        teamDeals: acc.teamDeals + e.dealCount,
        teamLeads: acc.teamLeads + e.leadCount,
        teamRevenue: acc.teamRevenue + e.wonValue,
      }),
      { teamDeals: 0, teamLeads: 0, teamRevenue: 0 }
    );

    return res.json({ employees: enriched, totals });
  } catch (error) {
    next(error);
  }
}

module.exports = { getEmployees };
