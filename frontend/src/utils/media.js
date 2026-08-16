// frontend/src/utils/media.js
// Resolves server-relative media URLs (e.g. "/uploads/avatars/x.png") to
// absolute URLs against the API origin so <img> can load them directly.

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    const origin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';
    const base = origin.replace(/\/api\/?$/, '');
    return `${base}${url}`;
  }
  return url;
}
