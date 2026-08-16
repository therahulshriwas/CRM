// frontend/src/store/dealsStore.js
// Zustand store for deals data — shared by the Deals/Pipeline page and the Dashboard compact pipeline widget.
// Handles fetching the deals list and optimistic stage updates against the API.
// Used in: pages/Deals.jsx, pages/Dashboard.jsx.

import { create } from 'zustand';
import api from '../api/axios';

export const useDealsStore = create((set, get) => ({
  deals: [],
  loading: false,
  error: null,

  // Fetches the role-filtered deal list from the API.
  fetchDeals: async (force = false) => {
    if (get().deals.length > 0 && !force) return;
    set({ loading: true, error: null });
    try {
      const response = await api.get('/deals');
      set({ deals: response.data.deals, loading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load deals.';
      set({ error: message, loading: false });
    }
  },

  // Optimistically moves a deal to a new stage; rolls back on failure.
  updateStage: async (dealId, stage) => {
    const previousDeals = get().deals;
    set({
      deals: previousDeals.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal)),
    });
    try {
      const response = await api.put(`/deals/${dealId}/stage`, { stage });
      set({
        deals: get().deals.map((deal) => (deal.id === dealId ? response.data.deal : deal)),
      });
      return { success: true };
    } catch (error) {
      set({ deals: previousDeals });
      const message = error.response?.data?.message || 'Failed to update deal stage.';
      return { success: false, message };
    }
  },

  // Creates a new deal under an existing lead and refreshes the list.
  createDeal: async (data) => {
    try {
      await api.post('/deals', data);
      await get().fetchDeals(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create deal.' };
    }
  },

  reset: () => set({ deals: [], error: null }),
}));
