// frontend/src/utils/validation.js
// Shared client-side validation helpers for auth forms.
// Mirrors the rules enforced in backend/controllers/auth.controller.js.

export const PASSWORD_MIN_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

export function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_RE.test(password)
  );
}

export function validateEmail(email) {
  if (!email) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  if (!PASSWORD_RE.test(password)) {
    return 'Password must include at least one letter and one number';
  }
  return '';
}
