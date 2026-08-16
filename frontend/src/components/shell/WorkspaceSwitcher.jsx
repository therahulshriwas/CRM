// frontend/src/components/shell/WorkspaceSwitcher.jsx
// Linear-style workspace dropdown: shows the active workspace avatar+name, and
// a popover list of available workspaces with member counts. Clicking switches
// the active workspace via the store (persisted).
// Used in: Sidebar (top section) and Topbar (desktop indicator).

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Users } from 'lucide-react';
import { useWorkspaceStore, getActiveWorkspace } from '../../store/workspaceStore';

function WorkspaceAvatar({ ws, size = 28, showRing = false }) {
  if (ws.avatar) {
    return (
      <img
        src={ws.avatar}
        alt={ws.name}
        className={`rounded-lg object-cover ${showRing ? 'ring-2 ring-bg-elevated' : ''}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-lg flex items-center justify-center font-display font-bold text-xs text-text-inverse ${
        showRing ? 'ring-2 ring-bg-elevated' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, var(--c-accent-primary), var(--c-accent-secondary-glow))`,
      }}
    >
      {ws.symbol}
    </div>
  );
}

function WorkspaceSwitcher({ compact = false }) {
  const [open, setOpen] = useState(false);
  const { activeWorkspaceId, setActiveWorkspace, workspaces } = useWorkspaceStore();
  const active = getActiveWorkspace();
  const buttonRef = useRef(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block w-full" ref={buttonRef}>
      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-between gap-2 rounded-xl
          text-text-secondary hover:text-text-primary
          bg-bg-secondary/60 hover:bg-bg-hover
          border border-overlay/5
          transition-all duration-200 cursor-pointer outline-none
          ${compact ? 'w-full px-2.5 py-2 text-xs' : 'px-3 py-2 text-sm font-medium'}
        `}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <WorkspaceAvatar ws={active} size={compact ? 20 : 24} />
          {!compact && <span className="truncate">{active.name}</span>}
        </span>
        <ChevronDown
          size={compact ? 12 : 14}
          className={`text-text-secondary/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="absolute z-50 mt-2 w-full min-w-[200px] origin-top"
          >
            <div className="backdrop-blur-xl bg-bg-elevated/85 border border-overlay/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <motion.button
                    key={ws.id}
                    whileHover={{ backgroundColor: 'rgba(124,58,237,0.06)' }}
                    onClick={() => {
                      setActiveWorkspace(ws.id);
                      setOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                      transition-colors duration-150 outline-none border-b border-overlay/3
                      ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}
                    `}
                  >
                    <WorkspaceAvatar ws={ws} size={22} />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold truncate">{ws.name}</span>
                      <span className="text-[10px] text-text-tertiary flex items-center gap-1 truncate">
                        <Users size={10} />
                        {ws.members} members
                      </span>
                    </div>
                    {isActive && <Check size={13} className="text-accent-glow ml-auto" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorkspaceSwitcher;
