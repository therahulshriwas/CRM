// frontend/src/components/dashboard/widgets/UpcomingMeetings.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Upcoming meetings + deal milestones (from calendar events next 7 days).
// Shows date/time, title, type badge, and a hot-linked deal/customer.
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import Badge from '../../common/Badge';
import { containerVariants, itemVariants } from '../../../animations/variants';

function UpcomingMeetings({ events = [] }) {
  if (!events.length) {
    return (
      <div className="text-center py-6">
        <Calendar size={18} className="mx-auto text-text-tertiary/30 mb-2" />
        <span className="text-xs text-text-tertiary">No upcoming meetings</span>
      </div>
    );
  }

  const todayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-2 w-full"
    >
      {events.slice(0, 8).map((event, _i) => {
        const isDeal = event.type === 'deal';
        const variant = isDeal ? 'primary' : 'info';
        return (
          <motion.div
            key={event.id}
            variants={itemVariants}
            whileHover={{ x: 3 }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-hover transition-colors group"
          >
            <div className="flex flex-col items-center w-10">
              <span className="text-[9px] font-semibold text-text-tertiary uppercase">
                {todayLabel(event.date)}
              </span>
              <span className="text-xs font-bold text-text-primary tabular-nums">
                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-text-primary truncate">
                  {event.title}
                </span>
                <Badge variant={variant} label={isDeal ? 'Deal' : 'Activity'} showDot={false} size="xs" />
              </div>
              {event.customer && (
                <span className="text-xs text-text-tertiary truncate block">
                  {event.customer}
                </span>
              )}
            </div>
            {isDeal && event.dealId && (
              <Link
                to="/app/deals"
                className="text-xs text-accent-glow hover:text-accent-secondary-glow font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Open →
              </Link>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default UpcomingMeetings;
