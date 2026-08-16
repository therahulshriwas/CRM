// backend/controllers/upload.controller.js
// Profile image upload handlers. Receives a single image file from the auth'd
// user (or, for admins, an explicit target user), stores it under /uploads,
// updates the user's avatar_url/cover_url, and removes the previously stored
// image to avoid orphaned files. Also supports removing the avatar entirely.
// Used in: backend/routes/upload.routes.js.

const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { UPLOAD_DIR } = require('../middleware/upload.middleware');
const { createNotification, notifyAdmins } = require('../services/notification.service');

function publicUrl(filePath) {
  if (!filePath) return null;
  const relative = path.relative(UPLOAD_DIR, filePath).split(path.sep).join('/');
  return relative ? `/uploads/${relative}` : null;
}

const SAFE_FIELDS = [
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

function safeUser(user) {
  const row = user?.get?.({ plain: true }) || user || {};
  const out = {};
  for (const field of SAFE_FIELDS) {
    if (row[field] !== undefined) out[field] = row[field];
  }
  return out;
}

function removeFile(filePath) {
  if (!filePath) return;
  const absolute = path.join(UPLOAD_DIR, filePath.replace(/^\/uploads\//, ''));
  fs.unlink(absolute, () => {});
}

// Resolves the target user id: admins may operate on another user via
// req.body.userId (or ?userId=), everyone else is restricted to themself.
function resolveTargetUserId(req) {
  if (req.user.role === 'admin') {
    const explicit = req.body?.userId ?? req.query?.userId;
    if (explicit !== undefined && explicit !== null && explicit !== '') return Number(explicit);
  }
  return req.user.id;
}

// Emits avatar-change notifications to the affected user and all admins.
function notifyAvatarChange({ user, actor, changedWhat, action }) {
  const isSelf = actor.id === user.id;
  const title = isSelf ? `${changedWhat} updated` : `${changedWhat} updated by ${actor.name}`;
  const message = isSelf
    ? `You ${action} your ${changedWhat.toLowerCase()}.`
    : `${actor.name} ${action} ${user.name}'s ${changedWhat.toLowerCase()}.`;
  createNotification({ userId: user.id, type: 'profile', title, message }).catch(() => {});
  notifyAdmins({ type: 'profile', title, message }).catch(() => {});
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file received.' });
    }

    const targetUserId = resolveTargetUserId(req);
    const user = await User.findByPk(targetUserId);
    if (!user) {
      removeFile(req.file.path);
      return res.status(404).json({ message: 'User not found.' });
    }

    const previous = user.avatar_url;
    const avatarUrl = publicUrl(req.file.path);
    await user.update({ avatar_url: avatarUrl });

    if (previous && previous !== avatarUrl) removeFile(previous);

    notifyAvatarChange({ user, actor: req.user, changedWhat: 'Avatar', action: 'updated' });

    return res.json({ message: 'Avatar updated successfully.', avatarUrl, user: safeUser(user) });
  } catch (error) {
    if (req.file) removeFile(req.file.path);
    next(error);
  }
}

async function uploadCover(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file received.' });
    }

    const targetUserId = resolveTargetUserId(req);
    const user = await User.findByPk(targetUserId);
    if (!user) {
      removeFile(req.file.path);
      return res.status(404).json({ message: 'User not found.' });
    }

    const previous = user.cover_url;
    const coverUrl = publicUrl(req.file.path);
    await user.update({ cover_url: coverUrl });

    if (previous && previous !== coverUrl) removeFile(previous);

    return res.json({ message: 'Cover updated successfully.', coverUrl, user: safeUser(user) });
  } catch (error) {
    if (req.file) removeFile(req.file.path);
    next(error);
  }
}

// Removes the avatar entirely: clears avatar_url and deletes the stored file.
// Admins may remove another user's avatar via userId.
async function removeAvatar(req, res, next) {
  try {
    const targetUserId = resolveTargetUserId(req);
    const user = await User.findByPk(targetUserId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const previous = user.avatar_url;
    if (previous) {
      await user.update({ avatar_url: null });
      removeFile(previous);
    }

    notifyAvatarChange({ user, actor: req.user, changedWhat: 'Avatar', action: 'removed' });

    return res.json({ message: 'Avatar removed successfully.', user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadAvatar,
  uploadCover,
  removeAvatar,
};
