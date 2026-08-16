// frontend/src/utils/security.js
// Shared security helpers for sanitizing untrusted text (AI responses, user input)
// and error messages before they are rendered or stored.
// Used in: store/aiStore.js, pages/Dashboard.jsx (AiInsightCard).

export const MAX_TEXT_LENGTH = 2000;

// Normalizes line endings and strips control characters that could corrupt
// rendering (ANSI escapes, null bytes, Unicode line/paragraph separators).
// Whitelists \n and \t. Caps length to MAX_TEXT_LENGTH.
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  let out = text.replace(/\r\n?/g, '\n');
  // eslint-disable-next-line no-control-regex
  out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u0080-\u009F]/g, '');
  out = out.replace(/[\u2028\u2029]/g, '\n');
  // Collapse 3+ consecutive newlines into a blank line separator.
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.trim();
  return out.slice(0, MAX_TEXT_LENGTH);
}

// Always returns a safe, user-friendly message. Backend-provided error details
// (paths, SQL, stacks, axios internals) are never surfaced to the UI.
// Callers supply their own generic fallback so existing UI text is preserved.
export function sanitizeErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error && typeof error === 'object' && error.name === 'AbortError') {
    return '';
  }
  return fallback;
}
