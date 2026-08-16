// frontend/src/pages/Employees.jsx
// Employees module — team roster with live performance stats (deals, leads, won revenue).
// Real data from GET /api/employees, live via the shared dashboard socket.
// Used in: App.jsx /employees route.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, GitBranch, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import { containerVariants, itemVariants, pageVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import StatusState from '../components/ui/StatusState';

const roleStyles = {
  admin: 'bg-accent-primary/10 text-accent-glow border-accent-primary/20',
  team_lead: 'bg-accent-highlight/10 text-accent-highlight border-accent-highlight/20',
  agent: 'bg-overlay/5 text-text-secondary border-overlay/10',
};

function Employees() {
  const { socketInstance: socket } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [totals, setTotals] = useState({ teamDeals: 0, teamLeads: 0, teamRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const response = await api.get('/employees');
        setEmployees(response.data.employees);
        setTotals(response.data.totals);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load employees.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setRefreshKey((k) => k + 1);
    socket.on('dashboard:update', handler);
    return () => socket.off('dashboard:update', handler);
  }, [socket]);

  const summaryCards = [
    { label: 'Team Members', value: employees.length, icon: Users, color: '#8B5CF6' },
    { label: 'Team Deals', value: totals.teamDeals, icon: GitBranch, color: '#3B82F6' },
    { label: 'Team Leads', value: totals.teamLeads, icon: TrendingUp, color: '#F59E0B' },
    { label: 'Team Revenue', value: formatCurrency(totals.teamRevenue), icon: DollarSign, color: '#10B981' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        icon={Users}
        subtitle="Team roster with live performance metrics."
        badge="Roster"
        accent="#8B5CF6"
      />

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -4 }} className="hover-lift relative rounded-2xl glass-deep p-5 flex items-center gap-4 overflow-hidden">
            <card.icon size={20} color={card.color} />
            <div className="min-w-0">
              <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-lg font-display font-semibold text-text-primary truncate">{card.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-2xl shimmer" />
          ))}
        </div>
       ) : error ? (
        <StatusState type="error" message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees" description="Team members added to the system will appear here." />
      ) : (
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <motion.div
              key={emp.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="hover-lift relative rounded-2xl glass-deep p-5 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <Avatar name={emp.name} role={emp.role} size={46} src={resolveMediaUrl(emp.avatar_url)} showStatus isOnline />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-text-primary truncate">{emp.name}</span>
                  <span className="block text-[11px] text-text-secondary truncate">{emp.email}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${roleStyles[emp.role] || roleStyles.agent}`}>
                  {emp.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-overlay/5 pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <GitBranch size={13} className="text-info" />
                  <span className="font-semibold text-text-primary">{emp.dealCount}</span> deals
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <TrendingUp size={13} className="text-warning" />
                  <span className="font-semibold text-text-primary">{emp.openPipeline}</span> open
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Users size={13} className="text-accent-secondary-glow" />
                  <span className="font-semibold text-text-primary">{emp.leadCount}</span> leads
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-success/15 bg-success/5 px-3 py-2.5">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Won revenue</span>
                <span className="text-sm font-bold text-success">{formatCurrency(emp.wonValue)}</span>
              </div>

              <span className="text-[10px] text-text-secondary/50">
                Joined {new Date(emp.joinedAt).toLocaleDateString()}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Employees;
