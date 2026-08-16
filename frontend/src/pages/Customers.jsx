// frontend/src/pages/Customers.jsx
// Customers module — directory of customers (leads with deals) showing lifetime value, deal counts,
// and last purchase. Real data from GET /api/customers, live via the shared dashboard socket.
// Used in: App.jsx /customers route.

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, Phone, DollarSign, Package, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import { containerVariants, itemVariants, pageVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import StatusState from '../components/ui/StatusState';

function Customers() {
  const { socketInstance: socket } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCustomers = async () => {
    setError('');
    try {
      const response = await api.get('/customers', {
        params: { search: search || undefined, page: 1, limit: 100 },
      });
      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refreshKey]);

  // Live updates: when deals change, refresh the customer aggregates.
  useEffect(() => {
    if (!socket) return;
    const handler = () => setRefreshKey((k) => k + 1);
    socket.on('dashboard:update', handler);
    return () => socket.off('dashboard:update', handler);
  }, [socket]);

  const totals = useMemo(() => {
    const revenue = customers.reduce((s, c) => s + (c.totalValue || 0), 0);
    const deals = customers.reduce((s, c) => s + (c.dealCount || 0), 0);
    return { revenue, deals };
  }, [customers]);

  const summaryCards = [
    { label: 'Total Customers', value: pagination.totalItems, icon: Users, color: '#8B5CF6' },
    { label: 'Lifetime Revenue', value: formatCurrency(totals.revenue), icon: DollarSign, color: '#10B981' },
    { label: 'Total Deals', value: totals.deals, icon: Package, color: '#3B82F6' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        icon={Users}
        subtitle="Leads that converted — with lifetime purchase value."
        badge="Live"
        accent="#8B5CF6"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-text-secondary" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-64 pl-9 pr-3 py-2 rounded-xl glass-deep text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary transition-all focus:shadow-[0_0_20px_rgba(124,58,237,0.15)]"
            />
          </div>
        }
      />

      {/* Summary cards */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <motion.div
            key={card.label}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="hover-lift relative rounded-2xl glass-deep p-5 flex items-center gap-4 overflow-hidden"
          >
            <card.icon size={20} color={card.color} />
            <div>
              <span className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider">{card.label}</span>
              <span className="text-xl font-display font-semibold text-text-primary">{card.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Customer grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[180px] rounded-2xl shimmer" />
          ))}
        </div>
       ) : error ? (
        <StatusState type="error" message={error} onRetry={fetchCustomers} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Leads that close a deal will appear here as customers." />
      ) : (
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <motion.div
              key={customer.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="hover-lift relative rounded-2xl glass-deep p-5 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} size={44} />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-text-primary truncate">{customer.name}</span>
                  <span className="block text-[11px] text-text-secondary truncate">{customer.email || '—'}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                  {customer.status}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-overlay/5 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <DollarSign size={13} className="text-success" />
                  <span className="font-semibold text-text-primary">{formatCurrency(customer.totalValue)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Package size={13} className="text-info" />
                  <span>{customer.dealCount} deals</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <TrendingUp size={13} className="text-accent-secondary-glow" />
                  <span>{customer.wonDeals} won</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-text-secondary/60">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} /> {customer.phone}
                  </span>
                )}
                {customer.source && (
                  <span className="flex items-center gap-1">
                    <Mail size={11} /> {customer.source}
                  </span>
                )}
                {customer.lastPurchase && (
                  <span className="ml-auto">Last: {new Date(customer.lastPurchase).toLocaleDateString()}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Customers;
