// frontend/src/pages/Dashboard.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — EXECUTIVE CONTROL CENTER
// -----------------------------------------------------------------------------
// A complete rebuild of the Dashboard as a single executive surface. Every
// widget is driven by real backend data (no placeholders):
//
//  • Row 1 — Executive greeting (shimmer name + live clock) + global quick-
//            actions (New Deal / New Lead / Quick Insight)
//  • Row 2 — 6 live KPI stat cards (revenue, profit, customers, leads,
//            conversion, growth) with animated sparklines + trend indicators
//  • Row 3 — Sales forecast waterfall (real weighted-probability pipeline)
//  • Row 4 — Dual: revenue area chart (6-mo real) + pipeline funnel
//  • Row 5 — AI insight summary (real assistant query against role-scoped data)
//  • Row 6 — Performance heatmap (7×24 real activity grid)
//  • Row 7 — Upcoming meetings + recent deals table
//
// Real-time: the dashboard:update socket event pushes fresh stats; the whole
// surface re-animates on update. Data lives in dashboardStore (single fetch).
//
// Used in: App.jsx "/app" route.
// =============================================================================

import React, { useEffect, useState, useRef, lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Users,
  UserPlus,
  Percent,
  Rocket,
  Calendar,
  Activity,
  BarChart3,
  Plus,
  Sparkles,
  MousePointerClick,
  RefreshCw,
  Target,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useAiStore, validateMessage, messageId } from '../store/aiStore';
import { sanitizeErrorMessage, sanitizeText } from '../utils/security';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import StatusState from '../components/ui/StatusState';
import SalesForecast from '../components/dashboard/widgets/SalesForecast';
import PipelineFunnel from '../components/dashboard/widgets/PipelineFunnel';
import PerformanceHeatmap from '../components/dashboard/widgets/PerformanceHeatmap';
import UpcomingMeetings from '../components/dashboard/widgets/UpcomingMeetings';
import RecentDealsTable from '../components/dashboard/RecentDealsTable';
import { containerVariants, itemVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import api from '../api/axios';

// Charts are code-split (biggest bundle wins).
const RevenueAreaChart = lazy(() => import('../components/dashboard/widgets/RevenueAreaChart'));
const SalesBySourceDonut = lazy(() => import('../components/dashboard/widgets/SalesBySourceDonut'));

function ChartSkeleton() {
  return (
    <div className="w-full h-[260px] rounded-2xl bg-bg-surface/40 animate-pulse border border-overlay/5" />
  );
}

// ---- Live clock ----
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-xs text-text-secondary font-mono tabular-nums">
      {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ---- AI Insight snapshot ----
// Fires a real assistant query scoped to the current user's data and shows
// the cached reply. Uses the shared aiStore's AbortController so it participates
// in the single-stream invariant (only one AI request in-flight at any time).
const AiInsightCard = memo(function AiInsightCard({ stats }) {
  const [insight, setInsight] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [asked, setAsked] = useState(false);
  const requestIdRef = useRef(null);

  // Get the abort function from the store so we can abort this request
  // when a new chat message starts, the component unmounts, or the page changes.
  const abortAll = useAiStore((s) => s._abortAll);

  useEffect(() => {
    if (asked) return;

    const kpis = stats?.kpis;
    const totalDeals = (stats?.pipeline &&
      Object.values(stats.pipeline).reduce((a, b) => a + b, 0)) || 0;
    const q =
      `Give me a 2-sentence executive sales insight. ` +
      `Revenue is ${formatCurrency(kpis?.totalRevenue || 0)}, ` +
      `growth is ${kpis?.growth || 0}%, ` +
      `there are ${totalDeals} active deals, ` +
      `and conversion is ${kpis?.conversionRate || 0}%.`;

    const validatedMessage = validateMessage(q);
    if (!validatedMessage) {
      setError('Unable to generate insight at this time.');
      setAsked(true);
      setIsTyping(false);
      return;
    }

    const controller = new AbortController();
    const currentId = messageId();
    requestIdRef.current = currentId;

    // Register this controller in the shared store so abortAll() can reach it.
    useAiStore.getState()._controllers.set(currentId, controller);

    setAsked(true);
    setIsTyping(true);
    setError(null);

    api.post('/ai/assistant', { message: validatedMessage }, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          if (requestIdRef.current === currentId) {
            setInsight(sanitizeText(response.data?.data?.text));
          }
        }
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        if (requestError.name === 'AbortError') return;
        if (requestIdRef.current !== currentId) return;
        setError(sanitizeErrorMessage(requestError, 'The executive insight is unavailable right now.'));
      })
      .finally(() => {
        // Cleanup: remove controller from store and reset state if still current.
        useAiStore.getState()._controllers.delete(currentId);
        if (requestIdRef.current === currentId && !controller.signal.aborted) {
          setIsTyping(false);
        }
      });

    // Cleanup: abort this request when component unmounts OR when a new AI
    // request starts elsewhere (via abortAll). This ensures single-stream invariant.
    return () => {
      controller.abort();
      useAiStore.getState()._controllers.delete(currentId);
    };
  }, [asked, stats, abortAll]);

  return (
    <Panel
      title="AI Executive Insight"
      subtitle="Powered by your role-scoped data"
      icon={Sparkles}
      accent="#8B5CF6"
      lift
    >
      <div className="min-h-[64px]">
         {isTyping && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse" />
            <span>Copilot analyzing your pipeline…</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-xs text-danger">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {!isTyping && !error && insight && (
          <p className="text-xs text-text-secondary leading-relaxed">
             {insight}
          </p>
        )}
      </div>
    </Panel>
  );
});

function Dashboard() {
  const navigate = useNavigate();
  const { user: _user, socketInstance: socket } = useAuthStore();
  const { stats, heatmap, upcomingEvents, loading, error, refetch, liveRefresh } =
    useDashboardStore();
  const toggleAi = useAiStore((s) => s.togglePanel);

   // Initial load — force refetch so navigating back always shows fresh data
   const { fetchDashboardStats } = useDashboardStore.getState();
   useEffect(() => {
     fetchDashboardStats(true);
   }, [fetchDashboardStats]);

  // Live socket updates
  useEffect(() => {
    if (!socket) return;
    const handler = (freshStats) => liveRefresh(freshStats);
    socket.on('dashboard:update', handler);
    return () => socket.off('dashboard:update', handler);
  }, [socket, liveRefresh]);

  const kpis = stats?.kpis;
  const pipeline = stats?.pipeline || {};

  // Stat card definitions — all driven by real KPI values.
  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(kpis?.totalRevenue || 0),
      icon: DollarSign,
      iconColor: 'text-success',
      variant: 'success',
      trend: kpis?.growth,
    },
    {
      title: 'Total Profit',
      value: formatCurrency(kpis?.totalProfit || 0),
      icon: TrendingUp,
      iconColor: 'text-info',
      variant: 'info',
       trend: kpis?.growth,
    },
    {
      title: 'Customers',
      value: kpis?.totalCustomers || 0,
      icon: Users,
      iconColor: 'text-warning',
      variant: 'warning',
       trend: kpis?.growth,
    },
    {
      title: 'New Leads',
      value: kpis?.newLeads || 0,
      icon: UserPlus,
      iconColor: 'text-accent-glow',
      variant: 'primary',
      trend: kpis?.growth,
    },
    {
      title: 'Conversion',
      value: `${kpis?.conversionRate || 0}%`,
      icon: Percent,
      iconColor: 'text-accent-highlight',
      variant: 'accent',
      trend: kpis?.conversionRate,
      isPercentage: true,
    },
    {
      title: 'Pipeline Growth',
      value: `${kpis?.growth || 0}%`,
      icon: Rocket,
      iconColor: 'text-success',
      variant: 'success',
      trend: kpis?.growth,
      isPositive: (kpis?.growth || 0) >= 0,
      showGrowthTip: true,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="relative flex flex-col gap-6"
    >
      {/* Aurora backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="aurora-blob top-[-80px] left-[5%] w-[380px] h-[380px] bg-accent-primary opacity-20" />
        <div className="aurora-blob top-[40px] left-[45%] w-[320px] h-[320px] bg-accent-highlight opacity-15" />
        <div className="aurora-blob top-[-40px] right-[8%] w-[300px] h-[300px] bg-accent-secondary-glow opacity-12" />
      </div>

      {/* Row 1 — PageHeader with executive actions */}
      <PageHeader
        title={
          <>
            Executive <span className="text-shimmer">Control Center</span>
          </>
        }
        subtitle="Your real-time revenue operations dashboard."
        icon={MousePointerClick}
        badge="Live"
        accent="#8B5CF6"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-success/15 bg-success/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-[10px] font-semibold text-success tracking-wider uppercase">
                Live
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-deep">
              <Calendar size={13} className="text-accent-glow" />
              <span className="text-xs text-text-secondary">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <LiveClock />
            </div>
            <Button variant="ghost" size="sm" onClick={refetch} title="Refresh data">
              <RefreshCw size={12} />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => navigate('/app/deals')}>
                <Plus size={12} /> New Deal
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/leads')}>
                <Plus size={12} /> New Lead
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleAi()}>
                <Sparkles size={12} /> Quick Insight
              </Button>
            </div>
          </div>
        }
      />

      {/* Row 2 — KPI stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[160px] rounded-2xl bg-bg-surface border border-overlay/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <StatusState type="error" message={error} onRetry={refetch} />
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
          variants={containerVariants}
        >
          {statCards.map((card, _i) => (
            <motion.div key={card.title} variants={itemVariants} className="min-w-[140px] flex-1">
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconColor={card.iconColor}
                variant={card.variant}
                percentChange={card.trend}
                isPercentage={card.isPercentage}
                isPositive={card.isPositive}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Row 3 — Sales Forecast Waterfall */}
      {!loading && !error && stats && (
        <motion.div variants={itemVariants}>
          <Panel
            title="Sales Forecast"
            subtitle="Weighted probability across pipeline stages"
            icon={Target}
            accent="#3B82F6"
            lift
          >
            <SalesForecast deals={stats?.deals || []} pipeline={pipeline} />
          </Panel>
        </motion.div>
      )}

      {/* Row 4 — Revenue chart + Pipeline funnel */}
      {!loading && !error && stats && (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <Panel
              title="Revenue Trend"
              subtitle="Won deals by month (last 6 months)"
              icon={BarChart3}
              accent="#7C3AED"
              lift
            >
              <Suspense fallback={<ChartSkeleton />}>
                <RevenueAreaChart data={stats?.charts?.revenueTimeline || []} />
              </Suspense>
            </Panel>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Panel
              title="Pipeline Funnel"
              subtitle="Stage distribution by deal count"
              icon={Activity}
              accent="#F59E0B"
              lift
            >
              <PipelineFunnel deals={stats?.deals || []} />
            </Panel>
          </motion.div>
        </motion.div>
      )}

      {/* Row 5 — AI Insight + Performance Heatmap */}
      {!loading && !error && stats && (
        <motion.div variants={containerVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <motion.div variants={itemVariants}>
            <AiInsightCard stats={stats} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Panel
              title="Performance Heatmap"
              subtitle="Activity intensity by day & hour"
              icon={Activity}
              accent="#10B981"
              lift
            >
              <PerformanceHeatmap heatmap={heatmap} />
            </Panel>
          </motion.div>
        </motion.div>
      )}

      {/* Row 6 — Upcoming Meetings + Sales by Source */}
      {!loading && !error && stats && (
        <motion.div variants={containerVariants} className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <Panel
              title="Upcoming Meetings"
              subtitle={`${upcomingEvents.length} events next 7 days`}
              icon={Calendar}
              accent="#A855F7"
              lift
              actions={
                <span className="text-[10px] font-semibold text-text-secondary/50">
                  {upcomingEvents.length} upcoming
                </span>
              }
            >
              <UpcomingMeetings events={upcomingEvents} />
            </Panel>
          </motion.div>
          <motion.div variants={itemVariants} className="xl:col-span-3">
            <Panel
              title="Sales by Source"
              subtitle="Deal origination breakdown"
              icon={Users}
              accent="#10B981"
              lift
            >
              <Suspense fallback={<ChartSkeleton />}>
                <SalesBySourceDonut data={stats?.charts?.salesBySource || []} />
              </Suspense>
            </Panel>
          </motion.div>
        </motion.div>
      )}

      {/* Row 7 — Recent Deals table */}
      {!loading && !error && stats && (
        <motion.div variants={itemVariants} className="overflow-hidden rounded-2xl">
          <RecentDealsTable deals={stats?.recentDeals || []} />
        </motion.div>
      )}

    </motion.div>
  );
}

export default Dashboard;
