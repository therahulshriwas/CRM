// frontend/src/components/ui/Tooltip.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible tooltip: hover or focus-triggers a small floating label. Uses
// Framer Motion for fade + scale, CSS-var-based theme colors, and a
// directional caret. Respects prefers-reduced-motion.
//
// Placements: top | right | bottom | left (default top)
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const placements = {
  top:    { panel: 'bottom-full left-1/2 -translate-x-1/2 mb-2', arrow: 'bottom-full left-1/2 -translate-x-1/2 mb-1' },
  right:  { panel: 'left-full top-1/2 -translate-y-1/2 ml-2', arrow: 'left-full top-1/2 -translate-y-1/2 ml-1' },
  bottom: { panel: 'top-full left-1/2 -translate-x-1/2 mt-2', arrow: 'top-full left-1/2 -translate-x-1/2 mt-1' },
  left:   { panel: 'right-full top-1/2 -translate-y-1/2 mr-2', arrow: 'right-full top-1/2 -translate-y-1/2 mr-1' },
};

function Tooltip({
  children,
  content,
  placement = 'top',
  delay = 120,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const timerRef = useRef(null);
  const cfg = placements[placement] || placements.top;

  // Position the arrow caret based on placement
  const arrowClasses = {
    top:    'border-t border-overlay/10 rotate-[135deg]',
    right:  'border-r border-overlay/10 rotate-[45deg]',
    bottom: 'border-b border-overlay/10 rotate-[315deg]',
    left:   'border-l border-overlay/10 rotate-[225deg]',
  };

  const show = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 30);
  };

  // Stable refs so listeners stay attached
  const showRef = useRef(show); showRef.current = show;
  const hideRef = useRef(hide); hideRef.current = hide;

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const s = () => showRef.current();
    const h = () => hideRef.current();
    el.addEventListener('mouseenter', s);
    el.addEventListener('mouseleave', h);
    el.addEventListener('focus', s);
    el.addEventListener('blur', h);
    return () => {
      el.removeEventListener('mouseenter', s);
      el.removeEventListener('mouseleave', h);
      el.removeEventListener('focus', s);
      el.removeEventListener('blur', h);
    };
  }, []);

  return (
    <span className="relative inline-block" ref={triggerRef}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            className={`
              pointer-events-none absolute z-50
              ${cfg.panel}
            `}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="backdrop-blur-xl bg-bg-elevated/90 border border-overlay/10 text-text-secondary text-[10px] font-medium px-2 py-1.5 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] whitespace-nowrap">
              {content}
              <div
                className={`absolute w-1.5 h-1.5 ${arrowClasses[placement]} border-t border-l border-overlay/10`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
