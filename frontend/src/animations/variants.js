// frontend/src/animations/variants.js
// Defines reusable Framer Motion animation variants and transition configurations.
// Used in: Pages and components across the frontend to drive micro-interactions.

import { motion as motionTokens } from '../theme/tokens';

// Smooth global easing used across the futuristic UI
export const easeOutExpo = [0.22, 1, 0.36, 1];

// Default physical spring physics settings
export const springTransition = {
  ...motionTokens.spring.default,
};

// Page load fade-up transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: Number.parseFloat(motionTokens.duration.slow),
      ease: motionTokens.easing.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: Number.parseFloat(motionTokens.duration.base),
      ease: motionTokens.easing.emphasizedDecelerate,
    },
  },
};

// Shared route transition keeps adjacent screens visually continuous during navigation.
export const routeVariants = {
  initial: { opacity: 0, y: 8, scale: 0.998 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.999,
    transition: { duration: 0.2, ease: easeOutExpo },
  },
};

// Staggered list container variants
export const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: motionTokens.stagger.list,
    },
  },
};

// Staggered child variants
export const itemVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

// Hover scale transform for cards/buttons
export const hoverScale = {
  hover: {
    scale: 1.02,
    transition: springTransition,
  },
  tap: {
    scale: 0.98,
    transition: springTransition,
  },
};

// Modal slide-up overlay transitions
export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: springTransition },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } },
  },
};

// ============ CINEMATIC ENTRANCE / HERO ============

// Land a hero title line with a soft blur-up reveal
export const heroLineVariants = {
  initial: { opacity: 0, y: 34, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

// Word-level stagger container for split headlines
export const staggerWords = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
export const wordVariants = {
  initial: { opacity: 0, y: 26, rotateX: 40, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

// Scale-up entrance with spring for hero media / cards
export const heroScaleVariants = {
  initial: { opacity: 0, scale: 0.92, y: 24 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOutExpo, delay: 0.25 },
  },
};

// ============ SCROLL REVEAL ============

// Section reveal that triggers on scroll into view
export const revealVariants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

export const revealLeftVariants = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeOutExpo } },
};

export const revealRightVariants = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeOutExpo } },
};

// Stagger container for feature grids
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

// ============ FUTURISTIC HOVER ============

// 3D tilt lift for cards (combine with a mouse-followed rotateX/Y in components)
export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 320, damping: 22 } },
  tap: { scale: 0.97 },
};

// Icon micro-bounce
export const iconPop = {
  rest: { scale: 1 },
  hover: { scale: 1.15, rotate: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } },
};

// Magnetic button pull
export const magnetic = {
  hover: { scale: 1.04 },
  tap: { scale: 0.96 },
};

// Glow ring around avatar/logo on hover
export const glowPulse = {
  rest: { opacity: 0.35, scale: 1 },
  hover: { opacity: 0.9, scale: 1.25, transition: { duration: 0.4 } },
};

// ============ LOADER / FEEDBACK ============

export const loaderOrbit = {
  animate: { rotate: 360, transition: { duration: 1.4, repeat: Infinity, ease: 'linear' } },
};

export const eqBarVariants = {
  animate: {
    scaleY: [0.3, 1, 0.3],
    transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ============ ADDITIONAL PROFESSIONAL ANIMATIONS ============

// Smooth fade-in for cards and panels
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

// Slide-in from the left for sidebar items and panels
export const slideInLeftVariants = {
  initial: { opacity: 0, x: -24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

// Slide-in from the right for detail panels
export const slideInRightVariants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

// Slide-in from the bottom for modals and toasts
export const slideInUpVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

// Scale-in for badges and small elements
export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

// Staggered fade-in for lists
export const staggerFadeVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerFadeItemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

// Elastic bounce for interactive elements
export const elasticTap = {
  hover: { scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  tap: { scale: 0.96, transition: { type: 'spring', stiffness: 500, damping: 25 } },
};

// Smooth height animation for accordion/collapsible sections
export const heightAnimation = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.4, ease: easeOutExpo } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.3, ease: easeOutExpo } },
};
