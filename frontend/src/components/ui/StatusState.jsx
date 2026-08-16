// frontend/src/components/ui/StatusState.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Unified status surface for the four canonical non-content states:
//   loading | empty | error | success
// Reusable primitive consumed by tables, kanban, charts, and page shells.
// Every variant includes: ambient glow, theme-aware tokens, optional retry
// action, optional illustration override, and a cinematic spring entrance.
//
// States:
//   type="loading"  — spinner ring + shimmer placeholder bars
//   type="empty"    — soft icon in gradient ring + title/description + optional action
//   type="error"    — danger icon + message + optional retry button
//   type="success"  — success icon + message
//
// Accessibility: role="status" | aria-live | proper focus ring on retry.
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../common/Button';

const ICONS = {
  empty: Inbox,
  error: AlertCircle,
  success: CheckCircle,
  loading: Loader2,
};

const ringColor = {
  empty: 'from-accent-primary/25 to-accent-highlight/10 border-accent-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.15)]',
  error: 'from-danger/25 to-danger/10 border-danger/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]',
  success: 'from-success/25 to-success/10 border-success/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  loading: 'from-accent-primary/25 to-accent-highlight/10',
};

function StatusState({
  type = 'empty',       // 'loading' | 'empty' | 'error' | 'success'
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  icon: CustomIcon,
  className = '',
  compact = false,
  center = true,
}) {
  const Icon = CustomIcon || ICONS[type];
  const isError = type === 'error';
  const isSuccess = type === 'success';
  const isLoading = type === 'loading';

  const defaultTitle = {
    empty: isError ? 'Something went wrong' : 'No records yet',
    error: 'Something went wrong',
    success: 'All set!',
    loading: 'Loading…',
  };
  const defaultMessage = {
    empty: 'There is nothing to show here right now.',
    error: 'We could not load the requested data.',
    success: 'Your changes have been saved.',
    loading: 'Please wait while we fetch the latest data.',
  };

  const displayTitle = title || defaultTitle[type];
  const displayMessage = message || defaultMessage[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`
        flex flex-col items-center justify-center gap-3 text-center
        ${center ? 'w-full' : ''}
        ${compact ? 'py-8 px-4' : 'py-10 px-6'}
        border border-dashed rounded-2xl
        ${isError ? 'border-danger/15' : 'border-overlay/15'}
        bg-overlay/2 relative overflow-hidden
        ${className}
      `}
      role="status"
      aria-live={isLoading ? 'polite' : 'off'}
    >
      {/* Ambient backdrop glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: isError
            ? 'radial-gradient(120% 120% at 50% 50%, rgba(244,63,94,0.08), transparent 65%)'
            : isLoading
              ? 'radial-gradient(120% 120% at 50% 50%, rgba(124,58,237,0.06), transparent 65%)'
              : 'radial-gradient(120% 120% at 50% 50%, rgba(16,185,129,0.06), transparent 65%)',
        }}
      />

      {/* Icon ring */}
      <motion.div
        animate={isLoading ? { rotate: 360 } : undefined}
        transition={isLoading ? { duration: 1.6, repeat: Infinity, ease: 'linear' } : undefined}
        className={`
          relative p-3 rounded-2xl
          bg-gradient-to-br ${ringColor[type]}
        `}
      >
        <Icon
          size={compact ? 20 : 24}
          className={
            isError ? 'text-danger'
            : isSuccess ? 'text-success'
            : isLoading ? 'text-accent-glow animate-pulse'
            : 'text-accent-glow'
          }
        />
      </motion.div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1 relative">
        <span
          className={`
            font-display font-semibold
            ${compact ? 'text-sm' : 'text-base'}
            ${isError ? 'text-danger' : isSuccess ? 'text-success' : 'text-text-primary'}
          `}
        >
          {displayTitle}
        </span>
        <span
          className={`
            text-text-secondary
            ${compact ? 'text-xs' : 'text-sm'}
            max-w-[240px] leading-relaxed
          `}
        >
          {displayMessage}
        </span>
      </div>

      {/* Actions (error retry / empty action / success action) */}
      {isError && onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <Button variant="secondary" size="sm" onClick={onRetry} aria-label={retryLabel}>
            {retryLabel}
          </Button>
        </motion.div>
      )}

      {/* Loading shimmer bars */}
      {isLoading && (
        <div className="flex flex-col gap-1.5 pt-2">
          {[...Array(compact ? 2 : 3)].map((_, i) => (
            <div
              key={i}
              className="shimmer rounded-md"
              style={{ width: compact ? 120 : 180, height: 10, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default StatusState;
