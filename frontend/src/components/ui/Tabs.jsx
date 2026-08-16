// frontend/src/components/ui/Tabs.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible tab list — keyboard navigation (←→ ArrowHome/End), animated
// active indicator (underline + bg), pills style option.
//
// Tabs: TabPane[] { id, label, icon?, disabled?, content }
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

function Tabs({
  tabs = [],
  defaultTab,
  value,           // controlled
  onChange,       // (id) => void
  variant = 'underline', // 'underline' | 'pill'
  className = '',
}) {
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.id);
  const activeId = value ?? internal;
  const set = onChange ? (id) => onChange(id) : (id) => setInternal(id);
  const setRef = useRef(set);
  setRef.current = set;
  const listRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      const enabled = tabs.filter((t) => !t.disabled);
      if (enabled.length === 0) return;
      let idx = enabled.findIndex((t) => t.id === activeId);
      if (isNaN(idx) || idx < 0) idx = 0;

      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setRef.current(enabled[(idx + 1) % enabled.length].id);
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setRef.current(enabled[(idx - 1 + enabled.length) % enabled.length].id);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setRef.current(enabled[0].id);
      } else if (e.key === 'End') {
        e.preventDefault();
        setRef.current(enabled[enabled.length - 1].id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeId, tabs]);

  const activeIndex = tabs.findIndex((t) => t.id === activeId);
  const activeTab = tabs[activeIndex];

  const variantBase = {
    underline: 'border-b border-overlay/5',
    pill: 'p-1 rounded-xl glass-deep',
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <div
        ref={listRef}
        className={`
          flex items-center gap-1
          ${variant === 'underline' ? variantBase.underline : variantBase.pill}
        `}
        role="tablist"
      >
        {variant === 'pill' && (
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-accent-primary/10"
            style={{
              width: `calc((100% - ${(tabs.length - 1) * 4}px) / ${tabs.length})`,
              left: `${
                tabs.slice(0, activeIndex).reduce((acc, t) => acc + (t.disabled ? 0 : 1), 0) *
                (100 / tabs.length) +
                activeIndex * ((100 - (tabs.length - 1) * (4 / tabs.length)) / tabs.length)
              }%`,
            }}
          />
        )}
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !tab.disabled && set(tab.id)}
              onFocus={() => {}}
              className={`
                relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 cursor-pointer outline-none
                ${variant === 'underline'
                  ? isActive
                    ? 'text-accent-glow'
                    : 'text-text-secondary hover:text-text-primary'
                  : isActive
                    ? 'text-accent-glow relative z-10'
                    : 'text-text-secondary hover:text-text-primary relative z-10'}
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                ${variant === 'underline' && isActive ? 'pb-2.5' : ''}
              `}
            >
              {Icon && <Icon size={14} className="shrink-0" />}
              <span>{tab.label}</span>
              {variant === 'underline' && isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent-glow"
                  layoutId="tab-active-underline"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {activeTab && (
        <div
          id={`panel-${activeTab.id}`}
          role="tabpanel"
          className="flex-1 py-4"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
