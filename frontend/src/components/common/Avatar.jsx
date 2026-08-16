// frontend/src/components/common/Avatar.jsx
// Futuristic profile avatar with role-colored gradient ring, glow halo, and online status dot.
// Used in: Topbar profile controls, Recent Deals lists, Chat feeds.

import React, { useMemo, memo } from 'react';

function Avatar({
  name = '',
  size = 36,
  role = 'agent',
  showStatus = false,
  isOnline = false,
  src = '',
  className = '',
}) {
  // Memoize initials so they aren't recomputed on every render.
  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts[1]?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }, [name]);

  const roleRing = {
    admin: 'ring-accent-primary/70 glow-control',
    team_lead: 'ring-accent-highlight/70 glow-control',
    agent: 'ring-overlay/20',
  };

  const roleBg = {
    admin: 'bg-gradient-to-br from-accent-primary to-accent-highlight',
    team_lead: 'bg-gradient-to-br from-accent-highlight to-accent-secondary-glow',
    agent: 'bg-bg-card',
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center select-none font-display font-bold text-sm text-text-primary ring-2 ${roleRing[role] || roleRing.agent} ${roleBg[role] || roleBg.agent} overflow-hidden ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <span>{initials}</span>
      )}

      {/* Online Status Bullet */}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-bg-base ring-1 ring-black/40 ${
            isOnline ? 'bg-success glow-subtle animate-pulse' : 'bg-text-secondary/40'
          }`}
          style={{ transform: 'translate(10%, 10%)' }}
        />
      )}
    </div>
  );
}

export default memo(Avatar);
