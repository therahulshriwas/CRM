// frontend/src/components/layout/Topbar.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 Shell — Enterprise Topbar
// -----------------------------------------------------------------------------
// Horizontal workspace bar spanning the content area. Contains:
//   Left:    page title (animated) · workspace indicator (switcher popout)
//   Center:  (empty — reserved for future breadcrumbs / tabs)
//   Right:   global search launcher (Cmd+K) · quick-create · notifications
//            · live sync indicator · AI-assistant launch · theme toggle · user
//
// Used in: AppLayout.jsx
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAiStore } from '../../store/aiStore';
import { useThemeStore } from '../../store/themeStore';
import Avatar from '../common/Avatar';
import WorkspaceSwitcher from '../shell/WorkspaceSwitcher';
import Dropdown from '../ui/Dropdown';
import api from '../../api/axios';
import { formatRelativeTime } from '../../utils/format';
import { resolveMediaUrl } from '../../utils/media';
import {
  Search,
  Bell,
  Plus,
  CheckCheck,
  Inbox,
  Menu,
  Sun,
  Moon,
  Sparkles,
  Wifi,
  WifiOff,
  FileText,
  Users2,
  Users,
  User,
  GitBranch,
} from 'lucide-react';

const QUICK_CREATE_ITEMS = [
  { label: 'New Lead', icon: Users2, action: '/app/leads' },
  { label: 'New Deal', icon: GitBranch, action: '/app/deals' },
  { label: 'New Invoice', icon: FileText, action: '/app/invoices' },
];

function Topbar({ pageTitle = 'Dashboard', onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, socketInstance: socket, socketConnected } = useAuthStore();
  const aiOpen = useAiStore((s) => s.isOpen);
  const toggleAi = useAiStore((s) => s.togglePanel);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const isDark = themeMode === 'dark';

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    init: initNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ leads: [], deals: [], customers: [] });
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const notifRef = useRef(null);
  const quickCreateRef = useRef(null);

  // ---- Debounced live search for the Cmd+K palette ----
  useEffect(() => {
    if (!isSearchOpen) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults({ leads: [], deals: [], customers: [] });
      setSearching(false);
      setActiveIndex(0);
      return;
    }
    setSearching(true);
    setActiveIndex(0);
    const timer = setTimeout(async () => {
      try {
        const [leadsRes, dealsRes, customersRes] = await Promise.allSettled([
          api.get(`/leads?search=${encodeURIComponent(q)}&limit=5`),
          api.get(`/deals?search=${encodeURIComponent(q)}&limit=5`),
          api.get(`/customers?search=${encodeURIComponent(q)}&limit=5`),
        ]);
        setSearchResults({
          leads: leadsRes.status === 'fulfilled' ? (leadsRes.value.data.leads || []) : [],
          deals: dealsRes.status === 'fulfilled' ? (dealsRes.value.data.deals || []) : [],
          customers: customersRes.status === 'fulfilled' ? (customersRes.value.data.customers || []) : [],
        });
      } catch {
        setSearchResults({ leads: [], deals: [], customers: [] });
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen]);

  // ---- Cmd/Ctrl+K command palette ----
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- Click-outside for dropdowns ----
  useEffect(() => {
    const onDown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target)) setIsQuickCreateOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // ---- Live notifications ----
  useEffect(() => {
    initNotifications(socket);
  }, [initNotifications, socket]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleQuickCreate = (item) => {
    setIsQuickCreateOpen(false);
    navigate(item.action);
  };

  const handleNotifClick = (id) => {
    markRead(id);
  };

  const toggleSearch = () => {
    if (isSearchOpen) { setSearchQuery(''); }
    setActiveIndex(0);
    setIsSearchOpen((o) => !o);
  };

  // Flat list of palette entries: quick actions always present, then live results.
  const paletteItems = [
    ...QUICK_CREATE_ITEMS.map((q) => ({ kind: 'action', label: q.label, icon: q.icon, path: q.action })),
    ...searchResults.leads.map((l) => ({ kind: 'lead', label: l.name, icon: Users2, path: `/app/leads/${l.id}` })),
    ...searchResults.deals.map((d) => ({ kind: 'deal', label: d.title, icon: GitBranch, path: '/app/deals' })),
    ...searchResults.customers.map((c) => ({ kind: 'customer', label: c.name, icon: Users, path: '/app/customers' })),
  ];

  const runPaletteItem = (item) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(item.path);
  };

  const handlePaletteKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(paletteItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + paletteItems.length) % Math.max(paletteItems.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (paletteItems[activeIndex]) runPaletteItem(paletteItems[activeIndex]);
    }
  };

  return (
    <>
      <header
        className={`
          relative h-[56px] w-full
          flex items-center justify-between
           shell-topbar rounded-2xl mt-3 mx-3 mb-0
          backdrop-blur-xl
          select-none
        `}
      >
        {/* Subtle bottom border / gradient edge */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent pointer-events-none" />

        {/* ── LEFT: title + workspace ── */}
        <div className="flex items-center gap-4 pl-3">
          {/* Mobile menu toggle */}
          {onToggleSidebar && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer outline-none border border-transparent"
              title="Toggle menu"
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} />
            </motion.button>
          )}

          {/* Animated page title */}
          <motion.h2
            key={pageTitle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-text-primary font-display font-semibold text-base"
          >
            {pageTitle}
          </motion.h2>

          <div className="h-4 w-px bg-overlay/10" />

          {/* Workspace indicator — compact badge + name (desktop) */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-bg-hover transition-colors select-none">
            <WorkspaceSwitcher compact={true} />
          </div>
        </div>

        {/* ── CENTER: (reserved) ── */}
        <div className="flex-1" />

        {/* ── RIGHT: actions ── */}
        <div className="flex items-center gap-1.5 pr-3">
          {/* Global Search (Cmd+K) */}
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleSearch}
            className={`
               shell-search hidden sm:flex items-center gap-2
              text-text-secondary hover:text-text-primary
              text-xs px-3 py-2 rounded-xl
              border border-overlay/5
              transition-all duration-200 cursor-pointer outline-none
              w-[180px] justify-between group
            `}
            aria-label="Global search (Cmd+K)"
            title="Search — Cmd+K"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Search size={13} className="group-hover:text-accent-glow transition-colors shrink-0" />
              <span className="truncate">Search command…</span>
            </div>
            <kbd className="bg-overlay/10 px-1 py-0.5 rounded text-[9px] font-mono select-none border border-overlay/10">
              ⌘K
            </kbd>
          </motion.button>

          {/* Quick Create */}
          <div className="relative" ref={quickCreateRef}>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setIsQuickCreateOpen((o) => !o)}
              className={`
                p-2 rounded-xl hover:bg-bg-hover text-text-secondary hover:text-text-primary
                transition-all duration-200 cursor-pointer outline-none
                border border-transparent
                ${isQuickCreateOpen ? 'bg-bg-hover text-text-primary' : ''}
              `}
              aria-haspopup="true"
              aria-expanded={isQuickCreateOpen}
              title="Quick create"
            >
              <Plus size={16} />
            </motion.button>

            <AnimatePresence>
              {isQuickCreateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="absolute z-40 mt-2 right-0 w-[176px] origin-top"
                >
                   <div className="shell-popover rounded-2xl overflow-hidden">
                    {QUICK_CREATE_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.label}
                           whileHover={{ backgroundColor: 'rgb(var(--c-accent-primary) / 0.06)' }}
                          onClick={() => handleQuickCreate(item)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors outline-none"
                        >
                          <Icon size={12} className="text-text-tertiary shrink-0" />
                          <span>{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((o) => !o)}
              className={`
                relative p-2 rounded-xl hover:bg-bg-hover text-text-secondary hover:text-text-primary
                transition-all duration-200 cursor-pointer outline-none border border-transparent
              `}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={16} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 rounded-full bg-accent-highlight/90 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-bg-default"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="absolute z-40 mt-2 right-0 w-[340px] origin-top"
                >
                   <div className="shell-popover rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-overlay/5">
                      <span className="text-text-primary text-sm font-display font-semibold">Notifications</span>
                      {unreadCount > 0 && (
                        <motion.button
                          whileHover={{ x: 2 }}
                          onClick={() => markAllRead()}
                          className="text-[11px] text-accent-glow hover:text-accent-secondary-glow font-semibold transition-colors cursor-pointer outline-none"
                        >
                          Mark all read
                        </motion.button>
                      )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 px-4">
                          <Inbox size={20} className="text-text-secondary/40" />
                          <span className="text-xs text-text-secondary">No notifications yet</span>
                        </div>
                      ) : (
                        notifications.slice(0, 12).map((n) => (
                          <motion.button
                            key={n.id}
                             whileHover={{ backgroundColor: 'rgb(var(--c-accent-primary) / 0.04)' }}
                            onClick={() => handleNotifClick(n.id)}
                            className={`
                              w-full flex items-start gap-3 px-4 py-3 text-left
                              transition-colors cursor-pointer outline-none
                              border-l-2
                              ${n.read ? 'border-transparent' : 'border-accent-primary bg-accent-primary/4'}
                            `}
                          >
                            <span
                              className={`
                                mt-1.5 w-2 h-2 rounded-full shrink-0
                                 ${n.read ? 'bg-overlay/15' : 'bg-accent-glow glow-subtle'}
                              `}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-text-primary">{n.title}</span>
                                <span className="text-[9px] text-text-tertiary/50 shrink-0">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                              <span className="block text-[11px] text-text-secondary mt-0.5 leading-relaxed truncate">
                                {n.message}
                              </span>
                            </div>
                            {!n.read && <CheckCheck size={13} className="text-text-secondary/40 mt-1 shrink-0" />}
                          </motion.button>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Sync Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-overlay/5 bg-bg-secondary/30"
            title={socketConnected ? 'Live — real-time connection active' : 'Offline — checking connection'}
            aria-label={socketConnected ? 'Real-time connection active' : 'Offline'}
          >
            <motion.div
              animate={{ opacity: socketConnected ? [0.4, 1, 0.4] : 0.4 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative flex items-center justify-center"
            >
              {socketConnected ? (
                <Wifi size={12} className="text-success" />
              ) : (
                <WifiOff size={12} className="text-text-tertiary" />
              )}
            </motion.div>
            <span
              className={`
                text-[10px] font-semibold uppercase tracking-wider
                ${socketConnected ? 'text-success' : 'text-text-tertiary'}
              `}
            >
              {socketConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* AI Assistant launch */}
          <motion.button
            whileHover={{ y: -1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAi}
            className={`
              p-2 rounded-xl hover:bg-bg-hover
              transition-all duration-200 cursor-pointer outline-none
              border border-transparent
              ${aiOpen ? 'bg-bg-hover text-accent-glow' : 'text-text-secondary hover:text-text-primary'}
            `}
            aria-label="AI assistant"
            title="AI assistant (Esc to close)"
          >
            <Sparkles size={16} />
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer outline-none border border-transparent"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <AnimatePresence initial={false}>
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Sun size={16} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 30, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -30, opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Moon size={16} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

    {/* Divider */}
          <div className="h-6 w-px bg-overlay/10" />

          {/* User profile trigger + account popover */}
          {user && (
            <Dropdown
              placement="bottom-end"
              contentClass="w-[252px]"
              triggerClass="group rounded-xl p-1.5 -m-1.5 transition-colors duration-200 hover:bg-bg-hover outline-none focus-visible:ring-2 focus-visible:ring-accent-primary cursor-pointer"
              trigger={
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={user.name} role={user.role} size={32} src={resolveMediaUrl(user.avatar_url)} />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success glow-subtle" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-text-primary text-xs font-semibold truncate max-w-[120px]">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-0.5 bg-overlay/5 text-text-tertiary">
                      {user.role?.replace('_', ' ') || 'Member'}
                    </span>
                  </div>
                </div>
              }
            >
              <div role="presentation" className="px-4 pt-4 pb-3 flex flex-col items-center gap-1 text-center">
                <Avatar
                  name={user.name}
                  role={user.role}
                  size={56}
                  src={resolveMediaUrl(user.avatar_url)}
                  showStatus
                  isOnline
                  className="mb-1"
                />
                <span className="text-text-primary text-sm font-display font-semibold leading-tight break-words w-full">
                  {user.name || 'User'}
                </span>
                <span className="text-[11px] text-text-tertiary break-words w-full leading-snug">
                  {user.email || 'No email on file'}
                </span>
                <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-glow">
                  {user.role?.replace('_', ' ') || 'Member'}
                </span>
              </div>

              <Dropdown.Separator />

              <Dropdown.Item icon={User} onSelect={() => navigate('/app/profile')}>
                View Profile
              </Dropdown.Item>
            </Dropdown>
          )}
        </div>
      </header>

      {/* ── Modal: Global Search (Cmd+K) ── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              className="w-[90%] max-w-lg"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
               <div className="shell-popover rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 p-3.5 border-b border-overlay/5">
                  <Search size={16} className="text-text-tertiary shrink-0" />
                  <input
                    type="text"
                    placeholder="Search leads, deals, customers… (Esc to close)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm bg-transparent text-text-primary outline-none placeholder:text-text-tertiary/50"
                    autoFocus
                    onKeyDown={handlePaletteKeyDown}
                  />
                  <kbd className="bg-overlay/10 px-1.5 py-0.5 rounded text-[10px] font-mono select-none border border-overlay/10">
                    ESC
                  </kbd>
                </div>
                <div className="p-3 flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
                  {searching && (
                    <span className="text-[10px] text-text-tertiary/40 font-bold uppercase tracking-wider px-1">
                      Searching…
                    </span>
                  )}
                  {paletteItems.map((item, idx) => (
                    <motion.button
                      key={`${item.kind}-${item.label}-${idx}`}
                      whileHover={{ x: 3 }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => runPaletteItem(item)}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors outline-none
                        ${idx === activeIndex ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}
                      `}
                    >
                      <item.icon size={12} className="text-text-tertiary/40" />
                      <span>{item.label}</span>
                    </motion.button>
                  ))}
                  {!searching && searchQuery.trim().length >= 2 && paletteItems.length === QUICK_CREATE_ITEMS.length && (
                    <span className="text-[10px] text-text-tertiary/40 font-bold uppercase tracking-wider px-1">
                      No results for “{searchQuery.trim()}”
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Topbar;
