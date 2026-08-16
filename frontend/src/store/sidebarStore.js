// frontend/src/store/sidebarStore.js
// Shared desktop-rail state between the Sidebar (which owns the collapse toggle
// and hover-expand) and the AppLayout (which must offset the content column to
// match the rail width). Mobile drawer visibility stays local to AppLayout.
// Used in: Sidebar.jsx, AppLayout.jsx.

import { create } from 'zustand';

export const useSidebarStore = create((set) => ({
  expanded: true,
  setExpanded: (expanded) => set({ expanded }),
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
}));
