// frontend/src/components/layout/FloatingAIButton.jsx
// Floating circular action button in bottom right of screen triggering global AI panel.
// Used in: Default layouts wrapping main pages.

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { hoverScale } from '../../animations/variants';

function FloatingAIButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Open AI Copilot"
      title="Open AI Copilot"
      variants={hoverScale}
      whileHover="hover"
      whileTap="tap"
      className="
        fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full border border-overlay/15
        bg-gradient-to-r from-accent-primary to-accent-highlight flex items-center justify-center
        shadow-elevation-2 hover:shadow-elevation-3
        cursor-pointer outline-none border-overlay/10
      "
    >
      <Sparkles size={20} color="#FFFFFF" className="animate-pulse" />
    </motion.button>
  );
}

export default FloatingAIButton;
