// frontend/src/components/dashboard/widgets/PerformanceHeatmap.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Activity heatmap: 7×24 day/hour grid of activity density.
// Uses the 2D array `heatmap[dayIndex][hour]` from /api/reports.
// DAYS order matches the backend's heatmap row order: Sun..Sat.
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '../../../animations/variants';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HeatmapCell({ count, max, dayIdx, hour, totalActivities }) {
  const intensity = count > 0 ? Math.min(Math.ceil((count / Math.max(max, 1)) * 4), 4) : 0;
  const bg = [
    'bg-overlay/8',
    'bg-accent-primary/20',
    'bg-accent-primary/35',
    'bg-accent-primary/60',
    'bg-accent-primary/85 shadow-[0_0_8px_rgba(124,58,237,0.4)]',
  ][intensity];
  return (
    <motion.div
      role="img"
      aria-label={`Activity heatmap with ${totalActivities} total activities`}
      className={`
        w-5 h-5 rounded-[3px] ${bg}
        flex items-center justify-center text-[6px] font-mono
        ${count > 0 ? 'text-text-primary' : 'text-text-tertiary/20'}
      `}
      title={`${DAYS[dayIdx]} ${hour.toString().padStart(2, '0')}:00 — ${count} activities`}
      whileHover={{ scale: 1.2 }}
    >
      {count > 0 ? count : ''}
    </motion.div>
  );
}

function PerformanceHeatmap({ heatmap }) {
  // heatmap: 2D array [dayIndex][hour] or [] when empty
  const max = Array.isArray(heatmap)
    ? heatmap.flat().reduce((m, v) => Math.max(m, v || 0), 0) || 1
    : 1;

  const totalActivities = Array.isArray(heatmap)
    ? heatmap.flat().reduce((a, b) => a + (b || 0), 0)
    : 0;

  if (!Array.isArray(heatmap) || heatmap.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-xs text-text-tertiary">No activity data yet</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-4 w-full"
    >
      {/* Legend */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-tertiary">Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`
              w-3.5 h-3.5 rounded-[2px]
              ${i === 0 ? 'bg-overlay/8' : i === 1 ? 'bg-accent-primary/20' : i === 2 ? 'bg-accent-primary/35' : i === 3 ? 'bg-accent-primary/60' : 'bg-accent-primary/85 shadow-[0_0_6px_rgba(124,58,237,0.4)]'}
            `}
          />
        ))}
        <span className="text-xs text-text-tertiary">More</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[50px_repeat(24,_1rem)] gap-[2px] items-start min-w-[480px]">
          <div className="h-5" />
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <div key={h} className="text-[8px] text-text-tertiary/40 text-center">
              {h.toString().padStart(2, '0')}
            </div>
          ))}

          {DAYS.map((day, dayIdx) => (
            <motion.div key={day} className="contents" variants={itemVariants}>
              <div className="text-[9px] font-medium text-text-tertiary text-right pr-1">
                {day}
              </div>
              {HOURS.map((hour) => {
                const count = heatmap[dayIdx]?.[hour] || 0;
                return (
                  <HeatmapCell
                    key={`${dayIdx}-${hour}`}
                    count={count}
                    max={max}
                    dayIdx={dayIdx}
                    hour={hour}
                    totalActivities={totalActivities}
                  />
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <motion.div variants={itemVariants} className="pt-2 border-t border-overlay/5">
        <span className="text-xs text-text-tertiary">
          {totalActivities} total activities recorded
        </span>
      </motion.div>
    </motion.div>
  );
}

export default PerformanceHeatmap;
