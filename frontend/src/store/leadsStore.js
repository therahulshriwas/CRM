// frontend/src/store/leadsStore.js
// Zustand store for leads — powers the Leads list page and Lead Detail page with shared filters,
// search, pagination and CRUD actions against the API.
// Used in: pages/Leads.jsx, pages/LeadDetail.jsx.

import { create } from 'zustand';
import api from '../api/axios';

export const useLeadsStore = create((set, get) => ({
  leads: [],
  pagination: { totalItems: 0, totalPages: 0, currentPage: 1, limit: 10 },
  filters: { status: '', source: '', owner_id: '', search: '' },
  loading: false,
  error: null,

  // Builds the query string from current filters + explicit overrides.
  buildQuery: (overrides = {}) => {
    const params = new URLSearchParams();
    const merged = { ...get().filters, ...overrides };
    if (merged.status) params.set('status', merged.status);
    if (merged.source) params.set('source', merged.source);
    if (merged.owner_id) params.set('owner_id', merged.owner_id);
    if (merged.search) params.set('search', merged.search);
    params.set('page', merged.page || 1);
    params.set('limit', merged.limit || get().pagination.limit);
    return params.toString();
  },

  // Fetches leads with the current filters + pagination.
  fetchLeads: async (overrides = {}) => {
    set({ loading: true, error: null });
    try {
      const query = get().buildQuery(overrides);
      const response = await api.get(`/leads?${query}`);
      const { leads, pagination } = response.data;
      set({ leads, pagination, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load leads.', loading: false });
    }
  },

  // Applies a single filter change and refetches from page 1.
  setFilter: (key, value) => {
    const filters = { ...get().filters, [key]: value };
    set({ filters });
    get().fetchLeads({ page: 1 });
  },

  setSearch: (search) => {
    set({ filters: { ...get().filters, search } });
    get().fetchLeads({ page: 1 });
  },

  setPage: (page) => get().fetchLeads({ page }),

  // Creates a new lead and refreshes the list.
  createLead: async (data) => {
    try {
      await api.post('/leads', data);
      await get().fetchLeads({ page: get().pagination.currentPage });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create lead.' };
    }
  },

  // Updates a lead and refreshes the list.
  updateLead: async (id, data) => {
    try {
      await api.put(`/leads/${id}`, data);
      await get().fetchLeads({ page: get().pagination.currentPage });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update lead.' };
    }
  },

  // Deletes a lead and refreshes the list.
  deleteLead: async (id) => {
    try {
      await api.delete(`/leads/${id}`);
      await get().fetchLeads({ page: get().pagination.currentPage });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete lead.' };
    }
  },

  // Fetches a single lead with its owner (used by the detail page).
  fetchLeadById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data.lead;
  },
}));
