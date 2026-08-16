// frontend/src/components/ui/Filters.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Filter bar: renders an array of filter definitions as interactive triggers.
// Each filter opens an inline popover with a Select-like option list (multi or
// single). Active filters are tracked via badges with clear-all button.
//
// filters: Filter[] {
//   id, label, options: { value, label, icon? }[],
//   multiple?, placeholder?, value (controlled array/single),
//   onChange (values) => void
// }
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Check } from 'lucide-react';
import Button from '../common/Button';

function Filters({ filters = [], className = '', showClearAll = true }) {
  const [openId, setOpenId] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!openId) return;
    const close = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpenId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openId]);

  const allSelected = filters.every((f) => (f.value || []).length > 0);
  const clearAll = () => {
    filters.forEach((f) => f.onChange?.(f.multiple ? [] : ''));
  };

  if (!filters.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-text-secondary text-sm">
        <Filter size={13} className="text-text-tertiary" />
        <span className="font-medium">Filters</span>
      </div>

      {filters.map((f) => {
        const vals = f.value || (f.multiple ? [] : '');
        const selectedArr = f.multiple ? vals : vals ? [vals] : [];
        const selectedCount = selectedArr.length;
        const hasValue = f.multiple ? selectedCount > 0 : !!vals;

        return (
          <div key={f.id} className="relative" ref={openId === f.id ? popoverRef : null}>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenId(openId === f.id ? null : f.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                transition-all duration-200 cursor-pointer outline-none
                ${hasValue
                  ? 'bg-accent-primary/12 text-accent-glow border border-accent-primary/25'
                  : 'glass text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'}
              `}
              aria-haspopup="true"
              aria-expanded={openId === f.id}
            >
              <span>{f.label}</span>
              {selectedCount > 0 && !f.multiple ? (
                <span className="w-2 h-2 rounded-full bg-accent-glow" />
              ) : selectedCount > 0 ? (
                <span className="w-5 h-5 rounded-full bg-accent-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {selectedCount}
                </span>
              ) : null}
              {hasValue && (
                <AnimatePresence>
                  <motion.span
                    key="chevron"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-text-tertiary"
                  >
                    <Check size={11} />
                  </motion.span>
                </AnimatePresence>
              )}
            </motion.button>

            {/* Popover */}
            <AnimatePresence>
              {openId === f.id && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="
                    absolute z-30 mt-1
                    min-w-[180px]
                    backdrop-blur-xl bg-bg-elevated/90 border border-overlay/10
                    rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                    py-1 overflow-y-auto max-h-[240px]
                  "
                >
                  {f.options.map((opt) => {
                    const checked = (f.multiple ? selectedArr : vals) === opt.value
                      || (f.multiple ? selectedArr.some((v) => v === opt.value) : false);
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={{ backgroundColor: 'rgba(124,58,237,0.06)' }}
                        onClick={() => {
                          let next;
                          if (f.multiple) {
                            next = checked
                              ? selectedArr.filter((v) => v !== opt.value)
                              : [...selectedArr, opt.value];
                          } else {
                            next = checked ? '' : opt.value;
                          }
                          f.onChange?.(next);
                        }}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 text-left text-xs
                          transition-colors
                          ${checked ? 'text-accent-glow font-medium' : 'text-text-secondary hover:text-text-primary'}
                        `}
                      >
                        <span
                          className={`
                            w-3.5 h-3.5 rounded border flex items-center justify-center
                            ${checked ? 'bg-accent-primary border-accent-primary text-white' : 'border-overlay/20'}
                          `}
                        >
                          {checked && <Check size={9} />}
                        </span>
                        <span>{opt.label}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clear single */}
            {hasValue && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => f.onChange?.(f.multiple ? [] : '')}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-overlay/20 hover:bg-danger/10 text-text-tertiary hover:text-danger transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-danger"
                aria-label={`Clear ${f.label}`}
              >
                <X size={8} />
              </motion.button>
            )}
          </div>
        );
      })}

      {/* Clear all */}
      {showClearAll && allSelected && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}

export default Filters;
