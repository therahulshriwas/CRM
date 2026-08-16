// frontend/tailwind.config.js
// ============================================================================
// Antigravity CRM — Design System 2.0 (Foundation)
// ----------------------------------------------------------------------------
// Tailwind entry point. All colors resolve to CSS custom properties defined in
// src/theme/tokens.css, so a single `data-theme` switch swaps the entire dark/
// light palette. Semantic class names come from here; raw palette values live
// only in tokens.css.
// Used in: Vite CSS build pipeline.
// ============================================================================

import {
  semanticColors,
  spacing,
  typography,
  radius,
  motion,
} from './src/theme/tokens.js';

// Semantic color vocabulary. Every key is a color NAME that Tailwind prefixes
// with bg-/text-/border-/ring-/from-/via-/to-/divide-. So `bg-surface` produces
// the class `bg-bg-surface`, `accent-glow` produces `bg-accent-glow` /
// `text-accent-glow`, and `success` produces `bg-success` / `text-success`.
// All values are token-backed (CSS vars) so opacity modifiers like `/10` work.
const colors = {
  // ---- Surfaces (→ bg-bg-*, border-bg-*, from-bg-*) ----
  'bg-default': semanticColors.base['color-bg-default'],
  'bg-canvas': semanticColors.base['color-bg-canvas'],
  'bg-surface': semanticColors.base['color-bg-surface'],
  'bg-elevated': semanticColors.base['color-bg-elevated'],
  'bg-hover': semanticColors.base['color-bg-hover'],
  'bg-active': semanticColors.base['color-bg-active'],
  'bg-inset': semanticColors.base['color-bg-inset'],
  'bg-overlay': semanticColors.base['color-bg-overlay'],
  'bg-transparent': 'transparent',
  // Compatibility aliases used across the app shell.
  'bg-base': semanticColors.base['color-bg-default'],
  'bg-card': semanticColors.base['color-bg-elevated'],
  'bg-secondary': semanticColors.base['color-bg-canvas'],

  // ---- Text (→ text-text-*, bg-text-*, border-text-*) ----
  'text-primary': semanticColors.base['color-text-primary'],
  'text-secondary': semanticColors.base['color-text-secondary'],
  'text-tertiary': semanticColors.base['color-text-tertiary'],
  'text-disabled': semanticColors.base['color-text-disabled'],
  'text-inverse': semanticColors.base['color-text-inverse'],
  'text-link': semanticColors.base['color-text-link'],
  'text-link-hover': semanticColors.base['color-text-link-hover'],

  // ---- Borders (→ border-border-*, bg-border-*) ----
  'border-default': semanticColors.base['color-border-default'],
  'border-strong': semanticColors.base['color-border-strong'],
  'border-interactive': semanticColors.base['color-border-interactive'],
  'border-focus': semanticColors.base['color-border-focus'],
  'border-danger': semanticColors.base['color-border-danger'],

  // ---- Brand accents (→ bg-accent-*, text-accent-*, border-accent-*,
  //      ring-accent-*, from/via/to-accent-*) ----
  'accent-primary': semanticColors.brand['color-brand-primary'],
  'accent-glow': semanticColors.brand['color-brand-glow'],
  'accent-highlight': semanticColors.brand['color-brand-highlight'],
  'accent-secondary-glow': semanticColors.brand['color-brand-accent'],

  // ---- Overlay + functional states ----
  overlay: semanticColors.base['color-bg-overlay'],
  info: semanticColors.state['color-state-info'],
  success: semanticColors.state['color-state-success'],
  warning: semanticColors.state['color-state-warning'],
  danger: semanticColors.state['color-state-danger'],
};

const fontSize = Object.fromEntries(
  Object.entries(typography.scale).map(([name, value]) => [
    name === 'bodyLg' ? 'body-lg' : name,
    [value.fontSize, {
      lineHeight: value.lineHeight,
      letterSpacing: value.letterSpacing,
      fontWeight: value.fontWeight,
    }],
  ])
);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // base resets are in index.css; keeps theme control tight
  },
  theme: {
    extend: {
      // ---- Color palette (all semantic, all → CSS vars in tokens.css) ----
      colors,

      // ---- Typography ----
      fontFamily: {
        display: typography.fontDisplay,
        body: typography.fontBody,
        mono: typography.fontMono,
      },
      fontSize,

      // ---- Spacing (8pt grid — 1 unit = 0.25rem / 4px) ----
      spacing,

      // ---- Radius (from tokens.js) ----
      borderRadius: radius,

      // ---- Motion (easing + durations) ----
      transitionTimingFunction: {
        standard: `cubic-bezier(${motion.easing.standard.join(',')})`,
        emphasized: `cubic-bezier(${motion.easing.emphasized.join(',')})`,
        'emphasized-decelerate': `cubic-bezier(${motion.easing.emphasizedDecelerate.join(',')})`,
      },
      transitionDelay: {
        75: '75ms', 100: '100ms', 150: '150ms', 200: '200ms',
        300: '300ms', 500: '500ms',
      },
      transitionDuration: Object.fromEntries(
        Object.entries(motion.duration).map(([name, value]) => [name, `${parseFloat(value) * 1000}ms`])
      ),

      // ---- Shadows (elevation) ----
      boxShadow: {
        'elevation-1': 'var(--shadow-1)',
        'elevation-2': 'var(--shadow-2)',
        'elevation-3': 'var(--shadow-3)',
        'elevation-4': 'var(--shadow-4)',
        focus: 'var(--shadow-focus)',
        sm: 'var(--shadow-1)',
        DEFAULT: 'var(--shadow-2)',
        lg: 'var(--shadow-3)',
        xl: 'var(--shadow-4)',
        inset: 'var(--shadow-inset)',
      },
    },
  },
  plugins: [],
}
