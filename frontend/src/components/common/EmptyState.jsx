// frontend/src/components/common/EmptyState.jsx
// Futuristic empty-state block — glowing gradient icon in a pulsing ring, title, description, optional action.
// Used in: Leads list, Deals pipeline, Recent Deals table, Live Activity feed.

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

function EmptyState({
  title = 'No records yet',
  description = 'There is nothing here yet. New items will appear automatically.',
  action = null,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center gap-3 py-10 px-6 border border-dashed border-overlay/15 rounded-2xl bg-overlay/2 relative overflow-hidden ${className}`}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/10 blur-3xl pointer-events-none" />

      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative p-3 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-highlight/10 border border-accent-primary/25 glow-control"
      >
        <Inbox size={22} className="text-accent-glow" />
      </motion.div>

      <div className="flex flex-col items-center gap-1 text-center relative">
        <span className="text-text-primary text-sm font-semibold">{title}</span>
        <span className="text-xs text-text-secondary max-w-[260px] leading-relaxed">{description}</span>
      </div>
      {action && <div className="relative">{action}</div>}
    </motion.div>
  );
}

export default EmptyState;
