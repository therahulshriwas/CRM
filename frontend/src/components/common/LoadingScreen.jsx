// frontend/src/components/common/LoadingScreen.jsx
// Full-viewport futuristic loader: orbiting gradient rings around a pulsing core,
// equalizer bars, and a shimmering label. Used during route lazy-loading and auth checks.
// Used in: ProtectedRoute, Suspense fallbacks, page-level data fetching.

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-bg-base overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary opacity-10 blur-[110px] pointer-events-none" />

      {/* Orbit rings */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer rotating dashed ring */}
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-dashed border-accent-highlight/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        {/* Mid rotating conic ring */}
        <motion.span
          className="absolute inset-2 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgb(var(--c-accent-primary) / 0.5) 30%, transparent 45%, rgb(var(--c-info) / 0.4) 70%, transparent 85%)', maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))' }}
        />
        {/* Pulsing core */}
        <motion.div
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow flex items-center justify-center glow-strong"
        >
          <Rocket size={22} className="text-text-primary icon-stroke" />
        </motion.div>
      </div>

      {/* Equalizer bars */}
      <div className="flex items-end gap-1 h-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-accent-primary to-accent-secondary-glow"
            animate={{ scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
      </div>

      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-xs text-text-secondary font-medium tracking-[0.2em] uppercase"
      >
        {label}
      </motion.span>
    </div>
  );
}

export default LoadingScreen;
