// frontend/src/pages/Deals.jsx
// Deals/Pipeline page — full-width kanban board with drag-and-drop stage changes.
// Uses the shared dealsStore (also drives the Dashboard compact pipeline) and the DealModal for creation.
// Used in: App.jsx /deals route.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, GitBranch, DollarSign, TrendingUp, Trophy } from 'lucide-react';
import api from '../api/axios';
import { useDealsStore } from '../store/dealsStore';
import { useAuthStore } from '../store/authStore';
import KanbanBoard from '../components/deals/KanbanBoard';
import DealModal from '../components/deals/DealModal';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import StatusState from '../components/ui/StatusState';
import { dealStages } from '../config/dealStages';
import { containerVariants, itemVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import { toast } from '../components/ui/toastStore';

function Deals() {
  const { deals, loading, error, fetchDeals, updateStage, createDeal } = useDealsStore();
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Load a lead selector list for the New Deal modal (isolated from the Leads page store state).
  useEffect(() => {
    const loadLeads = async () => {
      try {
        const response = await api.get('/leads?limit=100');
        setLeads(response.data.leads);
      } catch {
        setLeads([]);
      }
    };
    loadLeads();
  }, []);

  // Owner options for admin/team_lead, derived from loaded deals.
  const ownerOptions = React.useMemo(() => {
    const map = new Map();
    deals.forEach((deal) => {
      if (deal.owner) map.set(deal.owner.id, deal.owner);
    });
    return Array.from(map.values());
  }, [deals]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    const result = await createDeal(payload);
    setSubmitting(false);
    return result;
  };

  const handleStageChange = async (dealId, stage) => {
    const result = await updateStage(dealId, stage);
    if (!result.success) toast.error(result.message || 'Could not update the deal stage.');
  };

  // Pipeline summary counts + valuation per stage
  const totalPipeline = deals.reduce((a, d) => a + (d.value || 0), 0);
  const wonDeals = deals.filter((d) => d.stage === 'Won').length;
  const avgDeal = deals.length ? Math.round(totalPipeline / deals.length) : 0;

  const kpiCards = [
    { label: 'Total Pipeline', value: formatCurrency(totalPipeline), icon: DollarSign, color: '#8B5CF6' },
     { label: 'Open Deals', value: deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').length, icon: GitBranch, color: '#3B82F6' },
    { label: 'Won (Count)', value: wonDeals, icon: Trophy, color: '#10B981' },
    { label: 'Avg Deal Value', value: formatCurrency(avgDeal), icon: TrendingUp, color: '#F59E0B' },
  ];

  // Pipeline summary counts per stage
  const summary = [...dealStages, 'Lost'].map((stage) => ({
    stage,
    count: deals.filter((d) => d.stage === stage).length,
  }));

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="flex flex-col gap-6">
      <PageHeader
        title="Deals Pipeline"
        icon={GitBranch}
        subtitle="Drag cards between stages to update them in real time."
        badge="Kanban"
        accent="#8B5CF6"
        actions={
            <Button variant="primary" onClick={() => setModalOpen(true)} disabled={leads.length === 0} title={leads.length === 0 ? 'Create a lead before creating a deal' : 'Create a new deal'}>
            <Plus size={16} />
            New Deal
          </Button>
        }
      />

      {/* KPI strip */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
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

       {/* Pipeline summary strip */}
       <motion.div
         variants={containerVariants}
         initial="initial"
         animate="animate"
         className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3"
       >
         {summary.map(({ stage, count }) => (
           <motion.div
             key={stage}
             variants={itemVariants}
             whileHover={{ y: -2, scale: 1.02 }}
             className="rounded-2xl glass-deep p-3 text-center"
           >
             <span className="text-lg font-display font-bold text-text-primary">{count}</span>
             <span className="text-[10px] uppercase tracking-wider text-text-secondary/60 block mt-0.5">{stage}</span>
           </motion.div>
         ))}
       </motion.div>

      {/* Kanban board */}
      <Panel title="Pipeline Board" subtitle="Real-time stage management" icon={GitBranch} accent="#8B5CF6" lift={false}>
        {loading ? (
          <div className="grid grid-cols-5 gap-3 min-w-[1080px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl shimmer" />
            ))}
          </div>
        ) : error ? (
          <StatusState type="error" message={error} onRetry={fetchDeals} />
        ) : (
          <div className="overflow-x-auto">
            <KanbanBoard deals={deals} onStageChange={handleStageChange} />
          </div>
        )}
      </Panel>

      {/* New Deal modal */}
      <DealModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        leads={leads}
        users={ownerOptions}
        currentUser={user}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </motion.div>
  );
}

export default Deals;
