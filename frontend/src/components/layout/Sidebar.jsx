// frontend/src/components/layout/Sidebar.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 Shell
// -----------------------------------------------------------------------------
// NEW floating glass sidebar, rebuilt from scratch in the style of Linear +
// Attio + Arc Browser.
//
// Layout:
//   ┌────────────────────────────┐
//   │ [Workspace]              │  ← WorkspaceSwitcher (persisted)
//   ┢━━━━━━━━━━━━━━━━━━━━━━━━━━┩
//   │  Core Modules (group)      │
//   │  • Dashboard              │  ← icon + label, active = left beam pill
//   │  • Leads                   │
//   │  ...                        │
//   ┢━━━━━━━━━━━━━━━━━━━━━━━━━━┩
//   │  Tools (group)             │
//   │  • Settings                │
//   │  • Help                    │
//   ┢━━━━━━━━━━━━━━━━━━━━━━━━━━┩
//   │ [Avatar]  Name            │  ← user profile + role
//   │  Sign Out                  │
//   └────────────────────────────┘
//
// Features:
//   • Floating glass + elevation shadow (desktop)
//   • Mobile off-canvas drawer with slide + scrim
//   • Smooth collapse: desktop collapses to 64px rail (hover expands)
//   • Arc-Browser style "zoom" transition when expanding/collapsing
//   • Linear-style active indicator: gradient pill + left accent beam
//   • Nested navigation support (grouped sub-items)
//   • Keyboard navigation (arrow keys / Home-End / type-to-navigate)
//   • Recently-opened section (reads from localStorage history)
//   • Favorites (persistent per workspace)
//   • Perfect alignment, focus rings, adaptive width (64px / 232px / 256px)
//
// Used in: AppLayout.jsx
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import Avatar from '../common/Avatar';
import WorkspaceSwitcher from '../shell/WorkspaceSwitcher';
import { resolveMediaUrl } from '../../utils/media';
import { coreNavItems, utilityNavItems, analyticsNavItems, toolsNavItems } from '../../config/navItems';
import {
  LogOut,
  Rocket,
   ChevronRight,
  Clock,
  Star,
  PanelLeftClose,
   PanelLeftOpen,
} from 'lucide-react';

import { easeOutExpo } from '../../animations/variants';

// Widths (px) — single source of truth for the sidebar geometry
const WIDTH_COLLAPSED = 64;
const WIDTH_EXPANDED = 232;
const WIDTH_MOBILE = 280;

// localStorage key for recent routes (per workspace + session)
const RECENT_KEY = 'antigravity-recent-routes';
const FAVORITES_KEY = 'antigravity-favorite-routes';
const MAX_RECENT = 5;

function StarToggle({ filled, onToggle }) {
  return (
    <motion.button
      whileHover={{ scale: 1.2, rotate: 20 }}
      whileTap={{ scale: 0.85 }}
      onClick={onToggle}
      className={`
        absolute right-2 z-20 w-5 h-5 rounded-md
        flex items-center justify-center
        text-text-tertiary hover:text-accent-glow
        hover:bg-accent-primary/10
        transition-all duration-150 outline-none
        ${filled ? 'text-accent-glow/80 bg-accent-primary/10' : ''}
      `}
      aria-label={filled ? 'Unfavorite' : 'Favorite'}
      title={filled ? 'Unfavorite' : 'Add to favorites'}
    >
      <Star size={11} fill={filled ? 'currentColor' : 'none'} />
    </motion.button>
  );
}

function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const expanded = useSidebarStore((s) => s.expanded);
  const setExpanded = useSidebarStore((s) => s.setExpanded);
  const [recentRoutes, setRecentRoutes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const navRef = useRef(null);

  // ---- Load recently-opened + favorites from localStorage on mount ----
  useEffect(() => {
    try {
      setRecentRoutes(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
    } catch {
      setRecentRoutes([]);
      setFavorites([]);
    }
  }, []);

  // ---- Track navigated routes for Recently Opened ----
  const recordRoute = useCallback((path, label) => {
    const route = { path, label, ts: Date.now() };
    setRecentRoutes((prev) => {
      const next = [route, ...prev.filter((r) => r.path !== path)].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
     const current = [...coreNavItems, ...analyticsNavItems, ...toolsNavItems, ...utilityNavItems].find(
      (i) => i.path === window.location.pathname
    );
    if (current) recordRoute(current.path, current.label);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Keyboard navigation (desktop rail) ----
  useEffect(() => {
    if (!expanded) return; // only active in expanded desktop mode
    const handleKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Never hijack navigation keys while the user is typing or editing text.
      const target = e.target;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditable) return;
      const items = navRef.current?.querySelectorAll('a[data-nav-link]') || [];
      if (!items.length) return;
      let idx = Array.from(items).findIndex((a) => a.classList.contains('active'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        idx = (idx + 1) % items.length;
        items[idx]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        idx = (idx - 1 + items.length) % items.length;
        items[idx]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expanded]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    if (onClose) onClose();
  };

  const toggleFavorite = (path) => {
    setFavorites((prev) => {
      const next = prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path];
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleNavClick = (path, label) => {
    recordRoute(path, label);
    if (onClose) onClose();
  };

  const labelVisible = expanded;

  // Items gated by role (adminOnly) are hidden from non-admin users.
  const visibleItems = (items) => items.filter((item) => !item.adminOnly || user?.role === 'admin');

  // ---- Render helpers ----
  const renderNavGroup = (items, groupLabel, sub = false) => (
    <div className="mb-5">
      {groupLabel && (
        <span
          className={`
            block text-[10px] font-semibold uppercase tracking-wider mb-2
            transition-opacity duration-300
            ${labelVisible ? 'opacity-40' : 'opacity-0'}
            ${sub ? 'ml-8' : ''}
          `}
        >
          {groupLabel}
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isFav = favorites.includes(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              onClick={() => handleNavClick(item.path, item.label)}
              data-nav-link="true"
              className="relative block outline-none"
              title={!labelVisible ? item.label : undefined}
            >
              {({ isActive }) => (
                <motion.div
                  initial={{ opacity: 0, x: sub ? 0 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * idx, duration: 0.35, ease: easeOutExpo }}
                  className={`
                    relative flex items-center gap-3 rounded-xl text-sm font-medium
                    transition-[color,background] duration-200
                    group outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
                    ${sub ? 'ml-10' : ''}
                  `}
                >
                  {/* Animated active indicator — Linear style */}
                  {isActive && (
                    <>
                      <motion.span
                        layoutId="sidebar-active-beam"
                         className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-accent-glow to-accent-secondary-glow shell-active-beam"
                        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                      />
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-primary/18 to-accent-highlight/8 border border-accent-primary/30"
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    </>
                  )}

                  {/* Icon slot */}
                  <div
                    className={`
                      relative z-10 flex items-center justify-center shrink-0
                      transition-all duration-200
                      ${labelVisible ? 'w-5 h-5' : 'w-5 h-5'}
                      ${isActive ? 'text-accent-glow' : 'text-text-secondary group-hover:text-text-primary'}
                    `}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      relative z-10 overflow-hidden whitespace-nowrap
                      transition-opacity duration-300
                      ${labelVisible ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Hover sweep (only when not active and expanded) */}
                  {!isActive && labelVisible && (
                    <span className="absolute inset-0 rounded-xl bg-overlay/6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  )}

                  {/* Favorites star (expanded only) */}
                  {labelVisible && (
                    <StarToggle
                      filled={isFav}
                      onToggle={() => toggleFavorite(item.path)}
                    />
                  )}

                  {/* Collapse chevron for nested group items */}
                  {item.children && labelVisible && (
                    <ChevronRight
                      size={12}
                      className="relative z-10 ml-auto text-text-tertiary/50 group-hover:text-text-tertiary transition-colors"
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* ───── Desktop floating rail ───── */}
       <aside
          ref={navRef}
          className={`
            hidden lg:flex lg:flex-col
            fixed left-6 top-6 bottom-6 z-40
            gap-3
            rounded-2xl
             shell-sidebar
            transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
            overflow-hidden
            ${expanded ? 'w-[232px]' : 'w-[64px]'}
          `}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Collapse toggle — Arc Browser style (appears on the rail edge) */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-30">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setExpanded((e) => !e)}
            className={`
              p-1.5 rounded-lg
              bg-bg-elevated/80 hover:bg-bg-hover
              border border-overlay/10
              text-text-secondary hover:text-text-primary
               elevation-2
              transition-all duration-200 cursor-pointer outline-none
              ${expanded ? 'rotate-0' : 'rotate-180'}
            `}
            title={expanded ? 'Collapse rail' : 'Expand rail'}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </motion.button>
        </div>

        {/* Animated gradient top edge */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-50 transition-all duration-500"
          style={{ width: expanded ? '72%' : '36%' }}
        />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 pr-1">
          <div className="px-3">
            {/* Logo / Brand (only when expanded) */}
            {labelVisible && (
              <div className="flex items-center gap-2.5 mb-5">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                   className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow flex items-center justify-center glow-strong"
                >
                  <Rocket size={16} color="white" />
                </motion.div>
                <div className="overflow-hidden">
                  <h1 className="text-text-primary text-base font-display font-semibold leading-tight truncate">
                    Trimax-CRM
                  </h1>
                  <span className="text-[10px] text-text-tertiary tracking-widest uppercase font-medium">
                    Enterprise
                  </span>
                </div>
              </div>
            )}

            {/* Workspace Switcher */}
            <div className="mb-4">
              <WorkspaceSwitcher compact={!labelVisible} />
            </div>

            {/* Core nav group */}
            {renderNavGroup(visibleItems(coreNavItems), labelVisible ? 'Core Modules' : undefined)}

            {/* Analytics nav group */}
            {renderNavGroup(visibleItems(analyticsNavItems), labelVisible ? 'Analytics' : undefined)}

            {/* Tools nav group */}
            {renderNavGroup(visibleItems(toolsNavItems), labelVisible ? 'Tools' : undefined)}

            {/* Recently Opened (expanded only) */}
            {labelVisible && recentRoutes.length > 0 && (
              <div className="mb-5">
                <span className="block text-[10px] font-semibold uppercase tracking-wider mb-2 opacity-40">
                  Recently Opened
                </span>
                <div className="flex flex-col gap-0.5">
                  {recentRoutes.slice(0, 3).map((r) => {
                    if (![...coreNavItems, ...analyticsNavItems, ...toolsNavItems, ...utilityNavItems].find((i) => i.path === r.path)) return null;
                    return (
                      <NavLink
                        key={r.path}
                        to={r.path}
                        end
                        onClick={() => handleNavClick(r.path, r.label)}
                        data-nav-link="true"
               className="relative block outline-none shell-nav-item"
                      >
                        {({ isActive: a }) => (
                          <div
                            className={`
                              relative flex items-center gap-2.5 rounded-xl text-xs font-medium
                              transition-colors
                              ${
                                a
                                  ? 'text-accent-glow'
                                  : 'text-text-tertiary hover:text-text-secondary'
                              }
                            `}
                          >
                            <Clock size={12} className="opacity-50 shrink-0" />
                            <span className="truncate">{r.label}</span>
                            <span className="ml-auto text-[9px] opacity-40">
                              {new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Favorites (expanded only) */}
            {labelVisible && favorites.length > 0 && (
              <div className="mb-5">
                <span className="block text-[10px] font-semibold uppercase tracking-wider mb-2 opacity-40">
                  Favorites
                </span>
                <div className="flex flex-col gap-0.5">
                  {favorites.map((path) => {
                     const item = [...coreNavItems, ...analyticsNavItems, ...toolsNavItems, ...utilityNavItems].find((i) => i.path === path);
                    if (!item) return null;
                    return (
                      <NavLink
                        key={path}
                        to={path}
                        end={path === '/app'}
                        onClick={() => handleNavClick(path, item.label)}
                        data-nav-link="true"
                        className="relative block outline-none"
                      >
                        {() => (
                          <div className="relative flex items-center gap-2.5 rounded-xl text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors">
                            <Star size={12} fill="currentColor" className="text-accent-glow/80 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Utility nav group */}
            {renderNavGroup(utilityNavItems, labelVisible && !favorites.some((f) => utilityNavItems.some((i) => i.path === f)) ? 'Tools' : undefined)}
          </div>

          {/* User / Auth section */}
          <div className="border-t border-overlay/5 pt-3 pb-4 px-3">
            {user && (
              <div
                className={`
                  flex items-center gap-2.5 mb-3
                  transition-opacity duration-300
                  ${labelVisible ? 'opacity-100' : 'opacity-0'}
                `}
              >
                <div className="relative shrink-0">
                  <Avatar name={user.name} role={user.role} size={36} src={resolveMediaUrl(user.avatar_url)} showStatus isOnline />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success glow-subtle" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-text-primary text-xs font-semibold truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-[10px] text-text-tertiary truncate capitalize font-medium">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            {/* Sign Out */}
            <motion.button
              whileHover={{ x: labelVisible ? 3 : 0 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { handleLogout(); }}
              className={`
                flex items-center gap-2.5 rounded-xl
                text-sm font-medium
                text-text-secondary hover:text-danger
                hover:bg-danger/5
                transition-all duration-200
                outline-none focus-visible:ring-2 focus-visible:ring-danger
                w-full text-left
                ${labelVisible ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}
              `}
              title={!labelVisible ? 'Sign Out' : undefined}
              aria-label="Sign out"
            >
              <LogOut size={16} className="shrink-0" />
              <span
                className={`
                  overflow-hidden whitespace-nowrap transition-opacity duration-300
                  ${labelVisible ? 'opacity-100' : 'opacity-0'}
                `}
              >
                Sign Out
              </span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* ───── Mobile / Tablet off-canvas drawer ───── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className={`
             lg:hidden fixed left-0 top-0 bottom-0 z-50
             flex flex-col h-full w-[280px] max-w-[85vw]
                 shell-sidebar rounded-r-2xl
                overflow-hidden
              `}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {/* Mobile drawer content — full expanded (labelVisible always true) */}
              <div className="flex-1 overflow-y-auto py-5">
                <div className="px-4">
                  {/* Brand + Workspace */}
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-overlay/5">
                    <motion.div
                      whileHover={{ rotate: 15 }}
                       className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow flex items-center justify-center glow-strong"
                    >
                      <Rocket size={16} color="white" />
                    </motion.div>
                    <div>
                      <h1 className="text-text-primary text-base font-display font-semibold leading-tight">
                        Trimax-CRM
                      </h1>
                      <span className="text-[10px] text-text-tertiary tracking-widest uppercase font-medium">
                        Enterprise
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <WorkspaceSwitcher compact={false} />
                  </div>

                  {renderNavGroup(visibleItems(coreNavItems), 'Core Modules')}
                  {renderNavGroup(visibleItems(analyticsNavItems), 'Analytics')}
                  {renderNavGroup(visibleItems(toolsNavItems), 'Tools')}
                  {renderNavGroup(visibleItems(utilityNavItems), 'Tools')}
                </div>

                {/* Mobile user + sign out */}
                <div className="border-t border-overlay/5 pt-3 pb-5 px-4">
                  {user && (
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="relative shrink-0">
                        <Avatar name={user.name} role={user.role} size={36} src={resolveMediaUrl(user.avatar_url)} showStatus isOnline />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success glow-subtle" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-text-primary text-xs font-semibold truncate leading-tight">
                          {user.name}
                        </span>
                        <span className="block text-[10px] text-text-tertiary truncate capitalize font-medium">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { handleLogout(); }}
                    className="w-full flex items-center gap-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/5 transition-all duration-200 outline-none px-3 py-2.5"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Expose widths for the layout to compute content offset
Sidebar.WIDTH_COLLAPSED = WIDTH_COLLAPSED;
Sidebar.WIDTH_EXPANDED = WIDTH_EXPANDED;
Sidebar.WIDTH_MOBILE = WIDTH_MOBILE;

export default Sidebar;
