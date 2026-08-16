// backend/services/mail/mailService.js
// Abstraction over email delivery. Uses nodemailer when SMTP is configured in .env;
// otherwise falls back to logging the email body to the console for local development.
// Used in: backend/controllers/auth.controller.js (forgot password OTP).

const nodemailer = require('nodemailer');

// Builds a nodemailer transporter from env config (or null when SMTP is not configured).
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

// Sends a plain-text email. Falls back to a console log in development when SMTP is unset.
async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('Mail delivery is not configured.');
      error.statusCode = 503;
      throw error;
    }
    // Development fallback: print the email so flows can be tested without a mail server.
    console.log(`\n[MAIL DEV MODE] To: ${to}`);
    console.log(`[MAIL DEV MODE] Subject: ${subject}`);
    if (text) console.log(`[MAIL DEV MODE] Body:\n${text}`);
    return { dev: true, to, subject };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER || 'noreply@antigravity.local',
    to,
    subject,
    text,
    html,
  });
  return { dev: false, to, subject };
}

module.exports = { sendEmail };
