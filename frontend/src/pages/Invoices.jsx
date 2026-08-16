// frontend/src/pages/Invoices.jsx
// Invoices module — invoice records derived from won deals (GET /api/invoices). Shows totals,
// a searchable table, and live refresh on the dashboard socket.
// Used in: App.jsx /invoices route.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Search, DollarSign, Receipt, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { containerVariants, itemVariants, pageVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import StatusState from '../components/ui/StatusState';

function Invoices() {
  const { socketInstance: socket } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [totals, setTotals] = useState({ invoiceCount: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const response = await api.get('/invoices', { params: { search: search || undefined, page: 1, limit: 100 } });
        setInvoices(response.data.invoices);
        setTotals(response.data.totals);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoices.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, refreshKey]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setRefreshKey((k) => k + 1);
    socket.on('dashboard:update', handler);
    return () => socket.off('dashboard:update', handler);
  }, [socket]);

  const filtered = invoices.filter(
    (inv) =>
      !search ||
      inv.customer?.toLowerCase().includes(search.toLowerCase()) ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.title.toLowerCase().includes(search.toLowerCase())
  );

  const summaryCards = [
    { label: 'Total Invoices', value: totals.invoiceCount, icon: Receipt, color: '#8B5CF6' },
    { label: 'Invoiced Amount', value: formatCurrency(totals.totalAmount), icon: DollarSign, color: '#10B981' },
    { label: 'Paid', value: `${totals.invoiceCount} / ${totals.invoiceCount}`, icon: CheckCircle2, color: '#3B82F6' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        icon={Receipt}
        subtitle="Generated from your won deals."
        badge="Live"
        accent="#10B981"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-text-secondary" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-64 pl-9 pr-3 py-2 rounded-xl glass-deep text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary transition-all focus:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            />
          </div>
        }
      />

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -4 }} className="hover-lift relative rounded-2xl glass-deep p-5 flex items-center gap-4 overflow-hidden">
            <card.icon size={20} color={card.color} />
            <div>
              <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-xl font-display font-semibold text-text-primary">{card.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Panel title="Invoice Registry" subtitle="Searchable record of billed deals" icon={Receipt} accent="#10B981" lift={false}>
        {loading ? (
          <div className="h-64 shimmer" />
        ) : error ? (
          <StatusState type="error" message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No invoices yet" description="When deals are won, invoices appear here automatically." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-overlay/5 bg-overlay/[0.02]">
                  {['Invoice', 'Customer', 'Description', 'Amount', 'Status', 'Owner', 'Issued'].map((col) => (
                    <th key={col} className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary/50 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-overlay/5 last:border-0 hover:bg-overlay/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-accent-highlight/10 text-accent-secondary-glow">
                          <FileSpreadsheet size={14} />
                        </div>
                        <span className="text-xs font-bold text-text-primary">{inv.number}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={inv.customer} size={26} />
                        <span className="text-xs font-medium text-text-primary whitespace-nowrap">{inv.customer}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary max-w-[200px] truncate">{inv.title}</td>
                    <td className="py-3.5 px-4 text-xs font-bold text-text-primary">{formatCurrency(inv.amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary whitespace-nowrap">{inv.owner}</td>
                    <td className="py-3.5 px-4 text-xs text-text-secondary/70 whitespace-nowrap">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </motion.div>
  );
}

export default Invoices;
