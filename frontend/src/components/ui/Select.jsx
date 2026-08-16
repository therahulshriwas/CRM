// frontend/src/components/ui/Select.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible custom <select> replacement with a glass trigger and a
// scrollable option list. Keyboard support: arrow keys, Home/End, Enter/Space
// to open/close, type-to-search.
//
// Props mirror native select: name, value/value, onChange, options[],
// placeholder, label, error, disabled, required.
// =============================================================================

import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

function Select({
  label,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  disabled = false,
  required = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const selectId = useId();

  const selected = value ?? defaultValue ?? '';
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? placeholder;

  // Close on outside / Escape / Scroll
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  // Reset highlight when opened
  useEffect(() => {
    if (open) {
      const selectedIndex = options.findIndex((o) => o.value === selected && !o.disabled);
      setHighlighted(selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled));
    }
  }, [open, selected, options]);

  const toggle = () => {
    if (!disabled) {
      setOpen((o) => !o);
      setIsFocused(false);
    }
  };

  const selectOption = (opt) => {
    if (!opt || opt.disabled) return;
    if (opt.value !== selected) {
      onChange?.(opt.value);
    }
    setOpen(false);
  };

  const moveHighlight = (direction) => {
    if (!options.length) return;
    let next = highlighted;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next]?.disabled) {
        setHighlighted(next);
        return;
      }
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); moveHighlight(1); break;
        case 'ArrowUp':   e.preventDefault(); moveHighlight(-1); break;
        case 'Home':      e.preventDefault(); setHighlighted(options.findIndex((o) => !o.disabled)); break;
        case 'End':       e.preventDefault(); setHighlighted(options.findLastIndex((o) => !o.disabled)); break;
        case 'Enter':     e.preventDefault(); selectOption(options[highlighted]); break;
        case 'Escape':    e.preventDefault(); setOpen(false); break;
        default: break;
      }
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={triggerRef}
        role="combobox"
        id={selectId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        aria-required={required}
        aria-label={label || placeholder}
        aria-activedescendant={open && highlighted >= 0 ? `${selectId}-option-${highlighted}` : undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onKeyDown}
        onFocus={() => !open && setIsFocused(true)}
        onBlur={() => !open && setIsFocused(false)}
        onClick={toggle}
        className={`
          flex items-center justify-between w-full gap-2 cursor-pointer
          glass text-text-primary
          ${isFocused && !error ? 'border-accent-primary/60 shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_0_20px_rgba(124,58,237,0.18)]' : ''}
          ${error ? 'border-danger/60 shadow-[0_0_0_1px_rgba(244,63,94,0.4)]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${open ? 'border-accent-primary/50' : ''}
          border border-overlay/8 rounded-xl
          transition-all duration-200 pl-4 pr-3 py-[11px] text-sm
          outline-none
        `}
      >
        <span
          className={`
            block truncate flex-1
            ${!selected ? 'text-text-tertiary/70' : 'text-text-primary'}
            ${error ? 'text-danger' : ''}
          `}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          size={14}
          className={`
            shrink-0 text-text-secondary transition-transform duration-200
            ${open ? 'rotate-180 text-accent-glow' : ''}
          `}
        />
      </div>

      {/* Floating label (mirrors Input) */}
      {label && (
        <label htmlFor={selectId}
          className={`
            absolute left-4 transition-all duration-300 pointer-events-none
            ${(isFocused || selected || open)
              ? 'top-[6px] text-[10px] text-accent-glow font-semibold'
              : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary'}
            ${error ? 'text-danger' : ''}
          `}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* Options list */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`
              absolute z-30 mt-1 w-full
              max-h-[240px] overflow-y-auto
              backdrop-blur-xl bg-bg-elevated/90 border border-overlay/10
              rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
              py-1
            `}
          >
            {options.map((opt, i) => {
              const isActive = opt.value === selected;
              const isHighlighted = i === highlighted;
              return (
                <motion.div
                  key={opt.value ?? i}
                  id={`${selectId}-option-${i}`}
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={opt.disabled || undefined}
                  onMouseMove={() => !opt.disabled && setHighlighted(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt);
                  }}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm
                    transition-colors cursor-pointer outline-none
                    ${isActive ? 'text-accent-glow font-medium' : 'text-text-primary hover:text-accent-glow'}
                    ${isHighlighted && !isActive && !opt.disabled ? 'bg-overlay/8' : ''}
                    ${isActive ? 'bg-accent-primary/8 border border-accent-primary/20' : ''}
                    ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="truncate flex-1">{opt.label}</span>
                  {isActive && <Check size={13} className="text-accent-glow shrink-0" />}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Select;
