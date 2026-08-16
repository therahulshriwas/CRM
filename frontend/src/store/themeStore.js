// frontend/src/store/themeStore.js
// Zustand state manager for the app theme (dark/light). Persists to localStorage,
// defaults to the OS color-scheme preference, and applies the chosen mode to the
// <html> element via a `data-theme` attribute so CSS variables swap the whole palette.
// Used in: main.jsx (pre-paint theme bootstrap), Topbar (toggle button), chart components.

import { create } from 'zustand';

const STORAGE_KEY = 'antigravity-theme';

function getInitialMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage unavailable — fall through to system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const useThemeStore = create((set, get) => ({
  mode: getInitialMode(),

  applyTheme: (mode) => {
    document.documentElement.setAttribute('data-theme', mode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#06040B' : '#F5F4FB');
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // persist is best-effort
    }
    set({ mode });
  },

  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    get().applyTheme(next);
  },

  setMode: (mode) => get().applyTheme(mode),
}));
