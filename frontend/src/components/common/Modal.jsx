// frontend/src/components/common/Modal.jsx
// Futuristic modal: cinematic spring entrance, gradient border glow, glass-deep surface,
// backdrop blur + vignette. Content slides up with a spring; exit fades down.
// Used in: Leads and Deals pages for adding/editing items.

import React, { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { easeOutExpo } from '../../animations/variants';

function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    const focusable = dialog?.querySelectorAll(
      'a[href],button:enabled,input:enabled,select:enabled,textarea:enabled,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab' || !first) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKeyDown);
    first?.focus();
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with vignette + blur */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 pointer-events-none modal-vignette" />

          {/* Modal Surface */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 40, scale: 0.94, rotateX: 6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.45, ease: easeOutExpo }}
            className={`
              w-full ${maxWidth} glass-deep rounded-2xl p-6 z-10 flex flex-col gap-3 relative overflow-hidden
              shadow-elevation-4
            `}
          >
            {/* Animated gradient top edge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-70" />

            {/* Header */}
            <div className="flex justify-between items-center select-none border-b border-overlay/5 pb-3">
               <h3 id={titleId} className="text-text-primary font-display font-semibold text-lg">{title}</h3>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Close dialog"
                className="text-text-secondary hover:text-text-primary hover:bg-overlay/5 p-1.5 rounded-lg transition-colors cursor-pointer outline-none border border-transparent"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Content Body */}
            <div className="flex-1 text-text-primary text-sm">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
