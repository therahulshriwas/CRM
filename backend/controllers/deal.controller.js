// backend/controllers/deal.controller.js
// Implements Deals actions (listing, creating, stage changes) and records history in Activities.
// Used in: backend/routes/deal.routes.js

const { Deal, Lead, User, Activity } = require('../models');
const { Op } = require('sequelize');
const { getRoleFilter, resolveOwnerId } = require('./lead.controller');
const { getIO } = require('../config/socket');
const { broadcastDashboardUpdate } = require('../sockets/dashboardSocket');
const { createNotification } = require('../services/notification.service');

// Gets all deals with role filters.
// Secure route: admin, team_lead, agent.
async function getDeals(req, res, next) {
  try {
    const roleFilter = await getRoleFilter(req.user);
    const { search, limit } = req.query;
    const whereClause = { ...roleFilter };

    if (search) {
      const escaped = String(search).replace(/[\\%_]/g, (ch) => `\\${ch}`);
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${escaped}%` } },
        { '$lead.name$': { [Op.like]: `%${escaped}%` } },
      ];
    }

    let queryLimit;
    if (limit) {
      const parsed = parseInt(limit, 10);
      queryLimit = Number.isNaN(parsed) ? 10 : Math.min(Math.max(parsed, 1), 100);
    }

    const deals = await Deal.findAll({
      where: whereClause,
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
        },
      ],
      order: [['created_at', 'DESC']],
      ...(queryLimit ? { limit: queryLimit } : {}),
    });

    return res.json({ deals });
  } catch (error) {
    next(error);
  }
}

// Creates a new deal and inserts an activity record log.
// Secure route: admin, team_lead, agent.
async function createDeal(req, res, next) {
  try {
    const { lead_id, title, value, stage, close_date, owner_id } = req.body;

    if (!lead_id || !title) {
      return res.status(400).json({ message: 'Lead ID and Title are required.' });
    }

    // Verify lead exists and belongs to the owner if the user is an agent
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return res.status(404).json({ message: 'Associated lead not found.' });
    }

    if (req.user.role === 'agent' && lead.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own the associated lead.' });
    }

    if (req.user.role === 'team_lead') {
      const leadOwner = await User.findByPk(lead.owner_id, { attributes: ['role'] });
      if (leadOwner?.role === 'admin') {
        return res.status(403).json({ message: 'Forbidden. You do not have access to admin leads.' });
      }
    }

    const assignedOwnerId = await resolveOwnerId(req.user, owner_id);

    const deal = await Deal.create({
      lead_id,
      owner_id: assignedOwnerId,
      title,
      value: value || 0.00,
      stage: stage || 'Qualified',
      close_date: close_date || null,
    });

    // Create entry in Activity log
    await Activity.create({
      deal_id: deal.id,
      type: 'deal_created',
      notes: `Deal "${title}" created at stage "${deal.stage}" with a value of $${deal.value}.`,
    });

    const fullDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] },
      ],
    });

    // Broadcast live dashboard stats updates to active socket clients
    broadcastDashboardUpdate().catch(console.error);

    return res.status(201).json({
      message: 'Deal created successfully.',
      deal: fullDeal,
    });
  } catch (error) {
    next(error);
  }
}

// Updates a deal's stage, writes an activity tracking log, and broadcasts socket updates.
// Secure route: admin, team_lead, agent.
async function updateDealStage(req, res, next) {
  try {
    const { stage } = req.body;
    const validStages = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({ message: 'A valid stage is required.' });
    }

    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found.' });
    }

    // Role verification
    if (req.user.role === 'agent' && deal.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this deal.' });
    }

    if (req.user.role === 'team_lead') {
      const owner = await User.findByPk(deal.owner_id);
      if (owner && owner.role === 'admin') {
        return res.status(403).json({ message: 'Forbidden. You do not have access to admin deals.' });
      }
    }

    const oldStage = deal.stage;
    deal.stage = stage;
    
    // Automatically set close_date if transition to won or lost occurs
    if (stage === 'Won' || stage === 'Lost') {
      deal.close_date = new Date();
    }

    await deal.save();

    // Create entry in Activity log
    await Activity.create({
      deal_id: deal.id,
      type: 'stage_change',
      notes: `Deal stage updated from "${oldStage}" to "${stage}".`,
    });

    const fullDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: Lead, as: 'lead', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] },
      ],
    });

    // Broadcast live dashboard stats updates to active socket clients
    broadcastDashboardUpdate().catch(console.error);

    // Notify the deal owner when someone else moves their deal
    if (deal.owner_id !== req.user.id) {
      createNotification({
        userId: deal.owner_id,
        type: 'deal',
        title: 'Deal stage updated',
        message: `${req.user.name} moved "${deal.title}" from ${oldStage} to ${stage}.`,
      }).catch(console.error);
    }

    return res.json({
      message: 'Deal stage updated successfully.',
      deal: fullDeal,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDeals,
  createDeal,
  updateDealStage,
};

