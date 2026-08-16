// frontend/src/components/ui/Dropdown.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible dropdown/popover — click to open, Escape + outside-click to close,
// arrow-key navigation, cinematic entrance animation.
//
// Usage:
//   <Dropdown trigger={<Button>Menu</Button>} placement="bottom-end">
//     <Dropdown.Item onSelect={() => ...}>Edit</Dropdown.Item>
//     <Dropdown.Item danger>Delete</Dropdown.Item>
//   </Dropdown>
//
// The trigger is rendered as a real <button> with menu semantics
// (aria-haspopup + aria-expanded). Items receive a menu context so selecting
// one automatically closes the popover.
// =============================================================================

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { easeOutExpo } from '../../animations/variants';

// Closes the menu when the user clicks anywhere outside the trigger or popover,
// or presses Escape. Listeners are only attached while the menu is open and are
// removed on close/unmount (no dangling listeners).
function useOutsideClick(triggerRef, contentRef, handler, isActive) {
  useEffect(() => {
    if (!isActive) return;
    const onDown = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inContent = contentRef.current?.contains(e.target);
      if (!inTrigger && !inContent) handler(e);
    };
    const onKey = (e) => { if (e.key === 'Escape') handler(e); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isActive, handler, triggerRef, contentRef]);
}

// Provides each item a handle to close the popover after it is selected.
const DropdownContext = createContext(null);

const MENU_GAP = 8;

// Resolve the popover's fixed-viewport position from the trigger's bounding
// rect so it floats above page content (portaled to <body>, independent of the
// header's stacking context). Placement mirrors Tailwind's alignment classes.
function computeMenuPosition(rect, placement) {
  switch (placement) {
    case 'bottom':
      return { top: rect.bottom + MENU_GAP, left: rect.left };
    case 'top':
      return { bottom: Math.max(0, window.innerHeight - rect.top) + MENU_GAP, left: rect.left };
    case 'top-end':
      return {
        bottom: Math.max(0, window.innerHeight - rect.top) + MENU_GAP,
        right: Math.max(0, window.innerWidth - rect.right),
      };
    case 'bottom-end':
    default:
      return {
        top: rect.bottom + MENU_GAP,
        right: Math.max(0, window.innerWidth - rect.right),
      };
  }
}

function Dropdown({
  trigger,
  children,
  placement = 'bottom-end',
  hover = false,        // open on hover instead of click
  disabled = false,
  triggerClass = '',
  className = '',
  contentClass = '',
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const close = () => setOpen(false);
  useOutsideClick(triggerRef, contentRef, close, open);

  // While open, keep the popover glued to the trigger (reposition on scroll /
  // resize) and snapshot the position so the exit animation holds its spot.
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPos(computeMenuPosition(rect, placement));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, placement]);

  // Freshly measure on the open render (no first-frame jump); fall back to the
  // last snapshot while exiting so the menu animates out from where it was.
  const usedPos =
    open && triggerRef.current
      ? computeMenuPosition(triggerRef.current.getBoundingClientRect(), placement)
      : pos;

  // Keyboard: arrow navigation within items
  useEffect(() => {
    if (!open) return;
    const node = contentRef.current;
    if (!node) return;
    const onKey = (e) => {
      const items = node.querySelectorAll('[data-dropdown-item]');
      const enabled = Array.from(items).filter((i) => !i.hasAttribute('disabled'));
      if (!enabled.length) return;
      const idx = enabled.findIndex((i) => i === document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (idx + 1) % enabled.length;
        enabled[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (idx - 1 + enabled.length) % enabled.length;
        enabled[prev]?.focus();
      }
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <motion.button
          type="button"
          ref={triggerRef}
          whileHover={hover ? { y: -0.5 } : undefined}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => !disabled && !hover && setOpen((o) => !o)}
          onMouseEnter={hover ? () => !disabled && setOpen(true) : undefined}
          onMouseLeave={hover ? () => setOpen(false) : undefined}
          className={triggerClass}
        >
          {trigger}
        </motion.button>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.18, ease: easeOutExpo, type: 'tween' }}
              style={{ position: 'fixed', zIndex: 60, ...usedPos }}
              className={`
                min-w-[176px]
                backdrop-blur-xl bg-bg-elevated/90 border border-overlay/10
                rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                overflow-hidden
                ${contentClass}
              `}
            >
              <div className="flex flex-col py-1 text-sm" role="menu">
                <DropdownContext.Provider value={close}>
                  {children}
                </DropdownContext.Provider>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

// Dropdown.Item
Dropdown.Item = function DropdownItem({
  children,
  icon: Icon,
  onSelect,
  danger = false,
  disabled = false,
  loading = false,
  shortcut,
  className = '',
}) {
  const closeMenu = useContext(DropdownContext);
  return (
    <motion.button
      type="button"
      data-dropdown-item="true"
      role="menuitem"
      whileHover={!disabled ? { backgroundColor: 'rgba(124,58,237,0.06)' } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={() => {
        if (!disabled && !loading) {
          onSelect?.();
          closeMenu?.();
        }
      }}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 text-left
        font-medium
        transition-colors duration-150 cursor-pointer outline-none
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${danger
          ? 'text-danger hover:text-danger/80 hover:bg-danger/5'
          : 'text-text-secondary hover:text-text-primary'}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={13} className="shrink-0" />
      ) : null}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && (
        <kbd className="ml-auto bg-overlay/10 px-1 py-0.5 rounded text-[9px] font-mono border border-overlay/10">
          {shortcut}
        </kbd>
      )}
    </motion.button>
  );
};

// Dropdown.Separator
Dropdown.Separator = function DropdownSeparator() {
  return <div role="separator" className="border-t border-overlay/5 my-1" />;
};

// Dropdown.Label
Dropdown.Label = function DropdownLabel({ children }) {
  return (
    <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-text-tertiary/60">
      {children}
    </div>
  );
};

export default Dropdown;
