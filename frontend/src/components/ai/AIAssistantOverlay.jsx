// frontend/src/components/ai/AIAssistantOverlay.jsx
// Global AI assistant overlay launched by the floating AI button on every authenticated page.
// Slides up above the launcher, shares the same aiStore conversation as the dashboard panel.
// Used in: components/layout/AppLayout.jsx.

import React, { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useAiStore } from '../../store/aiStore';
import AIAssistantChat from './AIAssistantChat';

const AIAssistantOverlay = memo(function AIAssistantOverlay() {
  const { isOpen, closePanel } = useAiStore();
  const panelRef = useRef(null);

  // Escape closes the panel; focus moves in on open and is restored on close.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector('button, textarea, input')?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, closePanel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="false"
          aria-label="AI Copilot"
          className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-3rem)] rounded-2xl glass border border-overlay/10 shadow-[0_12px_40px_rgba(0,0,0,0.8),_0_0_24px_rgba(139,92,246,0.12)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-overlay/5 bg-overlay/2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-accent-primary to-accent-highlight shadow-[0_0_12px_rgba(124,58,237,0.5)]">
                <Sparkles size={14} color="#FFFFFF" />
              </div>
              <div className="flex flex-col">
                 <span id="ai-copilot-title" className="text-xs font-display font-semibold text-text-primary">AI Copilot</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-accent-secondary-glow">Beta</span>
              </div>
            </div>
              <button
               onClick={closePanel}
               aria-label="Close AI Copilot"
              className="text-text-secondary hover:text-text-primary hover:bg-overlay/5 p-1.5 rounded-lg transition-colors cursor-pointer outline-none border border-transparent"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat body */}
          <div className="flex flex-col gap-3 p-4 min-h-[280px] max-h-[50vh]">
            <AIAssistantChat />
          </div>
         </motion.div>
      )}
    </AnimatePresence>
  );
});

export default AIAssistantOverlay;
