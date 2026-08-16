// frontend/src/components/common/Badge.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Status chip with a glow dot. Categorical color tokens (info, warning, danger,
// success, primary, secondary). Size variants: xs | sm | md.
// Used in: Leads list, Recent Deals table, Pipeline Kanban boards, KanbanCard.
// =============================================================================

import React from 'react';

function Badge({
  label,
  variant = 'info',
  showDot = true,
  size = 'sm',
  className = '',
}) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[8px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    info: 'bg-info/10 text-info border-info/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
    danger: 'bg-danger/10 text-danger border-danger/25',
    success: 'bg-success/10 text-success border-success/25',
    primary: 'bg-accent-primary/10 text-accent-glow border-accent-primary/25',
    secondary: 'bg-overlay/5 text-text-secondary border-overlay/10',
  };
  const dotStyles = {
    info: 'bg-info glow-subtle',
    warning: 'bg-warning glow-subtle',
    danger: 'bg-danger glow-subtle',
    success: 'bg-success glow-subtle',
    primary: 'bg-accent-glow glow-subtle',
    secondary: 'bg-overlay/20',
  };
  const dotSize = { xs: 'w-1 h-1', sm: 'w-1.5 h-1.5', md: 'w-2 h-2' };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-display font-semibold
        border motion-interactive
        ${sizeClasses[size] || sizeClasses.sm}
        ${variantStyles[variant] || variantStyles.secondary}
        ${className}
      `}
    >
      {showDot && (
        <span className={`rounded-full ${dotStyles[variant] || dotStyles.secondary} ${dotSize[size] || dotSize.sm}`} />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

export default Badge;
