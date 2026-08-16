// frontend/src/main.jsx
// Application entry point. Mounts the React tree. The theme is applied to <html data-theme> before render.
// Used in: index.html bootstrapping.
// Note: Tailwind preflight is disabled, so base resets come from index.css only.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import './index.css';
import App from './App.jsx';
import { useThemeStore } from './store/themeStore.js';
import { Toaster } from './components/ui/Toast.jsx';

// Apply the persisted/system theme before the first paint to avoid a flash of the wrong theme.
useThemeStore.getState().applyTheme(useThemeStore.getState().mode);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
      <Toaster />
    </MotionConfig>
  </StrictMode>,
);
