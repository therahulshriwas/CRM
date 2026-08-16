// frontend/src/components/dashboard/widgets/SalesForecast.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Sales forecast waterfall: projects revenue across the 5 deal stages
// (Qualified → Proposal → Negotiation → Won) using weighted-probability
// pipeline values. Driven entirely by real deal data.
//
// Data: { deals: [], pipeline: {Qualified,Proposal,Negotiation,Won,Lost} }
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../../utils/format';

// Stages in pipeline order with their close-probability weight.
const STAGE_ORDER = ['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const STAGE_WEIGHT = {
  Qualified: 0.25, Proposal: 0.5, Negotiation: 0.75, Won: 1, Lost: 0,
};
const STAGE_COLOR = {
  Qualified: 'bg-info', Proposal: 'bg-accent-highlight',
  Negotiation: 'bg-warning', Won: 'bg-success', Lost: 'bg-danger',
};
const STAGE_LABEL = {
  Qualified: 'Qualified', Proposal: 'Proposal',
  Negotiation: 'Negotiation', Won: 'Won', Lost: 'Lost',
};

function SalesForecast({ deals = [], pipeline: _pipeline = {} }) {
  // Sum deal values per stage (role-scoped by the backend already).
  const stageValues = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = deals
      .filter((d) => d.stage === s)
      .reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    return acc;
  }, {});

  // Forecast = Σ(value × probability)
  const forecast = STAGE_ORDER.reduce(
    (sum, s) => sum + stageValues[s] * STAGE_WEIGHT[s],
    0
  );
  const committed = stageValues.Won;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Forecast headline */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-display font-bold text-text-primary tabular-nums">
          {formatCurrency(forecast)}
        </span>
        <span className="text-xs text-text-tertiary">Forecasted pipeline value</span>
      </div>

      {/* Waterfall bars */}
      <div className="flex flex-col gap-2.5">
        {STAGE_ORDER.map((stage, i) => {
          const value = stageValues[stage] || 0;
          const prob = STAGE_WEIGHT[stage] * 100;
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <span className="w-20 text-xs font-semibold text-text-secondary tabular-nums">
                {STAGE_LABEL[stage]}
              </span>
              <div className="flex-1 h-6 rounded-lg overflow-hidden bg-bg-surface/40 relative group">
                {value > 0 && (
                  <motion.div
                    className={`h-full rounded-lg ${STAGE_COLOR[stage]} transition-all duration-500 group-hover:brightness-110`}
                    style={{
                      width: `${Math.min((value / forecast) * 100, 100) || (committed > 0 ? 2 : 0)}%`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((value / Math.max(forecast, 1)) * 100, 100)}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 w-32 justify-end">
                <span className="text-xs font-bold text-text-primary tabular-nums">
                  {formatCurrency(value)}
                </span>
                <span className="text-[9px] text-text-tertiary/60 bg-overlay/10 px-1.5 py-0.25 rounded">
                  {prob}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-overlay/5">
        <motion.div
          className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-bg-surface/30"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >
          <span className="text-[10px] text-text-tertiary uppercase">Weighted</span>
          <span className="text-sm font-bold text-success tabular-nums">{formatCurrency(forecast)}</span>
        </motion.div>
        <motion.div
          className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-bg-surface/30"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        >
          <span className="text-[10px] text-text-tertiary uppercase">Committed</span>
          <span className="text-sm font-bold text-accent-glow tabular-nums">{formatCurrency(committed)}</span>
        </motion.div>
        <motion.div
          className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-bg-surface/30"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          <span className="text-[10px] text-text-tertiary uppercase">Total Pipeline</span>
          <span className="text-sm font-bold text-text-primary tabular-nums">
            {formatCurrency(STAGE_ORDER.reduce((s, k) => s + stageValues[k], 0))}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default SalesForecast;
