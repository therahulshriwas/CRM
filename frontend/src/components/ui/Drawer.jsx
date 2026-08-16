// frontend/src/components/ui/Drawer.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Slide-over drawer (side panel) primitive. Slides in from left/right/top/bottom.
// Mirrors Dialog's a11y surface (Escape, focus trap) but anchored to an edge.
//
// Sizes: sm | md | lg | xl | full
// Placements: left | right | top | bottom
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { easeOutExpo } from '../../animations/variants';

const placementConfig = {
  left:   { inset: 'left-0 top-0 h-full w-full max-w-full', translate: { x: '-100%' } },
  right:  { inset: 'right-0 top-0 h-full w-full max-w-full', translate: { x: '100%' } },
  top:    { inset: 'top-0 left-0 w-full max-w-full', translate: { y: '-100%' } },
  bottom: { inset: 'bottom-0 left-0 w-full max-w-full', translate: { y: '100%' } },
};

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'w-full h-full max-w-none m-0',
};

function Drawer({
  isOpen,
  onClose,
  title,
  children,
  placement = 'right',
  size = 'md',
  showClose = true,
  closeOnEscape = true,
  closeOnOutside = true,
  footer,
  className = '',
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  const cfg = placementConfig[placement] || placementConfig.right;
  const panelAlign = placement === 'left' || placement === 'right' ? 'h-full' : 'w-full';

  // ---- Escape ----
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, closeOnEscape]);

  // ---- Focus trap ----
  useEffect(() => {
    if (!isOpen) return;
    const el = panelRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'a[href],button:enabled,input:enabled,select:enabled,textarea:enabled,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    };
    el.addEventListener('keydown', onKey);
    const prev = document.activeElement;
    first?.focus();
    return () => { el.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [isOpen]);

  // ---- Animation variants per placement ----
  const variants = {
    initial: { opacity: 0, ...cfg.translate },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...cfg.translate },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            className={`
              fixed inset-0 z-40
              ${placement === 'left' || placement === 'right' ? 'bg-black/50' : 'bg-black/50'}
              backdrop-blur-sm
            `}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(6px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={closeOnOutside ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            className={`
              fixed inset-0 z-50
              ${cfg.inset} ${panelAlign}
              ${sizeClasses[size]}
              glass-deep
              shadow-[0_24px_80px_rgba(0,0,0,0.7),_0_0_40px_rgba(139,92,247,0.12)]
              flex flex-col overflow-hidden pointer-events-auto
              ${className}
            `}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.4, ease: easeOutExpo, type: 'tween' }}
          >
            {/* Top edge gradient */}
            {placement !== 'top' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-60" />
            )}
            {placement === 'top' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-60" />
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-overlay/5 select-none">
              {title ? (
                <h3 className="text-text-primary font-display font-semibold text-base">{title}</h3>
              ) : <div className="w-6" />}
              {showClose && (
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-overlay/5 transition-all duration-200 cursor-pointer outline-none border border-transparent"
                  aria-label="Close"
                >
                  <X size={18} />
                </motion.button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-text-primary">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-3 border-t border-overlay/5 flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
