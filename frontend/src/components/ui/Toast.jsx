// frontend/src/components/ui/Toast.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Toast container component. Mount <Toaster /> once at the app root. Use the
// imperative `toast()` helper (from ./toastStore) to dispatch messages.
//
// Each toast: slide-in + spring, auto-dismiss, focus ring, Escape-aware,
// loading spinner variant. Accessible: role="status" + aria-live="polite".
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toastStore } from './toastStore';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};
const COLORS = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

function ToastItem({ t, onRemove }) {
  const Icon = ICONS[t.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className={`
        flex items-center gap-2.5 px-4 py-2.5 rounded-xl
        backdrop-blur-xl bg-bg-elevated/85 border
        shadow-[0_8px_32px_rgba(0,0,0,0.45)]
        ${t.type === 'error' ? 'border-danger/20' : 'border-overlay/10'}
        min-w-[240px] max-w-[360px]
      `}
      role="status"
      aria-live="polite"
    >
      {t.type === 'loading' ? (
        <Loader2 size={16} className="text-accent-glow animate-spin" />
      ) : (
        <Icon size={16} className={COLORS[t.type]} />
      )}
      <span className="flex-1 text-xs text-text-primary leading-relaxed break-words">
        {t.message}
      </span>
      {t.action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => {
            t.action.onClick?.();
            onRemove(t.id);
          }}
          className="text-xs font-semibold text-accent-glow hover:text-accent-secondary-glow px-2 py-0.5 rounded hover:bg-accent-primary/10 transition-all outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
        >
          {t.action.label}
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.15, rotate: 90 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          toastStore.update(t.id, { open: false });
          setTimeout(() => onRemove(t.id), 400);
        }}
        className="text-text-tertiary/50 hover:text-text-tertiary p-0.5 rounded outline-none"
        aria-label="Dismiss"
      >
        <X size={12} />
      </motion.button>
    </motion.div>
  );
}

function Toaster({ position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToasts(toastStore.toasts);
    toastStore.listeners.add(setToasts);
    return () => { toastStore.listeners.delete(setToasts); };
  }, []);

  const posClasses = {
    'top-right':    'fixed top-4 right-4 flex flex-col gap-2 z-[100]',
    'top-left':     'fixed top-4 left-4 flex flex-col gap-2 z-[100]',
    'bottom-right': 'fixed bottom-4 right-4 flex flex-col gap-2 z-[100]',
    'bottom-left':  'fixed bottom-4 left-4 flex flex-col gap-2 z-[100]',
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={posClasses[position]}>
      <AnimatePresence>
        {toasts.filter((t) => t.open).map((t) => (
          <ToastItem key={t.id} t={t} onRemove={toastStore.remove} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export { Toaster };
export default Toaster;
