// frontend/src/components/common/PageHeader.jsx
// Futuristic page header scaffold: gradient icon tile, animated shimmer title, subtitle,
// breadcrumb chip, and an actions slot. Gives every page a consistent cinematic top section.
// Used in: All authenticated pages (Leads, Deals, Dashboard, Customers, ...).

import React from 'react';
import { motion } from 'framer-motion';
import { easeOutExpo } from '../../animations/variants';

function PageHeader({
  title,
  icon: Icon = null,
  subtitle = '',
  badge = null,
  actions = null,
  accent = 'rgb(var(--c-accent-glow))',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className="relative flex flex-wrap items-center justify-between gap-4"
    >
      {/* Soft ambient glow behind the header */}
      <div
        className="absolute -top-10 -left-6 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-60"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 18%, transparent), transparent 65%)` }}
      />

      <div className="relative flex items-center gap-3.5 min-w-0">
        {Icon && (
          <motion.div
            whileHover={{ scale: 1.06, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
               background: `linear-gradient(140deg, color-mix(in srgb, ${accent} 17%, transparent), color-mix(in srgb, ${accent} 7%, transparent))`,
               border: `1px solid color-mix(in srgb, ${accent} 27%, transparent)`,
               boxShadow: `0 0 24px color-mix(in srgb, ${accent} 22%, transparent)`,
            }}
          >
            <Icon size={20} style={{ color: accent }} />
            <span className="absolute inset-0 rounded-2xl halo pointer-events-none" style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }} />
          </motion.div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] border"
                 style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, color: accent, borderColor: `color-mix(in srgb, ${accent} 25%, transparent)` }}>
                {badge}
              </span>
            )}
            <h1 className="text-xl md:text-2xl font-display font-semibold text-text-primary tracking-tight truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="relative flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}

export default PageHeader;
