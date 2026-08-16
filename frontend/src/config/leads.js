// frontend/src/config/leads.js
// Single source of truth for lead option lists used across the Leads module forms and filters.
// Used in: LeadModal, Leads page filters.

export const leadSources = ['Website', 'Referral', 'Cold Call', 'LinkedIn'];

export const leadStatuses = ['New', 'Contacted', 'Qualified', 'Lost'];

// Badge variant per lead status (maps to Badge component variants).
export const leadStatusBadge = {
  New: 'info',
  Contacted: 'warning',
  Qualified: 'primary',
  Lost: 'danger',
};
