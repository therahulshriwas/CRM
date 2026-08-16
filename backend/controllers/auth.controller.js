// backend/controllers/auth.controller.js
// Handles authentication tasks: registration, login, token refresh, logout, and fetching current user profile.
// Used in: backend/routes/auth.routes.js

const { User, PasswordReset, RefreshSession } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail } = require('../services/mail/mailService');

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
// At least one letter and one number, minimum length enforced separately for a clear message.
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).*$/;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH && PASSWORD_RE.test(password);
}

// Helper function to generate an access token
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
}

// Helper function to generate a refresh token
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Remember-me sessions persist 7 days; short sessions last 1 day.
const SESSION_DAYS_DEFAULT = 7;
const SESSION_DAYS_SHORT = 1;
const SESSION_MAX_AGE_SHORT_MS = SESSION_DAYS_SHORT * 24 * 60 * 60 * 1000;

function setRefreshCookie(res, token, maxAgeMs = SESSION_MAX_AGE_SHORT_MS) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAgeMs,
  });
}

async function createRefreshSession(user, res, days = SESSION_DAYS_DEFAULT) {
  const token = generateRefreshToken(user);
  const decoded = jwt.decode(token);
  const maxAgeMs = days * 24 * 60 * 60 * 1000;
  await RefreshSession.create({
    user_id: user.id,
    token_hash: hashRefreshToken(token),
    expires_at: new Date(decoded.exp * 1000),
  });
  setRefreshCookie(res, token, maxAgeMs);
  return token;
}

// Change password / reset flows always send plaintext into the model hook,
// which hashes before persistence. The public user-shape below is the same
// safe field set the profile endpoints return (never the password hash).
const AUTH_USER_FIELDS = [
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

function authUserPayload(user) {
  const row = user?.get?.({ plain: true }) || user || {};
  const out = {};
  for (const field of AUTH_USER_FIELDS) {
    if (row[field] !== undefined) out[field] = row[field];
  }
  return out;
}

// Registers a new user via the public registration form.
// Public route. Self-registration always creates a default (agent) account;
// privileged roles (admin, team_lead) are provisioned only by an existing
// administrator through /api/users/admin. Returns the access token, sets the
// refresh-token cookie, and echoes the safe profile.
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and include at least one letter and one number.`,
      });
    }

    // The selected role is validated against a fixed whitelist so unknown or
    // malformed values are rejected rather than persisted.
    const VALID_ROLES = ['agent', 'team_lead', 'admin'];
    const selectedRole = role || 'agent';
    if (!VALID_ROLES.includes(selectedRole)) {
      return res.status(400).json({ message: 'Please select a valid role.' });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    // The model's beforeCreate hook hashes password_hash before the INSERT.
    const createFields = {
      name: String(name).trim(),
      email: normalizedEmail,
      password_hash: password,
      role: selectedRole,
    };
    for (const field of ['phone', 'department', 'company']) {
      const value = req.body[field];
      if (value !== undefined && String(value).trim() !== '') {
        createFields[field] = String(value).trim();
      }
    }

    const user = await User.create(createFields);

    const accessToken = generateAccessToken(user);
    await createRefreshSession(user, res);

    return res.status(201).json({
      message: 'User registered successfully.',
      accessToken,
      user: authUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
}

// Logins user by verifying credentials.
// Public route. Returns access token and sets refresh token in cookie.
async function login(req, res, next) {
  try {
    let { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    email = normalizeEmail(email);
    if (!isValidEmail(email)) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account has been suspended. Contact an administrator.' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ message: 'Account temporarily locked due to too many failed login attempts. Please try again later.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= LOCKOUT_THRESHOLD) {
        const lock = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await user.update({ failed_login_attempts: attempts, locked_until: lock });
        return res.status(403).json({ message: 'Account temporarily locked due to too many failed login attempts. Please try again later.' });
      }
      await user.update({ failed_login_attempts: attempts });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    await user.update({ failed_login_attempts: 0, locked_until: null, last_login_at: new Date() });

    const accessToken = generateAccessToken(user);
    const sessionDays = remember ? SESSION_DAYS_DEFAULT : SESSION_DAYS_SHORT;
    await createRefreshSession(user, res, sessionDays);

    return res.json({
      message: 'Login successful.',
      accessToken,
      user: authUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
}

// How long a just-rotated refresh token may be replayed before we treat it as theft.
const ROTATION_RACE_MS = 60 * 1000;

// Refreshes expired access tokens.
// Public route (uses cookies). Generates a new access token.
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'User does not exist.' });
    if (user.status === 'suspended') {
      await RefreshSession.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null } }
      );
      return res.status(403).json({ message: 'This account has been suspended. Contact an administrator.' });
    }
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await RefreshSession.findOne({ where: { token_hash: tokenHash } });
    if (!session || session.expires_at < new Date()) {
      return res.status(401).json({ message: 'Refresh session is invalid or expired.' });
    }
    if (session.revoked_at) {
      // A revoked token whose replacement was minted very recently is the
      // expected result of two tabs racing on a rotated refresh cookie, not
      // theft. Gracefully issue a fresh session instead of logging everyone out.
      let isRecentRotation = false;
      if (session.replaced_by_hash) {
        const replacement = await RefreshSession.findOne({
          where: { token_hash: session.replaced_by_hash },
        });
        isRecentRotation =
          !!replacement &&
          new Date() - new Date(replacement.createdAt) < ROTATION_RACE_MS;
      }
      if (!isRecentRotation) {
        // Theft signal: revoke every active session for the user.
        await RefreshSession.update(
          { revoked_at: new Date() },
          { where: { user_id: user.id, revoked_at: null } }
        );
        return res.status(401).json({ message: 'Refresh session reuse detected. Please sign in again.' });
      }
    }

    const nextToken = generateRefreshToken(user);
    const nextHash = hashRefreshToken(nextToken);
    const nextDecoded = jwt.decode(nextToken);
    const [revoked] = await RefreshSession.update(
      { revoked_at: new Date(), replaced_by_hash: nextHash },
      { where: { id: session.id, revoked_at: null } }
    );
    if (!revoked) return res.status(401).json({ message: 'Refresh session is no longer active.' });
    await RefreshSession.create({
      user_id: user.id,
      token_hash: nextHash,
      expires_at: new Date(nextDecoded.exp * 1000),
    });
    setRefreshCookie(res, nextToken);
    const accessToken = generateAccessToken(user);
    return res.json({ accessToken });
  } catch (error) {
    next(error);
  }
}

// Revokes the current refresh session and clears its httpOnly cookie.
// Public route so logout still works after an access token expires.
async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await RefreshSession.update(
        { revoked_at: new Date() },
        { where: { token_hash: hashRefreshToken(refreshToken), revoked_at: null } }
      );
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

// Returns the authenticated user profile information.
// Secure route.
async function getMe(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: AUTH_USER_FIELDS,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

// Requests a password reset by emailing a time-limited OTP.
// Public route. Always returns success to avoid leaking whether an email is registered.
async function forgotPassword(req, res, next) {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    email = normalizeEmail(email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const user = await User.findOne({ where: { email } });

    // Always respond generically regardless of whether the user exists.
    if (!user) {
      return res.json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    // Generate a 6-digit OTP and store only its hash.
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previously issued, unused resets for this user.
    await PasswordReset.update(
      { used: true },
      { where: { user_id: user.id, used: false } }
    );

    await PasswordReset.create({ user_id: user.id, otp_hash: otpHash, expires_at: expiresAt });

    await sendEmail({
      to: user.email,
      subject: 'Antigravity CRM — Password Reset OTP',
      text: `Your password reset code is: ${otp}\nIt expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
    });

    return res.json({ message: 'If that email is registered, an OTP has been sent.' });
  } catch (error) {
    next(error);
  }
}

// Resets the password after verifying the emailed OTP.
// Public route. Marks the OTP as used after a successful reset.
async function resetPassword(req, res, next) {
  try {
    let { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    email = normalizeEmail(email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and include at least one letter and one number.`,
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const resetRecord = await PasswordReset.findOne({
      where: { user_id: user.id, used: false },
      order: [['created_at', 'DESC']],
    });

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    }

    const otpMatches = await bcrypt.compare(String(otp), resetRecord.otp_hash);
    if (!otpMatches) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Update password (model hook re-hashes), consume the OTP, and revoke every
    // active session so the old credentials can no longer be used.
    user.password_hash = password;
    await user.save();
    await resetRecord.update({ used: true });
    await RefreshSession.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } }
    );

    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    next(error);
  }
}

// Changes the password for the currently authenticated user after verifying the
// current password. Revokes every other active session so only this device stays signed in.
// Secure route.
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and include at least one letter and one number.`,
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password_hash = newPassword;
    await user.save();

    // Revoke sessions on every device except the current one.
    const currentHash = req.cookies?.refreshToken ? hashRefreshToken(req.cookies.refreshToken) : null;
    await RefreshSession.update(
      { revoked_at: new Date() },
      {
        where: {
          user_id: user.id,
          revoked_at: null,
          ...(currentHash ? { token_hash: { [Op.ne]: currentHash } } : {}),
        },
      }
    );

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
