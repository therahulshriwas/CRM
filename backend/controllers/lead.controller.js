// backend/controllers/lead.controller.js
// Implements CRUD operations for Leads with role-based visibility and filters.
// Used in: backend/routes/lead.routes.js

const { Lead, User } = require('../models');
const { Op } = require('sequelize');

// Resolves and validates an owner assignment against the caller's role scope.
async function resolveOwnerId(user, requestedOwnerId) {
  if (user.role === 'agent' || !requestedOwnerId) return user.id;
  const owner = await User.findByPk(requestedOwnerId, { attributes: ['id', 'role'] });
  if (!owner) {
    const error = new Error('Assigned owner not found.');
    error.statusCode = 400;
    throw error;
  }
  if (user.role === 'team_lead' && owner.role === 'admin') {
    const error = new Error('Team leads cannot assign records to administrators.');
    error.statusCode = 403;
    throw error;
  }
  return owner.id;
}

// Helper function to build owner_id query filter based on user role
async function getRoleFilter(user) {
  if (user.role === 'agent') {
    return { owner_id: user.id };
  } else if (user.role === 'team_lead') {
    // A team_lead can see their own leads and leads owned by agents
    const agents = await User.findAll({
      where: { role: ['agent', 'team_lead'] },
      attributes: ['id'],
    });
    const agentIds = agents.map(u => u.id);
    return { owner_id: { [Op.in]: agentIds } };
  }
  // Admin sees everything
  return {};
}

// Returns the user ids a caller may filter leads by. A team_lead may only filter
// to themselves or agents; admins may filter to anyone. Guards the owner_id
// query param so it can never escape the caller's role scope (IDOR/RBAC).
async function getScopedUserIds(user) {
  if (user.role === 'team_lead') {
    const agents = await User.findAll({
      where: { role: ['agent', 'team_lead'] },
      attributes: ['id'],
    });
    return agents.map(u => u.id);
  }
  const all = await User.findAll({ attributes: ['id'] });
  return all.map(u => u.id);
}

// Escapes LIKE metacharacters so user search input cannot act as wildcards.
function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

// Clamps pagination query params to sane bounds.
function parsePagination(page, limit, maxLimit = 100) {
  let pageNum = parseInt(page, 10);
  let limitNum = parseInt(limit, 10);
  if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1;
  if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 10;
  if (limitNum > maxLimit) limitNum = maxLimit;
  return { page: pageNum, limit: limitNum };
}

// Returns the user ids a caller may filter leads by. A team_lead may only filter
// to themselves or agents; admins may filter to anyone. Guards the owner_id
// query param so it can never escape the caller's role scope (IDOR/RBAC).
async function getScopedUserIds(user) {
  if (user.role === 'team_lead') {
    const agents = await User.findAll({
      where: { role: ['agent', 'team_lead'] },
      attributes: ['id'],
    });
    return agents.map(u => u.id);
  }
  const all = await User.findAll({ attributes: ['id'] });
  return all.map(u => u.id);
}

// Retrieves all leads based on role visibility, search strings, status/source filters, and pagination.
// Secure route: admin, team_lead, agent.
async function getLeads(req, res, next) {
  try {
    const roleFilter = await getRoleFilter(req.user);
    const { status, source, owner_id, search, page = 1, limit = 10 } = req.query;

    const whereClause = { ...roleFilter };

    // Apply categorical filters if provided
    if (status) whereClause.status = status;
    if (source) whereClause.source = source;
    if (owner_id) {
      // Agents cannot override their own owner_id filter
      if (req.user.role === 'agent') {
        whereClause.owner_id = req.user.id;
      } else {
        // team_lead/admin owner overrides must still respect role visibility:
        // a team_lead may only filter to themselves or to agents (never an admin).
        const scopeIds = await getScopedUserIds(req.user);
        if (scopeIds.includes(Number(owner_id))) {
          whereClause.owner_id = owner_id;
        }
      }
    }

    // Apply search query filter (matches name or email)
    if (search) {
      const escaped = escapeLike(search);
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${escaped}%` } },
        { email: { [Op.like]: `%${escaped}%` } },
      ];
    }

    const { page: pageNum, limit: limitNum } = parsePagination(page, limit);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: leads } = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
        },
      ],
      offset,
      limit: limitNum,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      leads,
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

// Creates a new lead.
// Secure route: admin, team_lead, agent.
async function createLead(req, res, next) {
  try {
    const { name, phone, email, source, status, owner_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Lead name is required.' });
    }

    // Determine the owner: agents can only create leads for themselves; admins/team_leads can assign
    const assignedOwnerId = await resolveOwnerId(req.user, owner_id);

    const lead = await Lead.create({
      name,
      phone,
      email,
      source: source || 'Website',
      status: status || 'New',
      owner_id: assignedOwnerId,
    });

    const fullLead = await Lead.findByPk(lead.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] }],
    });

    return res.status(201).json({
      message: 'Lead created successfully.',
      lead: fullLead,
    });
  } catch (error) {
    next(error);
  }
}

// Fetches a single lead by ID.
// Secure route: admin, team_lead, agent.
async function getLeadById(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] }],
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    // Authorization check based on role
    if (req.user.role === 'agent' && lead.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this lead.' });
    }

    if (req.user.role === 'team_lead') {
      const owner = await User.findByPk(lead.owner_id);
      if (owner && owner.role === 'admin') {
        return res.status(403).json({ message: 'Forbidden. You do not have access to admin leads.' });
      }
    }

    return res.json({ lead });
  } catch (error) {
    next(error);
  }
}

// Updates an existing lead.
// Secure route: admin, team_lead, agent.
async function updateLead(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    // Access control
    if (req.user.role === 'agent' && lead.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this lead.' });
    }

    if (req.user.role === 'team_lead') {
      const owner = await User.findByPk(lead.owner_id);
      if (owner && owner.role === 'admin') {
        return res.status(403).json({ message: 'Forbidden. You do not have access to admin leads.' });
      }
    }

    const { name, phone, email, source, status, owner_id } = req.body;

    if (name) lead.name = name;
    if (phone !== undefined) lead.phone = phone;
    if (email !== undefined) lead.email = email;
    if (source) lead.source = source;
    if (status) lead.status = status;

    // Only allow admin/team_lead to change owner
    if (req.user.role !== 'agent' && owner_id) {
      lead.owner_id = await resolveOwnerId(req.user, owner_id);
    }

    await lead.save();

    const fullLead = await Lead.findByPk(lead.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] }],
    });

    return res.json({
      message: 'Lead updated successfully.',
      lead: fullLead,
    });
  } catch (error) {
    next(error);
  }
}

// Deletes a lead.
// Secure route: admin, team_lead, agent.
async function deleteLead(req, res, next) {
  try {
    const lead = await Lead.findByPk(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    // Access control
    if (req.user.role === 'agent' && lead.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You do not own this lead.' });
    }

    if (req.user.role === 'team_lead') {
      const owner = await User.findByPk(lead.owner_id);
      if (owner && owner.role === 'admin') {
        return res.status(403).json({ message: 'Forbidden. You do not have access to admin leads.' });
      }
    }

    await lead.destroy();
    return res.json({ message: 'Lead deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  getRoleFilter, // Exported to reuse in dashboard/deals controllers
  resolveOwnerId,
  getScopedUserIds,
};

