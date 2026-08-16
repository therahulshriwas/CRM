// frontend/src/pages/Leads.jsx
// Leads list page — searchable, filterable (status/source/owner), paginated table with
// create/edit/delete via the shared LeadModal. Owner column is only shown to admin/team_lead.
// Used in: App.jsx /leads route.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Users2, UserPlus, Activity, Target } from 'lucide-react';
import { useLeadsStore } from '../store/leadsStore';
import { useAuthStore } from '../store/authStore';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import StatusState from '../components/ui/StatusState';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import LeadModal from '../components/leads/LeadModal';
import { leadSources, leadStatuses, leadStatusBadge } from '../config/leads';
import { formatDate } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { containerVariants, itemVariants } from '../animations/variants';

function Leads() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    leads,
    pagination,
    filters,
    loading,
    error,
    fetchLeads,
    setFilter,
    setSearch,
    setPage,
    createLead,
    updateLead,
    deleteLead,
  } = useLeadsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [submitting, setSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) setSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, setSearch]);

  // Owner options derived from loaded leads (data-driven, no extra users endpoint needed)
  const ownerOptions = useMemo(() => {
    const map = new Map();
    leads.forEach((lead) => {
      if (lead.owner) map.set(lead.owner.id, lead.owner);
    });
    return Array.from(map.values());
  }, [leads]);

  const canAssign = user?.role !== 'agent';

  const openCreate = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    const result = editingLead
      ? await updateLead(editingLead.id, payload)
      : await createLead(payload);
    setSubmitting(false);
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    await deleteLead(deleteTarget.id);
    setSubmitting(false);
    setDeleteTarget(null);
  };

  const totalPages = pagination.totalPages;

  // Futuristic summary cards
  const totalLeads = pagination.totalItems;
  const openLeads = leads.filter((l) => !['converted', 'closed'].includes(l.status)).length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const avgScore = leads.length ? Math.round(leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length) : 0;

  const summaryCards = [
    { label: 'Total Leads', value: totalLeads, icon: Users2, color: '#8B5CF6' },
    { label: 'Open Pipeline', value: openLeads, icon: Activity, color: '#3B82F6' },
    { label: 'Converted', value: convertedLeads, icon: Target, color: '#10B981' },
    { label: 'Avg Score', value: avgScore, icon: UserPlus, color: '#F59E0B' },
  ];

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="flex flex-col gap-6">
      <PageHeader
        title="Leads"
        icon={Users2}
        subtitle={`${totalLeads} total leads across your team's sales funnel.`}
        badge="Live"
        accent="#8B5CF6"
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            New Lead
          </Button>
        }
      />

      {/* Summary stat strip */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <motion.div
            key={c.label}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="hover-lift relative rounded-2xl glass-deep p-4 flex items-center gap-3.5 overflow-hidden"
          >
            <c.icon size={18} style={{ color: c.color }} />
            <div>
              <span className="block text-lg font-display font-bold text-text-primary">{c.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-text-secondary/60 font-semibold">{c.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Toolbar: search + filters */}
      <Panel title="Lead Database" subtitle="Search, filter and manage" icon={Users2} accent="#8B5CF6">
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-overlay/5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
               aria-label="Search leads by name or email"
               className="w-full pl-9 pr-3 py-2.5 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary shadow-focus transition-all"
            />
          </div>

          <select
             aria-label="Filter leads by status"
             value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="px-3 py-2.5 rounded-xl glass text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            {leadStatuses.map((s) => (
              <option key={s} value={s} className="bg-bg-surface">{s}</option>
            ))}
          </select>

          <select
             aria-label="Filter leads by source"
             value={filters.source}
            onChange={(e) => setFilter('source', e.target.value)}
            className="px-3 py-2.5 rounded-xl glass text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
          >
            <option value="">All Sources</option>
            {leadSources.map((s) => (
              <option key={s} value={s} className="bg-bg-surface">{s}</option>
            ))}
          </select>

          {canAssign && (
            <select
               aria-label="Filter leads by owner"
               value={filters.owner_id}
              onChange={(e) => setFilter('owner_id', e.target.value)}
              className="px-3 py-2.5 rounded-xl glass text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
            >
              <option value="">All Owners</option>
              {ownerOptions.map((o) => (
                <option key={o.id} value={o.id} className="bg-bg-surface">{o.name}</option>
              ))}
            </select>
          )}
        </div>

      {/* Leads table */}
      <div>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl shimmer" />
            ))}
          </div>
        ) : error ? (
           <div><StatusState type="error" message={error} onRetry={fetchLeads} /></div>
        ) : leads.length === 0 ? (
          <div>
            <EmptyState
              title="No leads found"
              description="Try adjusting your filters, or create a new lead to get started."
              action={
                <Button variant="primary" onClick={openCreate}>
                  <Plus size={16} />
                  New Lead
                </Button>
              }
            />
          </div>
        ) : (
           <motion.div
             className="overflow-x-auto"
             variants={containerVariants}
             initial="initial"
             animate="animate"
           >
              <table className="w-full text-left border-collapse min-w-[720px]">
                <caption className="sr-only">Lead database with contact, source, status, owner, and actions</caption>
               <thead>
                 <tr className="border-b border-overlay/5 bg-bg-secondary/40">
                   {['Lead', 'Contact', 'Source', 'Status', 'Owner', 'Created', ''].map((col) => (
                     <th key={col} className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary/50 whitespace-nowrap">
                       {col}
                     </th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {leads.map((lead) => (
                   <motion.tr
                     key={lead.id}
                     variants={itemVariants}
                     onClick={() => navigate(`/app/leads/${lead.id}`)}
                     tabIndex={0}
                     onKeyDown={(event) => {
                       if (event.key === 'Enter' || event.key === ' ') {
                         event.preventDefault();
                         navigate(`/app/leads/${lead.id}`);
                       }
                     }}
                     className="border-b border-overlay/5 last:border-0 hover:bg-overlay/2 focus-within:bg-overlay/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary transition-colors cursor-pointer"
                   >
                     <td className="py-3 px-4">
                       <span className="text-sm font-semibold text-text-primary">{lead.name}</span>
                     </td>
                     <td className="py-3 px-4">
                       <div className="flex flex-col">
                         <span className="text-xs text-text-secondary">{lead.email || '—'}</span>
                         <span className="text-[10px] text-text-secondary/50">{lead.phone || ''}</span>
                       </div>
                     </td>
                     <td className="py-3 px-4 text-xs text-text-secondary">{lead.source}</td>
                     <td className="py-3 px-4">
                       <Badge label={lead.status} variant={leadStatusBadge[lead.status] || 'secondary'} />
                     </td>
                     <td className="py-3 px-4">
                       <div className="flex items-center gap-2">
                          <Avatar name={lead.owner?.name || 'U'} role={lead.owner?.role || 'agent'} size={24} src={resolveMediaUrl(lead.owner?.avatar_url)} />
                         <span className="text-xs text-text-secondary">{lead.owner?.name || '—'}</span>
                       </div>
                     </td>
                     <td className="py-3 px-4 text-xs text-text-secondary/70">{formatDate(lead.created_at)}</td>
                     <td className="py-3 px-4">
                       <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button aria-label={`View ${lead.name}`} onClick={() => navigate(`/app/leads/${lead.id}`)} className="p-2 rounded-lg text-text-secondary hover:text-accent-glow hover:bg-overlay/5 transition-colors" title="View">
                           <Eye size={15} />
                         </button>
                          <button aria-label={`Edit ${lead.name}`} onClick={() => openEdit(lead)} className="p-2 rounded-lg text-text-secondary hover:text-warning hover:bg-overlay/5 transition-colors" title="Edit">
                           <Pencil size={15} />
                         </button>
                          <button aria-label={`Delete ${lead.name}`} onClick={() => setDeleteTarget(lead)} className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-overlay/5 transition-colors" title="Delete">
                           <Trash2 size={15} />
                         </button>
                       </div>
                     </td>
                   </motion.tr>
                 ))}
               </tbody>
             </table>
           </motion.div>
        )}

        {/* Pagination footer */}
        {!loading && !error && leads.length > 0 && (
          <div className="flex items-center justify-between py-3 border-t border-overlay/5">
            <span className="text-xs text-text-secondary/60">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1}–
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of {pagination.totalItems}
            </span>
            <div className="flex items-center gap-2">
              <button
                 aria-label="Previous leads page"
                 disabled={pagination.currentPage <= 1}
                onClick={() => setPage(pagination.currentPage - 1)}
                className="p-2 rounded-lg text-text-secondary hover:bg-overlay/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-text-secondary">
                Page {pagination.currentPage} of {Math.max(totalPages, 1)}
              </span>
              <button
                 aria-label="Next leads page"
                 disabled={pagination.currentPage >= totalPages}
                onClick={() => setPage(pagination.currentPage + 1)}
                className="p-2 rounded-lg text-text-secondary hover:bg-overlay/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
      </Panel>

      {/* Create / Edit modal */}
      <LeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingLead}
        users={ownerOptions}
        currentUser={user}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Lead" maxWidth="max-w-sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Are you sure you want to delete <span className="text-text-primary font-semibold">{deleteTarget?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleDelete} disabled={submitting} className="!bg-danger !from-danger !to-danger/80">
              {submitting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default Leads;
