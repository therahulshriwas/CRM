// frontend/src/store/workspaceStore.js
// Zustand store for the active workspace + available workspaces (Linear/Attio-style).
// Persists the last-selected workspace to localStorage so the shell remembers it.
// Used in: components/layout/Sidebar (workspace switcher top section),
//           components/layout/Topbar (workspace indicator),
//           components/shell/WorkspaceSwitcher.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Canonical workspace list. In a real deployment this would be fetched from the
// backend /org endpoint; for now we seed a small multi-workspace set so the
// switcher has real, navigable destinations.
export const WORKSPACES = [
  {
    id: 'primary',
    name: 'Primary Workspace',
    slug: 'primary',
    symbol: 'A', // rendered as a colored dot+initial in the UI
    members: 5,
    avatar: null, // if set, an image URL
  },
  {
    id: 'sales',
    name: 'Sales Pipeline',
    slug: 'sales',
    symbol: 'S',
    members: 3,
    avatar: null,
  },
  {
    id: 'support',
    name: 'Customer Support',
    slug: 'support',
    symbol: 'C',
    members: 8,
    avatar: null,
  },
];

export const useWorkspaceStore = create(
  persist(
    (set) => ({
      workspaces: WORKSPACES,
      activeWorkspaceId: 'primary',
      showWorkspaceSwitcher: true,

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      // Convenience — add a workspace (stubbed for extensibility)
      addWorkspace: (ws) =>
        set((s) => ({ workspaces: [...s.workspaces, ws] })),
    }),
    {
      name: 'antigravity-workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeWorkspaceId: s.activeWorkspaceId }),
    }
  )
);

export const getActiveWorkspace = () =>
  WORKSPACES.find((w) => w.id === useWorkspaceStore.getState().activeWorkspaceId) ||
  WORKSPACES[0];
