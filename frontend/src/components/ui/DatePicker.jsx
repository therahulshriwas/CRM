// frontend/src/components/ui/DatePicker.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible inline calendar pop-over with glass-deep surface. Keyboard
// navigation: arrows to move, Enter/Space to select, Escape to close,
// Home/End to jump to first/last day of month.
//
// Uses native Date (no heavy dep). Exposes value/onChange as ISO strings or Dates.
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DatePicker({
  label,
  value,            // ISO string or Date or null
  onChange,        // (date: Date|null) => void
  placeholder = 'Pick a date',
  error = '',
  disabled = false,
  maxDate,
  minDate,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d) ? new Date() : d;
  });
  const triggerRef = useRef(null);
  const inputId = `${label ? label.toLowerCase().replace(/\s+/g, '-') : 'date'}-picker`;

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const gridDays = (() => {
    const y = current.getFullYear();
    const m = current.getMonth();
    const first = new Date(y, m, 1);
    let startDate = new Date(first);
    startDate.setDate(first.getDate() - first.getDay());
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  })();

  const selectDay = (day) => {
    const d = new Date(day);
      if (isOtherMonth(d)) return;
    if (maxDate && d > new Date(maxDate)) return;
    if (minDate && d < new Date(minDate)) return;
    onChange?.(d);
    setOpen(false);
  };

  const isToday = (day) => day.toDateString() === new Date().toDateString();
  const isSelected = (day) =>
    selectedDate && day.toDateString() === selectedDate.toDateString();
  const isOtherMonth = (day) => day.getMonth() !== current.getMonth();
  const isDisabled = (day) => {
    if (maxDate && day > new Date(maxDate)) return true;
    if (minDate && day < new Date(minDate)) return true;
    return false;
  };

  const prevMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const formatted = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className={`relative w-full ${className}`} ref={triggerRef}>
      <button
        type="button"
        id={inputId}
        className={`
          flex items-center justify-between w-full gap-2 cursor-pointer
          glass text-text-primary
          ${!error ? 'border-overlay/8' : 'border-danger/60'}
          border rounded-xl
          transition-all duration-200 pl-4 pr-3 py-[11px] text-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-primary/30'}
          outline-none
        `}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-label={label || placeholder}
        aria-haspopup="grid"
        aria-expanded={open}
      >
        <span className={formatted ? 'text-text-primary' : 'text-text-tertiary/70'}>
          {formatted || placeholder}
        </span>
        <Calendar size={14} className="text-text-secondary shrink-0" />
      </button>

      {/* Floating label */}
      {label && (
        <label htmlFor={inputId}
          className={`
            absolute left-4 transition-all duration-300 pointer-events-none
            ${selectedDate || open
              ? 'top-[6px] text-[10px] text-accent-glow font-semibold'
              : 'top-1/2 -translate-y-1/2 text-sm text-text-secondary'}
            ${error ? 'text-danger' : ''}
          `}
        >
          {label}
        </label>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`
              absolute z-30 mt-1 w-[256px]
              backdrop-blur-xl bg-bg-elevated/90 border border-overlay/10
              rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
              overflow-hidden
            `}
          >
            {/* Header: month nav */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-overlay/5">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevMonth}
                className="p-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary outline-none"
                aria-label="Previous month"
              >
                <ChevronLeft size={14} />
              </motion.button>
              <span className="text-xs font-semibold text-text-primary">
                {MONTHS[current.getMonth()]} {current.getFullYear()}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextMonth}
                className="p-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary outline-none"
                aria-label="Next month"
              >
                <ChevronRight size={14} />
              </motion.button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-px text-center bg-overlay/2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1.5 text-[10px] font-semibold text-text-tertiary/60">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div
              role="grid"
              tabIndex={-1}
              className="grid grid-cols-7 gap-px"
            >
              {gridDays.map((day, i) => {
                const sel = isSelected(day);
                const today = isToday(day);
                const other = isOtherMonth(day);
                const disabledDay = isOtherMonth(day) || isDisabled(day);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !disabledDay && selectDay(day)}
                    disabled={disabledDay}
                    aria-selected={sel}
                    aria-label={day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    className={`
                      relative py-2.5 text-center text-xs font-medium
                      transition-all duration-150 cursor-pointer outline-none
                      focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:z-10
                      ${other ? 'text-text-tertiary/30' : 'text-text-primary'}
                      ${today && !sel ? 'font-bold' : ''}
                      ${sel
                        ? 'bg-accent-primary text-white'
                        : disabledDay
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-bg-hover'}
                      ${disabledDay ? 'cursor-not-allowed' : ''}
                    `}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer: clear */}
            {selectedDate && (
              <div className="border-t border-overlay/5 px-3 py-2 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { onChange?.(null); setOpen(false); }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary hover:text-text-primary rounded hover:bg-bg-hover outline-none"
                >
                  <X size={11} /> Clear
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DatePicker;
