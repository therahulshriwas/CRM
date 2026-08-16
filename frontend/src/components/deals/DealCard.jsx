// frontend/src/components/deals/DealCard.jsx
// A single draggable deal card rendered inside a kanban column — title, lead, value, owner and stage accent.
// Used in: components/deals/KanbanBoard.jsx (both full pipeline and compact dashboard widget).

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, GripVertical } from 'lucide-react';
import Avatar from '../common/Avatar';
import { stageColors } from '../../config/dealStages';
import { resolveMediaUrl } from '../../utils/media';

// Tailwind accent classes per stage for the card's left edge + glow
const stageAccent = {
  info: 'border-l-info',
  accent: 'border-l-accent-highlight',
  warning: 'border-l-warning',
  success: 'border-l-success',
  danger: 'border-l-danger',
};

function DealCard({ deal, onDragStart, onDragEnd, compact = false }) {
  const accentKey = stageColors[deal.stage] || 'info';
  const accentClass = stageAccent[accentKey] || stageAccent.info;

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        group cursor-grab active:cursor-grabbing rounded-xl border border-overlay/5 bg-bg-surface hover:bg-bg-hover
        transition-colors duration-150 border-l-[3px] shadow-[0_2px_10px_rgba(0,0,0,0.25)] select-none
        ${accentClass}
        ${compact ? 'p-2.5' : 'p-3'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-text-primary font-semibold leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
          {deal.title}
        </span>
        <GripVertical size={14} className="text-text-secondary/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className={`flex items-center justify-between mt-2.5 ${compact ? 'gap-2' : 'gap-3'}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <DollarSign size={12} className="text-accent-glow shrink-0" />
          <span className="text-xs font-bold text-text-primary truncate">
            {Number(deal.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {deal.lead && (
          <span className="text-[10px] text-text-secondary truncate">{deal.lead.name}</span>
        )}
      </div>

      {!compact && (
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-overlay/5">
          <span className="text-[10px] text-text-secondary/60">
            {deal.created_at ? new Date(deal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
          </span>
          {deal.owner && <Avatar name={deal.owner.name} role={deal.owner.role} size={22} src={resolveMediaUrl(deal.owner.avatar_url)} />}
        </div>
      )}
    </motion.div>
  );
}

export default DealCard;
