// frontend/src/components/layout/AppLayout.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 Shell Layout
// -----------------------------------------------------------------------------
// Application shell: floating glass Sidebar (desktop rail that collapses to
// 64px / expands to 232px on hover; off-canvas drawer on mobile/tablet) + a
// topbar that docks below the sidebar on desktop or spans full-width on mobile
// + the routed page content with AnimatePresence page transitions.
//
// Used in: App.jsx as the authenticated layout wrapper for all protected pages.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import FloatingAIButton from './FloatingAIButton';
import AIAssistantOverlay from '../ai/AIAssistantOverlay';
import GalacticBackground from '../common/GalacticBackground';
import { useAiStore } from '../../store/aiStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { getPageTitle } from '../../config/navItems';
import { routeVariants } from '../../animations/variants';

function AppLayout() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const togglePanel = useAiStore((s) => s.togglePanel);
  const sidebarExpanded = useSidebarStore((s) => s.expanded);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On route change on mobile, dismiss the drawer.
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  // Desktop: sidebar hover state (collapsed 64px vs expanded 232px) is managed
  // internally by Sidebar via mouse enter/leave. We keep the sidebar rail
  // permanently present on desktop (not toggled by the hamburger).
  // The content area is offset by the collapsed rail on desktop via pl-[232px]
  // when expanded — handled through a CSS-aware wrapper below.
  return (
    <div className="min-h-screen text-text-primary relative">
      <GalacticBackground />

      {/* Mobile drawer scrim */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden bg-bg-default/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (rail on desktop / drawer on mobile) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Topbar + content column.
          On desktop the main content is offset past the floating rail, and the
          offset follows the rail width (232px expanded / 64px collapsed) so the
          layout reflows when the user collapses the rail. */}
      <main className={`${sidebarExpanded ? 'lg:pl-[256px]' : 'lg:pl-[88px]'} min-h-screen flex flex-col transition-[padding] duration-300`}>
        <Topbar
          pageTitle={pageTitle}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Page content with transition.
            A keyed motion.div remounts on route change (fade-up entrance) WITHOUT
            an AnimatePresence wrapper. AnimatePresence kept the exiting child in the
            layout flow while its <Outlet /> re-rendered with the *new* route — so
            every navigation stacked a second (ghost) copy of the destination page,
            creating a large permanent blank region above/below the real content. */}
        <div className="relative flex-1 mt-2 pb-16 px-6 lg:px-8 overflow-hidden">
          <motion.div
            key={location.pathname}
            variants={routeVariants}
            initial="initial"
            animate="animate"
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <FloatingAIButton onClick={togglePanel} />
      <AIAssistantOverlay />
    </div>
  );
}

export default AppLayout;
