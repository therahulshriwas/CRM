// frontend/src/pages/NotFound.jsx
// 404 fallback page rendered for unknown paths.
// Used in: App.jsx catch-all route.

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { pageVariants } from '../animations/variants';

function NotFound() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-bg-base px-4"
    >
      <div className="p-4 rounded-2xl glass">
        <Compass size={32} className="text-accent-glow" />
      </div>
      <h1 className="text-4xl font-display font-semibold text-text-primary">404</h1>
      <p className="text-sm text-text-secondary">This page drifted into deep space.</p>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-accent-glow hover:text-accent-secondary-glow transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
    </motion.div>
  );
}

export default NotFound;
