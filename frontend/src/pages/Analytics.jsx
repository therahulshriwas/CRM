// frontend/src/pages/Analytics.jsx
// Analytics module — deep-dive charts powered by /api/reports (heatmap, funnel, source trend, velocity)
// plus KPIs from /api/dashboard/stats. Theme-aware via useThemeStore.
// Used in: App.jsx /analytics route.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Zap, Activity, PieChart, RefreshCw } from 'lucide-react';
import Chart from '../components/common/ApexChart';
import api from '../api/axios';
import { useThemeStore } from '../store/themeStore';
import { containerVariants, itemVariants, pageVariants } from '../animations/variants';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import StatusState from '../components/ui/StatusState';
import { formatCurrency } from '../utils/format';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Analytics() {
  const [data, setData] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === 'dark';
  const textSecondary = isDark ? '#B7B8C5' : '#605A76';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportRes, kpiRes] = await Promise.all([
        api.get('/reports'),
        api.get('/dashboard/stats'),
      ]);
      setData({ ...reportRes.data, charts: kpiRes.data?.charts || {} });
      setKpis(kpiRes.data?.kpis || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [retryKey]);

  const maxHeat = Array.isArray(data?.heatmap)
    ? Math.max(...data.heatmap.flat(), 1)
    : 1;
  const heatmapColors = Array.from({ length: 5 }, (_, i) => {
    const intensity = i / 4;
    return isDark
      ? `rgba(124,58,237,${0.1 + intensity * 0.7})`
      : `rgba(94,35,148,${0.08 + intensity * 0.6})`;
  });

  const kpiCards = [
    { label: 'Total Revenue', value: formatCurrency(kpis?.totalRevenue), icon: TrendingUp, color: '#10B981' },
    { label: 'Net Profit', value: formatCurrency(kpis?.totalProfit), icon: Zap, color: '#8B5CF6' },
    { label: 'Total Customers', value: kpis?.totalCustomers, icon: Users, color: '#3B82F6' },
    { label: 'Conversion Rate', value: `${kpis?.conversionRate}%`, icon: PieChart, color: '#F59E0B' },
  ];

  const chartTheme = {
    fontFamily: 'Inter, sans-serif',
    grid: { borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(20,16,40,0.08)' },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        icon={BarChart3}
        subtitle="Deep-dive charts and performance metrics across your CRM."
        badge="Analytics"
        accent="#F59E0B"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRetryKey((k) => k + 1)}>
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      {/* KPI summary */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -4 }} className="relative rounded-2xl glass-deep p-4 flex items-center gap-3.5 overflow-hidden">
            <card.icon size={18} style={{ color: card.color }} />
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">{card.label}</span>
              <span className="text-xl font-display font-bold text-text-primary">{card.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : error ? (
        <Panel accent="#F43F5E" className="border-danger/20">
          <StatusState type="error" title="Analytics unavailable" message={error} onRetry={() => setRetryKey((k) => k + 1)} />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Timeline */}
          <motion.div variants={itemVariants}>
            <Panel title="Revenue Timeline" subtitle="6-month revenue trend" icon={TrendingUp} accent="#10B981">
              <div>
                {data.charts?.revenueTimeline && (
                  <Chart
                    options={{
                      ...chartTheme,
                      chart: { type: 'area', background: 'transparent', toolbar: { show: false }, animations: { enabled: true } },
                      stroke: { curve: 'smooth', width: 3 },
                      fill: {
                        type: 'gradient',
                        gradient: {
                          shade: isDark ? 'dark' : 'light',
                          type: 'vertical',
                          opacityFrom: 0.35,
                          opacityTo: 0.02,
                          stops: [0, 100],
                        },
                      },
                      colors: isDark ? ['#10B981'] : ['#059669'],
                      xaxis: {
                        categories: data.charts.revenueTimeline.map((d) => d.month),
                        labels: { style: { colors: textSecondary, fontSize: '11px' } },
                      },
                      yaxis: {
                        labels: {
                          style: { colors: textSecondary, fontSize: '11px' },
                          formatter: (val) => `$${(val / 1000).toFixed(0)}k`,
                        },
                      },
                    }}
                    series={[{ name: 'Revenue', data: data.charts.revenueTimeline.map((d) => d.revenue) }]}
                    type="area"
                    height="240"
                  />
                )}
              </div>
            </Panel>
          </motion.div>

          {/* Sales by Source */}
          <motion.div variants={itemVariants}>
            <Panel title="Sales by Source" subtitle="Revenue distribution" icon={PieChart} accent="#8B5CF6">
              <div>
                {data.charts?.salesBySource && (
                  <Chart
                    options={{
                      ...chartTheme,
                      chart: { type: 'donut', background: 'transparent', fontFamily: 'Inter, sans-serif' },
                      labels: data.charts.salesBySource.map((s) => s.source),
                      colors: ['#8B5CF6', '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
                      dataLabels: { enabled: false },
                      legend: { position: 'bottom', labels: { colors: textSecondary, fontSize: '11px' } },
                    }}
                    series={data.charts.salesBySource.map((s) => s.count)}
                    type="donut"
                    height="240"
                  />
                )}
              </div>
            </Panel>
          </motion.div>

          {/* Leads Trend */}
          <motion.div variants={itemVariants}>
            <Panel title="Leads Trend" subtitle="Leads over the last 6 months" icon={Users} accent="#3B82F6">
              <div>
                {data.charts?.leadsTrend && (
                  <Chart
                    options={{
                      ...chartTheme,
                      chart: { type: 'line', background: 'transparent', toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2 },
                      colors: ['#3B82F6'],
                      xaxis: { categories: data.charts.leadsTrend.map((d) => d.month), labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                      yaxis: { labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    }}
                    series={[{ name: 'Leads', data: data.charts.leadsTrend.map((d) => d.count) }]}
                    type="line"
                    height="240"
                  />
                )}
              </div>
            </Panel>
          </motion.div>

          {/* Customers Trend */}
          <motion.div variants={itemVariants}>
            <Panel title="Customers Trend" subtitle="Customer growth over time" icon={Activity} accent="#F59E0B">
              <div>
                {data.charts?.customersTrend && (
                  <Chart
                    options={{
                      ...chartTheme,
                      chart: { type: 'line', background: 'transparent', toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 2 },
                      colors: ['#F59E0B'],
                      xaxis: { categories: data.charts.customersTrend.map((d) => d.month), labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                      yaxis: { labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    }}
                    series={[{ name: 'Customers', data: data.charts.customersTrend.map((d) => d.count) }]}
                    type="line"
                    height="240"
                  />
                )}
              </div>
            </Panel>
          </motion.div>

          {/* Conversion Funnel */}
          <motion.div variants={itemVariants}>
            <Panel title="Conversion Funnel" subtitle="Lead-to-customer conversion" icon={TrendingUp} accent="#10B981">
              <div>
                {data.funnel && Object.keys(data.funnel).length > 0 ? (
                  <Chart
                    options={{
                      ...chartTheme,
                      chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
                      plotOptions: { bar: { horizontal: true, borderRadius: 6, distributed: true } },
                      colors: ['#8B5CF6', '#A855F7', '#3B82F6', '#F59E0B', '#10B981'],
                      xaxis: { categories: Object.keys(data.funnel), labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                      yaxis: { labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                      dataLabels: { enabled: true, style: { colors: [textSecondary] } },
                    }}
                    series={[{ name: 'Leads', data: Object.values(data.funnel) }]}
                    type="bar"
                    height="240"
                  />
                ) : (
                  <StatusState compact type="empty" title="No funnel data" message="Conversion data will appear as your pipeline grows." />
                )}
              </div>
            </Panel>
          </motion.div>

          {/* Activity Heatmap */}
          <motion.div variants={itemVariants}>
            <Panel title="Activity Heatmap" subtitle="When things happen" icon={Activity} accent="#8B5CF6">
              <div>
                <div className="overflow-x-auto">
                  <div className="min-w-[580px]">
                    <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-[1px] text-[10px] text-text-tertiary">
                      <div />
                      {HOURS.filter((h) => h % 3 === 0).map((h) => (
                        <div key={h} className="text-center">{h}:00</div>
                      ))}
                      {DAYS.map((day, dayIdx) => (
                        <React.Fragment key={day}>
                          <div className="flex items-center text-right pr-2">{day}</div>
                          {HOURS.map((hour) => {
                            const value = data.heatmap?.[dayIdx]?.[hour] || 0;
                            const intensity = value / maxHeat;
                            const colorIdx = Math.min(4, Math.floor(intensity * 5));
                            return (
                              <div
                                key={hour}
                                role="img"
                                aria-label={`${day} ${hour}:00 — ${value} activities`}
                                className="h-5 rounded-sm"
                                style={{ backgroundColor: heatmapColors[colorIdx] }}
                                title={`${day} ${hour}:00 — ${value} activities`}
                              />
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default Analytics;
