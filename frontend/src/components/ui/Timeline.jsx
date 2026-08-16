// frontend/src/components/ui/Timeline.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Vertical activity timeline. Each step: icon + dot, title, description,
// timestamp, status variants (pending/done/error).
//
// items: TimelineItem[] {
//   id, title, description, timestamp, icon, status: 'pending|done|error'
// }
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Clock } from 'lucide-react';
import { containerVariants, itemVariants } from '../../animations/variants';

const STATUS_ICON = {
  done: Check,
  pending: Clock,
  error: AlertCircle,
};
const STATUS_COLOR = {
  done: 'text-success bg-success/10 border-success/30',
  pending: 'text-warning bg-warning/10 border-warning/30',
  error: 'text-danger bg-danger/10 border-danger/30',
};

function Timeline({ items = [], className = '' }) {
  if (!items.length) {
    return (
      <div className="text-center py-8 text-xs text-text-tertiary">
        No timeline items
      </div>
    );
  }

  return (
    <motion.div
      className={`flex flex-col w-full ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {items.map((item, i) => {
        const Icon = item.icon || STATUS_ICON[item.status || 'pending'];
        const isLast = i === items.length - 1;
        return (
          <motion.div
            key={item.id ?? i}
            className={`relative flex gap-3.5 pl-3.5 last:pb-0 pb-5`}
            variants={itemVariants}
          >
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute top-5 left-[7px] bottom-0 w-px bg-gradient-to-b from-overlay/30 to-transparent" />
            )}

            {/* Icon / status dot */}
            <motion.div
              className={`
                relative z-10 w-5 h-5 rounded-full border flex items-center justify-center
                ${STATUS_COLOR[item.status || 'pending']}
              `}
              initial={item.status === 'pending' ? { scale: 0.9, opacity: 0.6 } : { scale: 1, opacity: 1 }}
              animate={item.status === 'pending' ? { scale: [1, 1.06, 1] } : undefined}
              transition={item.status === 'pending' ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              <Icon size={11} />
            </motion.div>

            {/* Content */}
            <div className="flex flex-col gap-0.5 flex-1">
              <div className="flex items-baseline gap-2 justify-between">
                <span className="text-sm font-medium text-text-primary">{item.title}</span>
                {item.timestamp && (
                  <span className="text-[10px] text-text-tertiary/50 font-mono">
                    {item.timestamp}
                  </span>
                )}
              </div>
              {item.description && (
                <span className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {item.description}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default Timeline;
