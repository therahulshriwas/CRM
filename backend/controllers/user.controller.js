// backend/controllers/user.controller.js
// User directory endpoint (safe fields only) for chat participant selection,
// lead/deal owner assignment, profile management, and admin user management.
// Secure routes.

const { User, RefreshSession } = require('../models');
const { createNotification, notifyAdmins } = require('../services/notification.service');

const PROFILE_FIELDS = [
  'id',
  'name',
  'email',
  'role',
  'phone',
  'avatar_url',
  'cover_url',
  'bio',
  'department',
  'timezone',
  'company',
  'status',
  'last_login_at',
  'createdAt',
];

// Fields admins/users may edit through the profile endpoints, mapped to human labels.
const EDITABLE_FIELDS = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  bio: 'Bio',
  department: 'Department',
  timezone: 'Timezone',
  company: 'Company',
  role: 'Role',
  avatar_url: 'Profile picture',
};

// Returns only the safe, serializable fields of a user instance — never the password hash.
function safeUser(user) {
  const row = user?.get?.({ plain: true }) || user || {};
  const safe = {};
  for (const field of PROFILE_FIELDS) {
    if (row[field] !== undefined) safe[field] = row[field];
  }
  return safe;
}

// Computes a human-readable list of what changed between two user snapshots.
// Returns e.g. ["Phone: 555-0100 → 555-0199", "Department: Sales → Marketing"].
function describeChanges(before, after) {
  const changes = [];
  for (const [field, label] of Object.entries(EDITABLE_FIELDS)) {
    const oldValue = before[field] === undefined || before[field] === null ? '' : String(before[field]);
    const newValue = after[field] === undefined || after[field] === null ? '' : String(after[field]);
    if (oldValue !== newValue) {
      changes.push(`${label}: ${oldValue || '(not set)'} → ${newValue || '(not set)'}`);
    }
  }
  return changes;
}

// Emits a profile-change audit notification to the affected user and all admins.
async function notifyProfileChanges({ user, actor, changes, changedWhat = 'profile' }) {
  if (!changes.length) return;
  const detail = changes.join(' · ');
  const isSelf = actor.id === user.id;
  const title = isSelf ? 'Profile updated' : `Profile updated by ${actor.name}`;
  const message = isSelf
    ? `You updated your ${changedWhat}: ${detail}`
    : `${actor.name} updated ${user.name}'s ${changedWhat}: ${detail}`;

  // The user themself gets a confirmation; every admin gets the audit trail.
  try {
    await createNotification({ userId: user.id, type: 'profile', title, message });
  } catch (error) {
    console.error('Failed to notify profile user:', error.message);
  }
  try {
    await notifyAdmins({ type: 'profile', title, message });
  } catch (error) {
    console.error('Failed to notify profile admins:', error.message);
  }
}

// Updates the signed-in user's editable profile fields and returns the safe user shape.
// Supports partial updates: only the fields present in the body are validated and applied.
async function updateProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const before = safeUser(user);
    const patch = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name cannot be empty.' });
      patch.name = name;
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }
      const duplicate = await User.findOne({ where: { email } });
      if (duplicate && duplicate.id !== req.user.id) {
        return res.status(409).json({ message: 'That email address is already in use.' });
      }
      patch.email = email;
    }

    for (const field of ['phone', 'avatar_url', 'cover_url', 'bio', 'department', 'timezone', 'company']) {
      if (req.body[field] !== undefined) {
        patch[field] = String(req.body[field]).trim();
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'At least one field must be provided.' });
    }

    await user.update(patch);

    const after = safeUser(user);
    notifyProfileChanges({ user, actor: req.user, changes: describeChanges(before, after) }).catch((error) => {
      console.error('Profile change notification failed:', error.message);
    });

    return res.json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

// Lists users for chat/assignment selectors.
async function getUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
      order: [['name', 'ASC']],
    });
    return res.json({ users });
  } catch (error) {
    next(error);
  }
}

// Admin: lists every user with management-relevant fields.
async function adminGetUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: [...PROFILE_FIELDS, 'failed_login_attempts', 'locked_until'],
      order: [['name', 'ASC']],
    });
    return res.json({ users });
  } catch (error) {
    next(error);
  }
}

// Admin: edits any user's editable profile fields (name, email, phone, bio,
// department, timezone, company). Full CRUD for admins. Emits change
// notifications to the affected user and all admins.
async function adminUpdateProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const before = safeUser(user);
    const patch = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name cannot be empty.' });
      patch.name = name;
    }

    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }
      const duplicate = await User.findOne({ where: { email } });
      if (duplicate && duplicate.id !== user.id) {
        return res.status(409).json({ message: 'That email address is already in use.' });
      }
      patch.email = email;
    }

    for (const field of ['phone', 'bio', 'department', 'timezone', 'company']) {
      if (req.body[field] !== undefined) {
        patch[field] = String(req.body[field]).trim();
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'At least one field must be provided.' });
    }

    await user.update(patch);

    const after = safeUser(user);
    notifyProfileChanges({ user, actor: req.user, changes: describeChanges(before, after) }).catch((error) => {
      console.error('Admin profile change notification failed:', error.message);
    });

    return res.json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

// Admin: updates a user's role.
async function adminUpdateRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['admin', 'team_lead', 'agent'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }
    await user.update({ role });
    return res.json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

// Admin: suspends or reactivates a user account.
async function adminSetStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot suspend your own account.' });
    }
    await user.update({ status });
    if (status === 'suspended') {
      await RefreshSession.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
    }
    return res.json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

// Admin: resets a user's password to a temporary value that must be changed on next login.
async function adminResetPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'A new password is required.' });
    }
    if (newPassword.length < 6 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and include a letter and a number.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password_hash = newPassword; // model hook re-hashes
    await user.save();
    // Force re-login everywhere.
    await RefreshSession.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } }
    );

    return res.json({ message: 'Password reset successfully. The user will need to sign in again.' });
  } catch (error) {
    next(error);
  }
}

// Admin: revokes every active session for a user (force logout).
async function adminForceLogout(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await RefreshSession.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } }
    );
    return res.json({ message: 'User signed out from all devices.' });
  } catch (error) {
    next(error);
  }
}

// Admin: creates a new user account with an explicit role.
async function adminCreateUser(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role || 'agent';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and include a letter and a number.' });
    }
    if (!['admin', 'team_lead', 'agent'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Email is already in use.' });

    const user = await User.create({ name, email, password_hash: password, role });
    return res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  updateProfile,
  adminGetUsers,
  adminUpdateProfile,
  adminUpdateRole,
  adminSetStatus,
  adminResetPassword,
  adminForceLogout,
  adminCreateUser,
};
