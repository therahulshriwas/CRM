// frontend/src/pages/Projects.jsx
// Projects module — derived from deals data (GET /api/deals). Each deal is a project with
// pipeline stages as progress. Real data, live socket updates.
// Used in: App.jsx /projects route.

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Search, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import { formatCurrency, formatDate } from '../utils/format';
import { dealStages } from '../config/dealStages';
import StatusState from '../components/ui/StatusState';
import { resolveMediaUrl } from '../utils/media';

function Projects() {
  const { socketInstance: socket } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/deals');
      setProjects(response.data.deals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    if (socket) {
      const handler = () => loadProjects();
      socket.on('dashboard:update', handler);
      return () => socket.off('dashboard:update', handler);
    }
  }, [socket]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      p.title?.toLowerCase().includes(q) ||
      p.lead?.name?.toLowerCase().includes(q) ||
      p.owner?.name?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const totals = useMemo(() => {
    const totalValue = projects.reduce((s, p) => s + parseFloat(p.value || 0), 0);
    const wonValue = projects.filter((p) => p.stage === 'Won').reduce((s, p) => s + parseFloat(p.value || 0), 0);
    const openCount = projects.filter((p) => p.stage !== 'Won' && p.stage !== 'Lost').length;
    const wonCount = projects.filter((p) => p.stage === 'Won').length;
    return {
      count: projects.length,
      totalValue,
      wonValue,
      openCount,
      wonCount,
      recovery: ((wonValue / totalValue) * 100).toFixed(0) || '0',
    };
  }, [projects]);

  const stageProgress = (stage) => {
    const idx = dealStages.indexOf(stage);
    return idx >= 0 ? ((idx + 1) / dealStages.length) * 100 : 0;
  };

  const stageClass = (stage) => {
    const map = {
      Qualified: 'bg-info/10 text-info border-info/20',
      Proposal: 'bg-accent-primary/10 text-accent-secondary-glow border-accent-primary/20',
      Negotiation: 'bg-warning/10 text-warning border-warning/20',
      Won: 'bg-success/10 text-success border-success/20',
      Lost: 'bg-danger/10 text-danger border-danger/20',
    };
    return map[stage] || map.Qualified;
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        icon={FolderKanban}
        subtitle="Every deal visualized as a project with progress tracking."
        badge="Pipeline"
        accent="#8B5CF6"
        actions={
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-text-secondary" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-56 pl-9 pr-3 py-2 rounded-xl glass-deep text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary transition-all"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={loadProjects}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-2xl glass-deep p-5 flex flex-col gap-1 overflow-hidden">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Active Projects</span>
          <span className="text-2xl font-display font-bold text-text-primary">{totals.openCount}</span>
          <span className="text-xs text-text-secondary/50">{totals.count} total deals</span>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-2xl glass-deep p-5 flex flex-col gap-1 overflow-hidden">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Won Value</span>
          <span className="text-2xl font-display font-bold text-success">{formatCurrency(totals.wonValue)}</span>
          <span className="text-xs text-text-secondary/50">{totals.wonCount} deals closed</span>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-2xl glass-deep p-5 flex flex-col gap-1 overflow-hidden">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Pipeline</span>
          <span className="text-2xl font-display font-bold text-accent-glow">{formatCurrency(totals.totalValue)}</span>
          <span className="text-xs text-text-secondary/50">{totals.recovery}% recovery rate</span>
        </motion.div>
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-2xl glass-deep p-5 flex flex-col gap-1 overflow-hidden">
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Avg Deal</span>
          <span className="text-2xl font-display font-bold text-info">{formatCurrency(totals.count ? totals.totalValue / totals.count : 0)}</span>
          <span className="text-xs text-text-secondary/50">across {totals.count} projects</span>
        </motion.div>
      </motion.div>

      {/* Projects list */}
      <Panel title="Project Board" subtitle="Deal-based project tracker" icon={FolderKanban} accent="#8B5CF6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : error ? (
            <StatusState type="error" message={error} onRetry={loadProjects} />
        ) : filtered.length === 0 ? (
          <div>
            <EmptyState
              title="No projects found"
              description={searchQuery ? 'Try adjusting your search.' : 'Projects (deals) will appear here once created.'}
              action={<Button variant="primary" onClick={loadProjects}>Refresh</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-overlay/5 bg-overlay/[0.02]">
                  {['Project', 'Lead', 'Value', 'Stage', 'Progress', 'Owner', 'Due Date'].map((col) => (
                    <th key={col} className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((project, i) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-overlay/5 last:border-0 hover:bg-overlay/3 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-glow">
                          <FolderKanban size={14} />
                        </div>
                        <span className="text-sm font-semibold text-text-primary">{project.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary">{project.lead?.name || '—'}</td>
                    <td className="py-3.5 px-4 text-sm font-bold text-text-primary">{formatCurrency(project.value)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${stageClass(project.stage)}`}>
                        {project.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-overlay/10 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-highlight"
                            initial={{ width: 0 }}
                            animate={{ width: `${stageProgress(project.stage)}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                        <span className="text-[10px] text-text-tertiary">{stageProgress(project.stage).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={project.owner?.name || 'U'} role={project.owner?.role || 'agent'} size={24} src={resolveMediaUrl(project.owner?.avatar_url)} />
                        <span className="text-xs text-text-secondary">{project.owner?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(project.close_date)}</td>
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

export default Projects;
