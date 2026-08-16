// frontend/src/components/common/Panel.jsx
// Futuristic content panel: glass-deep card with optional header (icon tile, title, subtitle,
// actions) and consistent body spacing. Animated gradient top beam + hover lift.
// Used in: All authenticated pages to wrap tables, kanban, charts, and detail sections.

import React from 'react';
import { motion } from 'framer-motion';
import { easeOutExpo } from '../../animations/variants';

function Panel({
  title,
  icon: Icon = null,
  subtitle = null,
  actions = null,
  children,
  className = '',
  accent = 'rgb(var(--c-accent-glow))',
  lift = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      whileHover={lift ? { y: -3 } : undefined}
      className={`relative glass-deep rounded-2xl overflow-hidden ${className}`}
    >
      {/* Gradient top beam */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent to-transparent opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-overlay/5">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-2 rounded-xl flex items-center justify-center"
                 style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)`, boxShadow: `0 0 16px color-mix(in srgb, ${accent} 18%, transparent)` }}>
                <Icon size={16} style={{ color: accent }} />
              </div>
            )}
            <div>
              <h3 className="text-text-primary font-display font-semibold text-sm leading-tight">{title}</h3>
              {subtitle && <span className="text-[10px] text-text-secondary/60 mt-0.5 block">{subtitle}</span>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="p-5">{children}</div>
    </motion.div>
  );
}

export default Panel;
