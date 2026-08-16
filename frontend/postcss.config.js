// frontend/postcss.config.js
// PostCSS configuration enabling Tailwind CSS v4 (via @tailwindcss/postcss) and Autoprefixer processing.
// Used in: Vite CSS build pipeline.
// Note: Tailwind v4 moved the PostCSS entry point to @tailwindcss/postcss — do not revert to the v3 `tailwindcss` plugin.

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
