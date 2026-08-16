// frontend/src/pages/Reports.jsx
// Reports & Analytics page — Phase 4 feature with heatmap, conversion funnel, lead source trends, and deal velocity.
// All data is role-scoped and fetched from /api/reports.
// Used in: App.jsx /reports route.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { itemVariants } from '../animations/variants';
import Chart from '../components/common/ApexChart';
import { useThemeStore } from '../store/themeStore';
import { Activity, TrendingUp, Users, Zap, BarChart3 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === 'dark';
  const textSecondary = isDark ? '#B7B8C5' : '#605A76';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.get('/reports')
      .then((response) => active && setData(response.data))
      .catch((err) => active && setError(err.response?.data?.message || 'Failed to load reports.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [retryKey]);

  const maxHeat = Array.isArray(data?.heatmap)
    ? data.heatmap.flat().reduce((max, val) => Math.max(max, val), 0) || 1
    : 1;

  return (
    <motion.div variants={itemVariants} initial="initial" animate="animate" className="flex flex-col gap-6">
      <PageHeader
        title="Reports & Analytics"
        icon={BarChart3}
        subtitle="Deep-dive analytics across your sales pipeline."
        badge="Analytics"
        accent="#F59E0B"
      />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-bg-surface border border-overlay/5 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-danger/20 bg-danger/5 text-sm text-danger flex items-center justify-between gap-4">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary border border-danger/20 hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activity Heatmap */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Panel accent="#8B5CF6" lift={false}>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-accent-glow" />
                <h3 className="text-text-primary font-display font-semibold">Activity Heatmap</h3>
                <span className="text-[10px] text-text-secondary/60">Day vs Hour</span>
              </div>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1 text-[10px] text-text-secondary/50">
                  <div />
                  {HOURS.map((h) => (
                    <div key={h} className="text-center">{h}</div>
                  ))}
                  {DAYS.map((day, dayIdx) => (
                    <React.Fragment key={day}>
                      <div className="flex items-center text-right pr-2">{day}</div>
                      {HOURS.map((hour) => {
                        const value = data.heatmap?.[dayIdx]?.[hour] || 0;
                        const intensity = value / maxHeat;
                        return (
                          <div
                            key={hour}
                            className="h-6 rounded-sm"
                            style={{
                              backgroundColor: intensity === 0
                                ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(20,16,40,0.03)')
                                : `rgba(124,58,237,${0.15 + intensity * 0.85})`,
                            }}
                            title={`${day} ${hour}:00 — ${value} activities`}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            </Panel>
          </motion.div>

          {/* Conversion Funnel */}
          <motion.div variants={itemVariants}>
            <Panel accent="#10B981" lift={false}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-success" />
                <h3 className="text-text-primary font-display font-semibold">Conversion Funnel</h3>
              </div>
            {(() => {
              const funnel = data.funnel || {};
              const labels = Object.keys(funnel);
              const series = Object.values(funnel);
              return (
                <Chart
                  options={{
                    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                    plotOptions: { bar: { borderRadius: 6, horizontal: true } },
                    xaxis: { categories: labels, labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    yaxis: { labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    colors: ['#7C3AED'],
                    dataLabels: { enabled: false },
                    grid: { borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(20,16,40,0.08)' },
                    tooltip: { theme: isDark ? 'dark' : 'light' },
                  }}
                  series={[{ name: 'Leads', data: series }]}
                  type="bar"
                  height="280"
                />
              );
            })()}
            </Panel>
          </motion.div>

          {/* Lead Source Trend */}
          <motion.div variants={itemVariants}>
            <Panel accent="#3B82F6" lift={false}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-info" />
                <h3 className="text-text-primary font-display font-semibold">Lead Source Trend</h3>
                <span className="text-[10px] text-text-secondary/60">Last 6 months</span>
              </div>
            {(() => {
              const sourceTrend = data.sourceTrend || [];
              const categories = sourceTrend.map((d) => d.month);
              const allSources = Array.from(
                new Set(sourceTrend.flatMap((d) => Object.keys(d.counts || {})))
              );
              const colors = ['#7C3AED', '#A855F7', '#3B82F6', '#F59E0B', '#6b7280'];
              const series = allSources.map((source, _idx) => ({
                name: source,
                data: sourceTrend.map((d) => d.counts?.[source] || 0),
              }));
              return (
                <Chart
                  options={{
                    chart: { type: 'line', background: 'transparent', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', animations: { enabled: true } },
                    stroke: { curve: 'smooth', width: 2 },
                    xaxis: { categories, labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    yaxis: { labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    colors: series.map((_, cidx) => colors[cidx % colors.length]),
                    dataLabels: { enabled: false },
                    grid: { borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(20,16,40,0.08)' },
                    legend: { labels: { colors: textSecondary } },
                    tooltip: { theme: isDark ? 'dark' : 'light' },
                  }}
                  series={series}
                  type="line"
                  height="280"
                />
              );
            })()}
            </Panel>
          </motion.div>

          {/* Deal Velocity */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Panel accent="#F59E0B" lift={false}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-warning" />
                <h3 className="text-text-primary font-display font-semibold">Deal Velocity</h3>
                <span className="text-[10px] text-text-secondary/60">Average days to close</span>
              </div>
            {(() => {
              const velocity = data.velocity || [];
              const categories = velocity.map((v) => v.stage);
              const seriesData = velocity.map((v) => v.avgDays);
              return (
                <Chart
                  options={{
                    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                    plotOptions: { bar: { borderRadius: 6, horizontal: false } },
                    xaxis: { categories, labels: { style: { colors: textSecondary, fontSize: '11px' } } },
                    yaxis: { labels: { style: { colors: textSecondary, fontSize: '11px' }, formatter: (val) => `${val}d` } },
                    colors: ['#F59E0B'],
                    dataLabels: { enabled: true, style: { colors: [textSecondary] } },
                    grid: { borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(20,16,40,0.08)' },
                    tooltip: { theme: isDark ? 'dark' : 'light' },
                  }}
                  series={[{ name: 'Avg Days', data: seriesData }]}
                  type="bar"
                  height="280"
                />
              );
            })()}
            </Panel>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default Reports;
