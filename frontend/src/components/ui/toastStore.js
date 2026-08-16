// frontend/src/components/ui/toastStore.js
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Imperative toast store (no React components here — keeps fast-refresh happy
// in Toast.jsx). Consumers import { toast } from this file and mount <Toaster>
// once at the app root.
//
// Usage:
//   import { toast } from '../ui/toastStore';
//   toast.success('Saved!');
//   toast.error('Failed to save', { duration: 6000 });
//   toast.loading('Syncing…');
// =============================================================================

const TOAST_DURATION = 4200;

export const toastStore = {
  listeners: new Set(),
  toasts: [],
  add(toast) {
    toast.id = toast.id ?? crypto.randomUUID();
    toast.createdAt = Date.now();
    this.toasts = [...this.toasts, toast];
    this.listeners.forEach((l) => l(this.toasts));
  },
  remove(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.listeners.forEach((l) => l(this.toasts));
  },
  update(id, patch) {
    this.toasts = this.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t));
    this.listeners.forEach((l) => l(this.toasts));
  },
};

export const toast = (
  message,
  { type = 'info', duration = TOAST_DURATION, action, id } = {}
) => {
  const t = { id: id ?? crypto.randomUUID(), message, type, action, open: true };
  toastStore.add(t);
  if (duration > 0) {
    setTimeout(() => {
      toastStore.update(id ?? t.id, { open: false });
      setTimeout(() => toastStore.remove(id ?? t.id), 400);
    }, duration);
  }
  return t.id;
};

toast.success = (msg, opts) => toast(msg, { ...opts, type: 'success' });
toast.error = (msg, opts) => toast(msg, { ...opts, type: 'error' });
toast.warning = (msg, opts) => toast(msg, { ...opts, type: 'warning' });
toast.info = (msg, opts) => toast(msg, { ...opts, type: 'info' });
toast.loading = (msg, opts) => toast(msg, { ...opts, type: 'info', duration: 0 });
