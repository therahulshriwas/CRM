// frontend/src/pages/Tasks.jsx
// Tasks module — derived from recent activities + deals pipeline. Real data from /api/dashboard/stats.
// Used in: App.jsx /tasks route.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Search, Calendar, GitBranch, Check, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { containerVariants, itemVariants, pageVariants } from '../animations/variants';
import { formatDate } from '../utils/format';
import StatusState from '../components/ui/StatusState';

const TASK_STATUS = ['All', 'Pending', 'In Progress', 'Completed'];

function Tasks() {
  const { socketInstance: socket } = useAuthStore();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/stats');
      const activities = response.data?.recentActivities || [];
      const deals = response.data?.recentDeals || [];

      // Map activities to task-like items
      const activityTasks = activities.map((a, i) => ({
        id: `act-${a.id || i}`,
        type: 'activity',
        title: a.notes || a.type || 'Activity log',
        description: a.dealTitle ? `Linked to "${a.dealTitle}"` : '',
        owner: a.userName || 'Unassigned',
        ownerAvatar: a.userName?.split(' ').map((n) => n[0]).join('') || 'U',
        dueDate: a.activityDate || a.createdAt,
        status: a.type === 'stage_change' ? 'Completed' : 'Pending',
        value: null,
      }));

      // Map open pipeline deals as in-progress tasks (Proposal/Negotiation)
      const dealTasks = deals
        .filter((d) => d.stage === 'Proposal' || d.stage === 'Negotiation')
        .map((d, i) => ({
          id: `deal-${d.id}-${i}`,
          type: 'deal',
          title: d.title,
          description: `${d.customer || 'Customer'} — ${d.stage}`,
          owner: d.ownerName || 'Unassigned',
          ownerAvatar: d.ownerName?.split(' ').map((n) => n[0]).join('') || 'U',
          dueDate: d.closeDate,
          status: d.stage === 'Proposal' ? 'In Progress' : 'In Progress',
          value: d.value,
        }));

      setAllTasks([...activityTasks, ...dealTasks]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    if (socket) {
      const handler = () => loadTasks();
      socket.on('dashboard:update', handler);
      return () => socket.off('dashboard:update', handler);
    }
  }, [socket]);

  const filtered = allTasks.filter((t) => {
    const matchesSearch = !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const summaryCards = [
    { label: 'Total Tasks', value: allTasks.length, icon: CheckSquare, color: '#8B5CF6' },
    { label: 'In Progress', value: allTasks.filter((t) => t.status === 'In Progress').length, icon: GitBranch, color: '#3B82F6' },
    { label: 'Completed', value: allTasks.filter((t) => t.status === 'Completed').length, icon: Check, color: '#10B981' },
    { label: 'Pending', value: allTasks.filter((t) => t.status === 'Pending').length, icon: Calendar, color: '#F59E0B' },
  ];

  const statusChip = (status) => {
    const map = {
      Pending: 'bg-warning/10 text-warning border-warning/20',
      'In Progress': 'bg-info/10 text-info border-info/20',
      Completed: 'bg-success/10 text-success border-success/20',
    };
    return map[status] || map.Pending;
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Tasks"
        icon={CheckSquare}
        subtitle="Activities and open deals requiring action."
        badge="Live"
        accent="#8B5CF6"
        actions={
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-text-secondary" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-56 pl-9 pr-3 py-2 rounded-xl glass-deep text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl glass-deep text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
            >
              {TASK_STATUS.map((s) => (
                <option key={s} value={s} className="bg-bg-surface">{s}</option>
              ))}
            </select>
          </div>
        }
      />

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -4 }} className="hover-lift relative rounded-2xl glass-deep p-4 flex items-center gap-3.5 overflow-hidden">
            <card.icon size={18} style={{ color: card.color }} />
            <div>
              <span className="block text-lg font-display font-bold text-text-primary">{card.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-text-secondary/60 font-semibold">{card.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Panel title="Task Queue" subtitle="Actionable items from your pipeline" icon={CheckSquare} accent="#8B5CF6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : error ? (
          <StatusState type="error" message={error} onRetry={loadTasks} />
        ) : filtered.length === 0 ? (
          <div>
            <EmptyState
              title="No tasks match"
              description={searchQuery ? 'Try adjusting your search or filter.' : 'All caught up — there is nothing to do right now.'}
              action={<Button variant="primary" onClick={loadTasks}><RefreshCw size={14} /></Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-overlay/5 bg-overlay/[0.02]">
                  {['Task', 'Description', 'Owner', 'Due Date', 'Status'].map((col) => (
                    <th key={col} className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((task, i) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-overlay/5 last:border-0 hover:bg-overlay/3 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded-lg ${task.type === 'deal' ? 'bg-accent-primary/10 text-accent-glow' : 'bg-success/10 text-success'}`}>
                          {task.type === 'deal' ? <GitBranch size={13} /> : <Check size={13} />}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">{task.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary max-w-[200px] truncate">{task.description || '—'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={task.ownerAvatar} size={24} />
                        <span className="text-xs text-text-secondary">{task.owner}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(task.dueDate)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusChip(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </motion.div>
  );
}

export default Tasks;
