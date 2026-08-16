// frontend/src/config/dealStages.js
// Single source of truth for deal pipeline stages and their status color mapping.
// Used in: Deals Kanban columns, Recent Deals table chips, and the dashboard pipeline widget.

// Ordered pipeline stages (drag targets flow left -> right).
export const dealStages = ['Qualified', 'Proposal', 'Negotiation', 'Won'];

// Status chip/column color mapping — each stage maps to a Tailwind color token.
export const stageColors = {
  Qualified: 'info', // blue
  Proposal: 'accent-highlight', // purple
  Negotiation: 'warning', // amber
  Won: 'success', // green
  Lost: 'danger', // red
};

// Badge variant for each stage (maps to Badge component variants).
export const stageBadgeVariants = {
  Qualified: 'info',
  Proposal: 'primary',
  Negotiation: 'warning',
  Won: 'success',
  Lost: 'danger',
};
