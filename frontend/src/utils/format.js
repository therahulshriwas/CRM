// frontend/src/utils/format.js
// Shared formatting helpers for dates, currencies and relative timestamps.
// Used in: LiveActivityFeed, RecentDealsTable, KanbanBoard, Dashboard.

// Formats a timestamp as a short relative descriptor ("Just now", "5m ago", "3d ago").
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Formats a numeric value as USD currency.
export function formatCurrency(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formats a date as a short readable string with exact time.
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  const formatted = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatted} at ${time}`;
}
