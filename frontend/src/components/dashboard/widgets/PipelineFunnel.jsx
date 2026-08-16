// frontend/src/components/dashboard/widgets/PipelineFunnel.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Funnel visualization of the sales pipeline (count + value per stage).
// Driven by real deal data. Clicking a stage navigates to the Deals page
// filtered by that stage.
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/format';

const STAGE_ORDER = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const STAGE_LABEL = {
  Qualified: 'Qualified', Proposal: 'Proposal',
  Negotiation: 'Negotiation', Won: 'Won', Lost: 'Lost',
};

function PipelineFunnel({ deals = [] }) {
  const navigate = useNavigate();
  const stageData = STAGE_ORDER.map((s) => ({
    stage: s,
    count: deals.filter((d) => d.stage === s).length,
    value: deals
      .filter((d) => d.stage === s)
      .reduce((sum, d) => sum + parseFloat(d.value || 0), 0),
  }));
  const max = Math.max(...stageData.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-3 w-full">
      {stageData.map((d, i) => {
        const pct = Math.round((d.count / max) * 100);
        return (
          <motion.div
            key={d.stage}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/app/deals')}
              className="w-full flex items-center gap-2 text-left rounded-lg p-2 hover:bg-bg-hover transition-all group outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
            >
              <span className="w-24 text-xs font-semibold text-text-secondary group-hover:text-text-primary">
                {STAGE_LABEL[d.stage]}
              </span>
              <div className="flex-1 h-6 rounded-md bg-bg-surface/40 overflow-hidden relative">
                <motion.div
                  className={`h-full rounded-md bg-gradient-to-r from-accent-primary/70 to-accent-highlight/70`}
                  style={{ width: `${pct}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                />
              </div>
              <span className="w-10 text-xs font-bold text-text-primary tabular-nums text-right">
                {d.count}
              </span>
              <span className="w-20 text-[10px] text-text-tertiary/60 tabular-nums text-right">
                {formatCurrency(d.value)}
              </span>
            </motion.button>
          </motion.div>
        );
      })}

      {/* Totals */}
      <motion.div
        className="grid grid-cols-2 gap-2 pt-3 border-t border-overlay/5 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div>
          <span className="text-xs text-text-tertiary">Total Deals</span>
          <span className="block text-sm font-bold text-text-primary tabular-nums">
            {stageData.reduce((s, d) => s + d.count, 0)}
          </span>
        </div>
        <div>
          <span className="text-xs text-text-tertiary">Total Value</span>
          <span className="block text-sm font-bold text-text-primary tabular-nums">
            {formatCurrency(stageData.reduce((s, d) => s + d.value, 0))}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default PipelineFunnel;
