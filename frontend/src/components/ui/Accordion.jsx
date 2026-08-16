// frontend/src/components/ui/Accordion.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible accordion. Multiple items can be open (allowMultiple) or single
// (collapsible). Keyboard: arrow keys, Home/End, Enter/Space.
//
// Items: AccordionItem[] { id, label, icon?, content, defaultOpen? }
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function Accordion({
  items = [],
  allowMultiple = false,
  defaultValue,  // single id or array of ids
  value,         // controlled
  onChange,      // (openIds) => void
  className = '',
}) {
  const [internalOpen, setInternalOpen] = useState(() => {
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });
  const controlled = value !== undefined;
  const openIds = controlled ? value : internalOpen;

  const toggle = (id) => {
    const isOpen = openIds.includes(id);
    let next;
    if (allowMultiple) {
      next = isOpen ? openIds.filter((o) => o !== id) : [...openIds, id];
    } else {
      next = isOpen && !openIds.includes(id) ? openIds : (isOpen ? [] : [id]);
    }
    if (!controlled) setInternalOpen(next);
    onChange?.(allowMultiple ? next : (next.length ? [next[next.length - 1]] : []));
  };

  // Keyboard navigation across headers
  useEffect(() => {
    const handleKey = (e) => {
      const headers = document.querySelectorAll('[data-accordion-header]');
      if (!headers.length) return;
      const active = document.activeElement;
      const idx = Array.from(headers).findIndex((h) => h === active);
      if (idx < 0) return;
      let target = null;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        target = headers[(idx + 1) % headers.length];
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        target = headers[(idx - 1 + headers.length) % headers.length];
      } else if (e.key === 'Home') {
        e.preventDefault();
        target = headers[0];
      } else if (e.key === 'End') {
        e.preventDefault();
        target = headers[headers.length - 1];
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        headers[idx]?.querySelector('button')?.click();
      }
      target?.focus();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className={`border-b border-overlay/5 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const Icon = item.icon;
        return (
          <div key={item.id} className="border-t border-overlay/5 first:border-t-0">
            <h3 data-accordion-header>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => toggle(item.id)}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-3 text-left
                  text-sm font-medium text-text-secondary hover:text-text-primary
                  transition-colors duration-200 outline-none
                  focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2
                  ${isOpen ? 'text-text-primary' : ''}
                `}
                aria-expanded={isOpen}
                aria-controls={`panel-${item.id}`}
                id={`header-${item.id}`}
              >
                {Icon && <Icon size={15} className="shrink-0" />}
                <span>{item.label}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="ml-auto"
                >
                  <ChevronDown size={14} className="text-text-tertiary/50" />
                </motion.div>
              </motion.button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`panel-${item.id}`}
                  role="region"
                  aria-labelledby={`header-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                   <div className="px-4 pt-2 pb-3 text-sm text-text-secondary">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
