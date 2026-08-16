// frontend/src/pages/Search.jsx
// Global search module — unified search across leads, deals, customers, and employees.
// Debounced multi-resource query with result grouping + keyboard nav (Cmd+K).
// Used in: App.jsx /search route.

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Users2, GitBranch, Users, Keyboard } from 'lucide-react';
import api from '../api/axios';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import StatusState from '../components/ui/StatusState';
import { pageVariants, itemVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { leadStatusBadge } from '../config/leads';
import { stageBadgeVariants } from '../config/dealStages';

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ leads: [], deals: [], customers: [], employees: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults({ leads: [], deals: [], customers: [], employees: [] });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (q) => {
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, dealsRes, customersRes, employeesRes] = await Promise.allSettled([
        api.get(`/leads?search=${encodeURIComponent(q)}&limit=5`),
        api.get(`/deals?search=${encodeURIComponent(q)}&limit=5`),
        api.get(`/customers?search=${encodeURIComponent(q)}&limit=5`),
        api.get('/employees'),
      ]);

      const leads = leadsRes.status === 'fulfilled' ? (leadsRes.value.data.leads || []) : [];
      const deals = dealsRes.status === 'fulfilled' ? (dealsRes.value.data.deals || []) : [];
      const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data.customers || []) : [];
      const allEmployees = employeesRes.status === 'fulfilled' ? (employeesRes.value.data.employees || []) : [];
      const employees = allEmployees.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(q.toLowerCase()) ||
          emp.email?.toLowerCase().includes(q.toLowerCase())
      );

      setResults({ leads, deals, customers, employees });
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ leads: [], deals: [], customers: [], employees: [] });
    if (inputRef.current) inputRef.current.focus();
  };

  const totalResults = results.leads.length + results.deals.length + results.customers.length + results.employees.length;
  const resultAction = (type, id) => {
    const paths = { leads: `/app/leads/${id}`, deals: '/app/deals', customers: '/app/customers', employees: '/app/employees' };
    navigate(paths[type]);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Search"
        icon={Search}
        subtitle="Find leads, deals, customers, and employees across your workspace."
        badge="Global"
        accent="#3B82F6"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-text-secondary" size={15} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-72 pl-10 pr-4 py-2.5 rounded-xl glass-deep text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary transition-all focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
              >
                <span className="text-xs">Clear</span>
              </button>
            )}
          </div>
        }
      />

      {!query && (
        <Panel accent="#3B82F6">
          <motion.div variants={itemVariants} className="text-center flex flex-col items-center gap-3">
            <Search size={40} className="text-text-tertiary/30" />
            <h3 className="text-text-primary font-display font-semibold">Start typing to search</h3>
            <p className="text-text-secondary/60 text-sm max-w-md">
              Search across leads, deals, customers, and employees. Use ⌘K for quick access from anywhere.
            </p>
          </motion.div>
        </Panel>
      )}

      {query && (
        <>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{totalResults} results for "{query}"</span>
            <div className="flex items-center gap-1 opacity-50">
              <Keyboard size={11} />
              <span>Press Esc to clear</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : error ? (
            <StatusState type="error" message={error} onRetry={() => performSearch(query)} />
          ) : totalResults === 0 ? (
            <StatusState
              type="empty"
              title="No results found"
              message={`We couldn't find anything matching "${query}". Try a different search term.`}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {results.leads.length > 0 && (
                <Panel title="Leads" subtitle={`${results.leads.length} matches`} icon={Users2} accent="#8B5CF6" >
                  <div className="divide-y divide-overlay/5">
                    {results.leads.map((lead, i) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => resultAction('leads', lead.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && resultAction('leads', lead.id)}
                        className="flex items-center gap-3 p-3 hover:bg-overlay/3 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-primary outline-none"
                      >
                        <Avatar name={lead.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text-primary block truncate">{lead.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-text-secondary/60">
                            <span>{lead.email}</span>
                            <span>•</span>
                            <span>{lead.source}</span>
                          </div>
                        </div>
                        <Badge label={lead.status} variant={leadStatusBadge[lead.status] || 'secondary'} />
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              )}

              {results.deals.length > 0 && (
                <Panel title="Deals" subtitle={`${results.deals.length} matches`} icon={GitBranch} accent="#10B981" >
                  <div className="divide-y divide-overlay/5">
                    {results.deals.map((deal, i) => (
                      <motion.div
                        key={deal.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => resultAction('deals', deal.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && resultAction('deals', deal.id)}
                        className="flex items-center gap-3 p-3 hover:bg-overlay/3 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-primary outline-none"
                      >
                        <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-glow">
                          <GitBranch size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text-primary block truncate">{deal.title}</span>
                          <span className="text-[10px] text-text-secondary/60">{deal.lead?.name}</span>
                        </div>
                        <span className="text-sm font-bold text-text-primary">{formatCurrency(deal.value)}</span>
                        <Badge label={deal.stage} variant={stageBadgeVariants[deal.stage] || 'secondary'} />
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              )}

              {results.customers.length > 0 && (
                <Panel title="Customers" subtitle={`${results.customers.length} matches`} icon={Users} accent="#3B82F6" >
                  <div className="divide-y divide-overlay/5">
                    {results.customers.map((customer, i) => (
                      <motion.div
                        key={customer.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => resultAction('customers', customer.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && resultAction('customers', customer.id)}
                        className="flex items-center gap-3 p-3 hover:bg-overlay/3 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-primary outline-none"
                      >
                        <Avatar name={customer.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text-primary block truncate">{customer.name}</span>
                          <span className="text-[10px] text-text-secondary/60">{customer.email}</span>
                        </div>
                        <span className="text-sm font-bold text-success">{formatCurrency(customer.totalValue)}</span>
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              )}

              {results.employees.length > 0 && (
                <Panel title="Employees" subtitle={`${results.employees.length} matches`} icon={Users} accent="#F59E0B" >
                  <div className="divide-y divide-overlay/5">
                    {results.employees.map((emp, i) => (
                      <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => resultAction('employees', emp.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && resultAction('employees', emp.id)}
                        className="flex items-center gap-3 p-3 hover:bg-overlay/3 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-primary outline-none"
                      >
                        <Avatar name={emp.name} role={emp.role} size={32} src={resolveMediaUrl(emp.avatar_url)} showStatus isOnline />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text-primary block truncate">{emp.name}</span>
                          <span className="text-[10px] text-text-secondary/60">{emp.email}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default SearchPage;
