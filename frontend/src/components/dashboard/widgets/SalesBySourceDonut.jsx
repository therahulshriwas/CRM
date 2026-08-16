// frontend/src/components/dashboard/widgets/SalesBySourceDonut.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Sales-by-source donut for the dashboard. Real lead-source distribution with a
// custom glowing legend. Theme-aware.
// =============================================================================

import React from 'react';
import Chart from '../../common/ApexChart';
import { useThemeStore } from '../../../store/themeStore';

const SOURCE_COLORS = ['#7C3AED', '#8B5CF6', '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E'];

function SalesBySourceDonut({ data = [] }) {
  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === 'dark';
  const textSecondary = isDark ? '#B7B8C5' : '#605A76';
  const textPrimary = isDark ? '#FFFFFF' : '#181428';

  const labels = data.map((d) => d.source);
  const series = data.map((d) => d.count);
  const total = series.reduce((a, b) => a + b, 0);

  const chartOptions = {
    chart: { type: 'donut', background: 'transparent', fontFamily: 'Inter, sans-serif' },
    labels,
    colors: SOURCE_COLORS,
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          background: 'transparent',
          labels: {
            show: true,
            name: { show: true, fontSize: '11px', color: textSecondary, offsetY: -4 },
            value: { show: true, fontSize: '22px', fontWeight: 600, color: textPrimary, offsetY: 8 },
            total: {
              show: true, label: 'Deals', color: textSecondary,
              formatter: () => total,
            },
          },
        },
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      custom: ({ series, seriesIndex }) => {
        const percent = total > 0 ? Math.round((series[seriesIndex] / total) * 100) : 0;
        return `
          <div class="glass p-2 px-3 rounded-xl border border-overlay/10 shadow-2xl">
            <span class="text-[9px] uppercase tracking-wider font-semibold" style="color:${textSecondary}">${labels[seriesIndex]} Deals</span>
            <span class="text-xs font-bold" style="color:${textPrimary}">${series[seriesIndex]} (${percent}%)</span>
          </div>
        `;
      },
    },
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-text-tertiary">
        No source data yet
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full h-[220px]">
      <div className="w-[160px] h-[160px] relative">
        <span className="absolute inset-0 halo rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)' }} />
        <Chart options={chartOptions} series={series} type="donut" height="100%" width="100%" />
      </div>
      <div className="flex flex-col gap-2.5 flex-1 pl-4 select-none">
        {data.map((item, idx) => (
          <div key={item.source} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }}
              />
              <span className="text-xs text-text-secondary">{item.source}</span>
            </div>
            <span className="text-xs font-bold text-text-primary tabular-nums">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SalesBySourceDonut;
