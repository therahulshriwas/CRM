// frontend/src/store/dashboardStore.js
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Zustand store that fetches + caches ALL data the Dashboard needs in one
// aggregated call (reusing the backend /dashboard/stats endpoint), plus the
// calendar events for "Upcoming Meetings". Supports:
//   • fetchDashboardStats — single call pulls KPIs, charts, recentDeals,
//     recentActivities, pipeline, + upcoming meetings (next 7 days from calendar).
//   • liveRefresh — called by the dashboard:update socket event to swap data.
//   • error / loading / lastUpdated tracking.
// Used in: pages/Dashboard.jsx (and any future executive widgets).
// =============================================================================

import { create } from 'zustand';
import api from '../api/axios';

export const useDashboardStore = create((set, get) => ({
  stats: null,
  heatmap: [],       // 7×24 day/hour activity grid
  upcomingEvents: [],   // next 7-day calendar events (meetings/milestones)
  loading: true,
  error: null,
  lastUpdated: null,

  fetchDashboardStats: async (force = false) => {
    if (get().stats && !force) return;
    set({ loading: true, error: null });
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/calendar/events').catch(() => ({ data: { events: [] } })),
      ]);
      const stats = statsRes.data;
      const allEvents = eventsRes.data?.events || [];
      const now = new Date();
      const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = allEvents
        .filter((e) => {
          const d = new Date(e.date);
          return d >= now && d <= in7;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      // Also fetch the reports heatmap in parallel for the activity widget.
      const heatmapRes = await api.get('/reports').catch(() => ({ data: { heatmap: [] } }));
      set({
        stats,
        heatmap: heatmapRes.data?.heatmap || [],
        upcomingEvents: upcoming,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load dashboard data.',
        loading: false,
      });
    }
  },

  // Replace stats from a live socket push (no refetch of events).
  liveRefresh: (freshStats) =>
    set((_s) => ({
      stats: freshStats,
      lastUpdated: new Date().toISOString(),
    })),

  fetchHeatmap: async () => {
    try {
      const res = await api.get('/reports');
      set({ heatmap: res.data?.heatmap || [] });
    } catch {
      set({ heatmap: [] });
    }
  },

  refetch: () => get().fetchDashboardStats(true),
  reset: () => set({ stats: null, upcomingEvents: [], loading: true, error: null }),
}));
