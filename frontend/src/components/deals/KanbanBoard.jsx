// frontend/src/components/deals/KanbanBoard.jsx
// Reusable kanban pipeline board with drag-and-drop stage changes.
// The `compact` prop renders a height-capped preview (used on the Dashboard) — the SAME component,
// not a separate widget.
// Used in: pages/Deals.jsx (full board) and pages/Dashboard.jsx (compact preview).

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import DealCard from './DealCard';
import EmptyState from '../common/EmptyState';
import { dealStages } from '../../config/dealStages';

// Column header chip color per stage (kept consistent with the stage color mapping)
const columnStyles = {
  Qualified: 'bg-info/10 text-info border-info/20',
  Proposal: 'bg-accent-primary/10 text-accent-secondary-glow border-accent-primary/20',
  Negotiation: 'bg-warning/10 text-warning border-warning/20',
  Won: 'bg-success/10 text-success border-success/20',
  Lost: 'bg-danger/10 text-danger border-danger/20',
};

// All pipeline stages rendered as columns, including the terminal Lost state.
const allStages = [...dealStages, 'Lost'];

function KanbanBoard({ deals = [], compact = false, onStageChange, maxCards = 3 }) {
  const [dragOverStage, setDragOverStage] = useState(null);

  // Groups deals by their current stage.
  const grouped = allStages.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {});

  const handleDragStart = (e, deal) => {
    e.dataTransfer.setData('text/plain', String(deal.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    const dealId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    setDragOverStage(null);
    if (!Number.isNaN(dealId) && onStageChange) {
      onStageChange(dealId, stage);
    }
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  return (
    <div className={`overflow-x-auto ${compact ? 'pb-2' : ''}`}>
      <div className={`grid gap-3 grid-cols-5 ${compact ? 'min-w-[980px]' : 'min-w-[1080px]'} items-start`}>
      {allStages.map((stage) => {
        const columnDeals = grouped[stage];
        const visible = compact ? columnDeals.slice(0, maxCards) : columnDeals;
        const hiddenCount = columnDeals.length - visible.length;
        const chipClass = columnStyles[stage] || columnStyles.Qualified;

        return (
          <div
            key={stage}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={() => setDragOverStage((prev) => (prev === stage ? null : prev))}
            onDrop={(e) => handleDrop(e, stage)}
            className={`
              rounded-2xl p-2.5 min-h-[140px] transition-all duration-200
              ${compact ? 'bg-bg-secondary/40' : 'bg-bg-secondary/60'}
              ${dragOverStage === stage ? 'ring-2 ring-accent-primary bg-bg-hover/50' : 'border border-overlay/5'}
            `}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1 pb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${chipClass}`}>
                {stage}
              </span>
              <span className="text-[10px] font-semibold text-text-secondary/50">{columnDeals.length}</span>
            </div>

            {/* Column body */}
            <div className={`flex flex-col gap-2 ${compact ? 'max-h-[320px]' : 'min-h-[80px]'}`}>
              <AnimatePresence initial={false}>
                {visible.map((deal) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <DealCard
                      deal={deal}
                      compact={compact}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDragOverStage(null)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {visible.length === 0 && (
                <div className="flex items-center justify-center text-center text-[10px] text-text-secondary/40 min-h-[200px] border border-dashed border-overlay/5 rounded-xl">
                  Drop deals here
                </div>
              )}

              {/* Compact "+N more" affordance */}
              {compact && hiddenCount > 0 && (
                <Link
                  to="/app/deals"
                  className="text-center text-[10px] font-semibold text-accent-glow hover:text-accent-secondary-glow py-1.5 rounded-lg hover:bg-overlay/5 transition-colors"
                >
                  +{hiddenCount} more
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {deals.length === 0 && (
        <div className="col-span-5">
          <EmptyState title="No deals yet" description="Create your first deal to start building the pipeline." />
        </div>
      )}
      </div>
    </div>
  );
}

export default KanbanBoard;
