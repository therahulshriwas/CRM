// frontend/src/pages/LeadDetail.jsx
// Lead detail page — full profile of a single lead, contact info, owner, and related deals.
// Supports editing and deletion with the shared LeadModal.
// Used in: App.jsx /leads/:id route.

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Pencil, Trash2, Briefcase } from 'lucide-react';
import { useLeadsStore } from '../store/leadsStore';
import { useDealsStore } from '../store/dealsStore';
import { useAuthStore } from '../store/authStore';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Panel from '../components/common/Panel';
import LeadModal from '../components/leads/LeadModal';
import { leadStatusBadge } from '../config/leads';
import { stageBadgeVariants } from '../config/dealStages';
import { formatCurrency, formatDate } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { itemVariants } from '../animations/variants';

function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchLeadById, updateLead, deleteLead } = useLeadsStore();
  const { deals, fetchDeals } = useDealsStore();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeadById(id);
      setLead(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lead not found.');
    } finally {
      setLoading(false);
    }
  }, [id, fetchLeadById]);

  useEffect(() => {
    loadLead();
    fetchDeals();
  }, [loadLead, fetchDeals]);

  const relatedDeals = deals.filter((deal) => deal.lead_id === Number(id));

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    const result = await updateLead(lead.id, payload);
    setSubmitting(false);
    if (result.success) {
      setEditOpen(false);
      loadLead();
    }
    return result;
  };

  const handleDelete = async () => {
    setSubmitting(true);
    const result = await deleteLead(lead.id);
    setSubmitting(false);
    if (result.success) {
      setDeleteOpen(false);
      navigate('/app/leads');
    }
  };

  const ownerOptions = lead?.owner ? [lead.owner] : [];

  return (
    <motion.div variants={itemVariants} initial="initial" animate="animate" className="flex flex-col gap-5">
      <button
        onClick={() => navigate('/app/leads')}
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Back to Leads
      </button>

      {loading ? (
        <div className="h-64 rounded-2xl shimmer" />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-2xl glass-deep">
          <span className="text-sm text-danger">{error}</span>
          <Button variant="secondary" onClick={() => navigate('/app/leads')}>Go back</Button>
        </div>
      ) : lead ? (
        <>
          {/* Lead header */}
          <div className="rounded-2xl glass-deep p-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={lead.name} role={lead.owner?.role || 'agent'} size={56} />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-display font-semibold text-text-primary">{lead.name}</h1>
                  <Badge label={lead.status} variant={leadStatusBadge[lead.status] || 'secondary'} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
                  <span className="px-2 py-0.5 rounded-md bg-overlay/5 border border-overlay/10">{lead.source}</span>
                  {lead.owner && (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={lead.owner.name} role={lead.owner.role} size={18} src={resolveMediaUrl(lead.owner.avatar_url)} />
                      Owned by {lead.owner.name}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-text-secondary/50 mt-2 block">Created {formatDate(lead.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil size={15} />
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeleteOpen(true)}
                className="!text-danger hover:!bg-danger/5"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Mail, label: 'Email', value: lead.email || '—', href: lead.email ? `mailto:${lead.email}` : null },
              { icon: Phone, label: 'Phone', value: lead.phone || '—', href: lead.phone ? `tel:${lead.phone}` : null },
              { icon: MapPin, label: 'Source', value: lead.source || '—' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl glass-deep p-5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-primary/10">
                  <item.icon size={18} className="text-accent-glow" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-text-secondary/50 uppercase tracking-wider font-bold">{item.label}</span>
                  {item.href ? (
                    <a href={item.href} className="block text-sm text-text-primary truncate hover:text-accent-glow transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <span className="block text-sm text-text-primary truncate">{item.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Related deals */}
          <Panel title="Related Deals" icon={Briefcase} accent="#8B5CF6"
            actions={<span className="text-[10px] text-text-secondary/50 font-semibold">{relatedDeals.length}</span>}>
            {relatedDeals.length === 0 ? (
              <EmptyState
                title="No deals for this lead"
                description="Deals linked to this lead will appear here."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {relatedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-bg-secondary/50 border border-overlay/5 hover:bg-bg-hover transition-colors"
                  >
                    <div>
                      <span className="text-sm font-semibold text-text-primary">{deal.title}</span>
                      <span className="text-[11px] text-text-secondary/60 block mt-0.5">
                        Close {deal.close_date ? formatDate(deal.close_date) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary">{formatCurrency(deal.value)}</span>
                      <Badge label={deal.stage} variant={stageBadgeVariants[deal.stage] || 'secondary'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Edit modal */}
          <LeadModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            initialData={lead}
            users={ownerOptions}
            currentUser={user}
            onSubmit={handleSubmit}
            submitting={submitting}
          />

          {/* Delete confirmation */}
          <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Lead" maxWidth="max-w-sm">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                Delete <span className="text-text-primary font-semibold">{lead.name}</span> and its data? This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleDelete} disabled={submitting} className="!bg-danger !from-danger !to-danger/80">
                  {submitting ? 'Deleting...' : 'Delete Lead'}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : null}
    </motion.div>
  );
}

export default LeadDetail;
