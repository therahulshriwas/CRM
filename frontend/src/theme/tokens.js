// frontend/src/theme/tokens.js
// ============================================================================
// Antigravity CRM — Design System 2.0 (Foundation)
// ----------------------------------------------------------------------------
// The SINGLE source of truth for every design token. Everything semantic —
// colors, surfaces, borders, shadows, blur, typography, spacing, radius, icon
// sizing, motion, focus rings, and state primitives — flows from here.
//
// Token layers
//   rawPalette  → semanticColors  → componentRoles  → componentTokens (in JSX/CSS)
//   spacing     → layout spacing (8pt system)
//   radius      → border radius scale
//   shadows     → elevation system (replaces .neu-card / .gradient-card shadows)
//   blur        → backdrop-blur + layer blur scale
//   typography  → type scale + line-height + letter-spacing + weights
//   iconSize    → canonical icon sizes
//   motion      → durations, easings, spring presets
//   states      → loading / empty / error / success / skeleton tokens
//   focus       → focus ring + focus-visible tokens
//
// Consumed by:
//   - src/theme/tokens.css  (CSS custom properties for the runtime palette)
//   - tailwind.config.js    (semantic colors, spacing, fontFamily, keyframes)
//   - components (via the token CSS vars + Tailwind semantic classes)
//
// Design language: premium enterprise — inspired by Linear, Attio, Arc, Vercel,
// Stripe Dashboard, Reflect, Apple VisionOS, Raycast. Original implementation.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. RAW PALETTE
// ----------------------------------------------------------------------------
// Canonical aurora palette (unchanged brand values from Design System 1.0).
// These are the only place raw hex lives; everything else references them.
export const rawPalette = {
  // Neutral surfaces (dark default)
  neutral: {
    50: '#06040b',   // bg-base  — deep space black
    100: '#0c0817',  // bg-secondary
    200: '#12101c',  // bg-surface (default card surface)
    300: '#171425',  // bg-card (elevated)
    400: '#201b31',  // bg-hover
    500: '#38344a',  // border (mid)
    600: '#514d64',  // text-secondary (dark text on light)
    700: '#b7b8c5',  // text-secondary (light text on dark)
    800: '#ffffff',  // text-primary (dark text on light)
    900: '#ffffff',  // text-primary (light text on dark)
  },
  // Brand accents (purple cosmic)
  accent: {
    50: '#7c3aed',    // accent-primary
    100: '#8b5cf6',   // accent-glow
    200: '#a855f7',   // accent-highlight
    300: '#c084fc',   // accent-secondary-glow
  },
  // Functional / categorical
  info: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  // Light-mode brand shifts
  accentLight: {
    50: '#6d31d5',   // deeper purple for contrast on light
    100: '#7c3aed',  // accent-glow maps here in light
    200: '#9333ea',  // accent-highlight
    300: '#a855f7',  // accent-secondary-glow
  },
};

// ----------------------------------------------------------------------------
// 2. SEMANTIC COLOR TOKENS
// ----------------------------------------------------------------------------
// Semantic aliases consumed by every component. A component never references a
// raw palette value — it uses `color-*` / `bg-*` / `border-*` semantic tokens.
// Swapping to a new theme = overriding these aliases in `:root`.
export const semanticColors = {
  base: {
    'color-bg-default': 'rgb(var(--c-bg-default) / <alpha-value>)',
    'color-bg-canvas': 'rgb(var(--c-bg-canvas) / <alpha-value>)',
    'color-bg-surface': 'rgb(var(--c-bg-surface) / <alpha-value>)',
    'color-bg-elevated': 'rgb(var(--c-bg-elevated) / <alpha-value>)',
    'color-bg-hover': 'rgb(var(--c-bg-hover) / <alpha-value>)',
    'color-bg-active': 'rgb(var(--c-bg-active) / <alpha-value>)',
    'color-bg-inset': 'rgb(var(--c-bg-inset) / <alpha-value>)',
    'color-bg-overlay': 'rgb(var(--c-overlay) / <alpha-value>)',
    'color-bg-transparent': 'transparent',

    'color-border-default': 'rgb(var(--c-border-default) / <alpha-value>)',
    'color-border-strong': 'rgb(var(--c-border-strong) / <alpha-value>)',
    'color-border-interactive': 'rgb(var(--c-border-interactive) / <alpha-value>)',
    'color-border-focus': 'rgb(var(--c-border-focus) / <alpha-value>)',
    'color-border-danger': 'rgb(var(--c-border-danger) / <alpha-value>)',

    'color-text-primary': 'rgb(var(--c-text-primary) / <alpha-value>)',
    'color-text-secondary': 'rgb(var(--c-text-secondary) / <alpha-value>)',
    'color-text-tertiary': 'rgb(var(--c-text-tertiary) / <alpha-value>)',
    'color-text-disabled': 'rgb(var(--c-text-disabled) / <alpha-value>)',
    'color-text-inverse': 'rgb(var(--c-text-inverse) / <alpha-value>)',
    'color-text-link': 'rgb(var(--c-text-link) / <alpha-value>)',
    'color-text-link-hover': 'rgb(var(--c-text-link-hover) / <alpha-value>)',
  },
  brand: {
    'color-brand-primary': 'rgb(var(--c-accent-primary) / <alpha-value>)',
    'color-brand-glow': 'rgb(var(--c-accent-glow) / <alpha-value>)',
    'color-brand-highlight': 'rgb(var(--c-accent-highlight) / <alpha-value>)',
    'color-brand-accent': 'rgb(var(--c-accent-secondary-glow) / <alpha-value>)',
  },
  state: {
    'color-state-info': 'rgb(var(--c-info) / <alpha-value>)',
    'color-state-success': 'rgb(var(--c-success) / <alpha-value>)',
    'color-state-warning': 'rgb(var(--c-warning) / <alpha-value>)',
    'color-state-danger': 'rgb(var(--c-danger) / <alpha-value>)',
  },
};

// ----------------------------------------------------------------------------
// 3. SURFACE + ELEVATION SYSTEM
// ----------------------------------------------------------------------------
// Elevation = shadow stack. Replaces the old .neu-card / .gradient-card / .halo
// shadows with a unified, theme-aware elevation scale.
export const elevation = {
  // level 0 — flush with canvas (no shadow)
  0: '0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0)',
  // level 1 — subtle card lift (stat cards, panels, table rows)
  1: '0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20)',
  // level 2 — floating surface (modals, dropdowns, sticky headers)
  2: '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
  // level 3 — elevated panel (command palette, floating button)
  3: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), 0 0 24px rgba(124,58,237,0.12)',
  // level 4 — spotlight (top of stack, toast, AI launcher)
  4: '0 24px 80px rgba(0,0,0,0.70), 0 0 40px rgba(124,58,237,0.18)',
};

// Light-mode elevation stack (softer, with a white-specular component)
export const elevationLight = {
  0: '0 0 0 0 rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0)',
  1: '0 1px 3px rgba(20,16,40,0.06), 0 1px 2px rgba(20,16,40,0.04)',
  2: '0 4px 20px rgba(20,16,40,0.08), 0 0 0 1px rgba(20,16,40,0.06)',
  3: '0 10px 30px rgba(20,16,40,0.14), 0 0 0 1px rgba(20,16,40,0.08), 0 0 24px rgba(124,58,237,0.10)',
  4: '0 20px 50px rgba(20,16,40,0.18), 0 0 32px rgba(124,58,237,0.14)',
};

// ----------------------------------------------------------------------------
// 4. BORDER SYSTEM
// ----------------------------------------------------------------------------
export const borderWidth = {
  none: '0',
  hairline: '1px',        // 1px borders (default card border)
  thin: '2px',            // focus rings, active accents
  thick: '4px',           // strong active indicators (sidebar pill beam)
};

// ----------------------------------------------------------------------------
// 5. BLUR SYSTEM
// ----------------------------------------------------------------------------
export const blur = {
  none: 'none',
  sm: 'blur(4px)',
  DEFAULT: 'blur(12px)',   // standard glass backdrop
  md: 'blur(16px)',        // .glass-deep backdrop
  lg: 'blur(24px)',        // aurora / spotlight
  xl: 'blur(40px)',        // hero glow
  xl2: 'blur(80px)',       // full backdrop glow
  xl3: 'blur(110px)',      // cinematic orb glow
};

// backdrop-filter sugar (kept semantic)
export const backdrop = {
  glass: 'blur(12px) saturate(1.4)',
  glassDeep: 'blur(24px) saturate(1.5)',
};

// ----------------------------------------------------------------------------
// 6. TYPOGRAPHY SCALE
// ----------------------------------------------------------------------------
// 8pt grid-aligned scale. `font-display` = Geist (headings), `font-sans` = Inter (body),
// `font-mono` = JetBrains Mono (code).
export const typography = {
  fontDisplay: ['Geist', 'system-ui', 'sans-serif'],
  fontBody: ['Inter', 'system-ui', 'sans-serif'],
  fontMono: ['JetBrains Mono', 'monospace'],
  fontFeatureSettings: {
    // Tabular numbers for financial data / timestamps
    tabular: {
      'font-feature-settings': '"tnum" 1, "lnum" 1',
      'font-variant-numeric': 'tabular-nums',
    },
  },
  scale: {
    // Display / hero
    display: { fontSize: '2.25rem', lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: 600 },
    // Large heading
    h1: { fontSize: '1.75rem', lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: 600 },
    // Medium heading
    h2: { fontSize: '1.375rem', lineHeight: '1.75rem', letterSpacing: '-0.005em', fontWeight: 600 },
    // Small heading
    h3: { fontSize: '1.125rem', lineHeight: '1.5rem', fontWeight: 600 },
    // Lead/paragraph
    lead: { fontSize: '1rem', lineHeight: '1.625rem', fontWeight: 400 },
    // Body
    body: { fontSize: '0.9375rem', lineHeight: '1.4rem', fontWeight: 400 },
    // Large body
    bodyLg: { fontSize: '1.0625rem', lineHeight: '1.5rem', fontWeight: 400 },
    // Small body / tables
    small: { fontSize: '0.8125rem', lineHeight: '1.15rem', fontWeight: 400 },
    // Caption / labels
    caption: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 500 },
    // Tiny / overline / data
    overline: { fontSize: '0.625rem', lineHeight: '0.875rem', fontWeight: 600, letterSpacing: '0.08em' },
    micro: { fontSize: '0.5625rem', lineHeight: '0.75rem', fontWeight: 600 },
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// ----------------------------------------------------------------------------
// 7. SPACING SYSTEM (8pt grid)
// ----------------------------------------------------------------------------
// 1 unit = 0.25rem (4px). Multiples of 4px → 8pt-friendly.
// Use these as the canonical spacing vocabulary; avoid arbitrary `px-*` numbers.
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px  (hairline offsets)
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};

// ----------------------------------------------------------------------------
// 8. RADIUS SYSTEM
// ----------------------------------------------------------------------------
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  DEFAULT: '0.4375rem', // 7px (form fields, inputs)
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  full: '9999px',
  '2xl': '1rem',
  '3xl': '1.5rem',
};

// ----------------------------------------------------------------------------
// 9. ICON SIZING RULES
// ----------------------------------------------------------------------------
// Canonical icon sizes used across buttons, list rows, headers, and chips.
// Keep a single weight (1.5px stroke) via lucide-react everywhere.
export const iconSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xl2: 22,
  xl3: 24,
  xl4: 28,
  xl5: 32,
};

// ----------------------------------------------------------------------------
// 10. MOTION TOKENS  (Durations + Easings + Springs)
// ----------------------------------------------------------------------------
export const motion = {
  duration: {
    instant: '0.05s',   // near-instant (reduced-motion fallback)
    fast: '0.12s',      // micro-interactions (hover, tap)
    base: '0.2s',       // standard transitions (focus rings, icon swaps)
    slow: '0.3s',       // page fades, panel slides
    slower: '0.45s',    // modal entrances, hero reveals
    slowest: '0.8s',    // staggered page loads
  },
  easing: {
    // Standard physical curve (matches Framer Motion spring fallback aesthetic)
    standard: [0.22, 1, 0.36, 1],
    // Entrance / emphasized
    emphasized: [0.2, 0, 0, 1],
    // Exit / de-emphasized
    emphasizedDecelerate: [0.04, 0.73, 0.22, 1],
    // Linear for rotation/orbit
    linear: 'linear',
  },
  spring: {
    // Default interaction spring (hover, drag, modal)
    default: { type: 'spring', stiffness: 300, damping: 30 },
    // Bouncier emphasis (buttons, active pills)
    bouncy: { type: 'spring', stiffness: 400, damping: 22 },
    // Smooth physical (cards, lifts)
    smooth: { type: 'spring', stiffness: 280, damping: 28 },
    // Stiff snap (magnetic, toggles)
    snap: { type: 'spring', stiffness: 450, damping: 20 },
  },
  stagger: {
    list: 0.06,      // per-item stagger (stat cards, table rows)
    section: 0.12,   // section stagger (page load)
  },
};

// ----------------------------------------------------------------------------
// 11. FOCUS RING SYSTEM
// ----------------------------------------------------------------------------
export const focusRing = {
  ringWidth: '2px',
  ringOffset: '2px',
  ringRadius: '0.375rem', // rounded-md
  // Accent focus ring — theme-aware via CSS var
  ringColor: 'rgb(var(--c-border-focus) / <alpha-value>)',
};

// ----------------------------------------------------------------------------
// 12. SCROLLBAR STYLING
// ----------------------------------------------------------------------------
export const scrollbar = {
  width: '8px',
  trackBg: 'transparent',
  thumbBgDark: 'rgba(255 255 255 / 0.08)',
  thumbBgDarkHover: 'rgba(255 255 255 / 0.16)',
  thumbBgLight: 'rgba(20 16 40 / 0.18)',
  thumbBgLightHover: 'rgba(20 16 40 / 0.30)',
  radius: '9999px',
  thumbTransition: 'background 0.2s ease',
};

// ----------------------------------------------------------------------------
// 13. STATE PRIMITIVE TOKENS
// ----------------------------------------------------------------------------
// Loading / empty / error / success surfaces and accents — consumed by the
// unified StatusState + Skeleton components.
export const states = {
  skeleton: {
    bg: 'rgb(var(--c-bg-hover) / 0.4)',
    highlight: 'rgb(var(--c-text-primary) / 0.04)',
    radius: '0.5rem',
  },
  empty: {
    iconRing: 'rgb(var(--c-accent-primary) / 0.12)',
    iconGlow: 'rgb(var(--c-accent-primary) / 0.25)',
    title: 'var(--c-text-primary)',
    desc: 'var(--c-text-secondary)',
  },
  loading: {
    spinnerTrack: 'rgba(124 58 237 / 0.15)',
    spinnerFill: 'var(--c-accent-glow)',
  },
  error: {
    surface: 'rgb(var(--c-bg-default) / 0.6)',
    border: 'rgb(var(--c-danger) / 0.30)',
    bg: 'rgba(244 63 94 / 0.06)',
    text: 'var(--c-danger)',
    icon: 'var(--c-danger)',
  },
  success: {
    surface: 'rgb(var(--c-bg-default) / 0.6)',
    border: 'rgb(var(--c-success) / 0.30)',
    bg: 'rgba(16 185 129 / 0.06)',
    text: 'var(--c-success)',
    icon: 'var(--c-success)',
  },
};

// ----------------------------------------------------------------------------
// 14. COMPONENT ROLE TOKENS
// ----------------------------------------------------------------------------
// Maps raw palette → semantic component props. Components accept a `color` role
// and resolve via this map instead of hardcoding hex values.
export const roleColorMap = {
  primary: { label: 'Primary', hex: rawPalette.accent[50], cssVar: 'var(--c-accent-primary)' },
  success: { label: 'Success', hex: rawPalette.success, cssVar: 'var(--c-success)' },
  warning: { label: 'Warning', hex: rawPalette.warning, cssVar: 'var(--c-warning)' },
  danger: { label: 'Danger', hex: rawPalette.danger, cssVar: 'var(--c-danger)' },
  info: { label: 'Info', hex: rawPalette.info, cssVar: 'var(--c-info)' },
  neutral: { label: 'Neutral', hex: rawPalette.neutral[700], cssVar: 'var(--c-text-secondary)' },
};

