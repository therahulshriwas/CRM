// frontend/src/components/dashboard/widgets/RevenueAreaChart.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// Revenue area chart for the dashboard — real 6-month won-deal timeline.
// Theme-aware (dark/light) with glassmorphic tooltips + glowing area gradient.
// =============================================================================

import React from 'react';
import Chart from '../../common/ApexChart';
import { useThemeStore } from '../../../store/themeStore';

function RevenueAreaChart({ data = [] }) {
  const mode = useThemeStore((s) => s.mode);
  const isDark = mode === 'dark';
  const textSecondary = isDark ? '#B7B8C5' : '#605A76';
  const tooltipValue = isDark ? '#FFFFFF' : '#181428';

  const categories = data.map((d) => d.month);
  const seriesData = data.map((d) => d.revenue);

  const chartOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      parentHeightOffset: 0,
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
      },
    },
    stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.6,
        gradientToColors: [isDark ? '#A855F7' : '#8B5CF6'],
        opacityFrom: 0.38,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    colors: [isDark ? '#7C3AED' : '#6D31D9'],
    grid: {
      borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(20,16,40,0.08)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: textSecondary, fontSize: '11px' } },
    },
    yaxis: {
      labels: {
        style: { colors: textSecondary, fontSize: '11px' },
        formatter: (val) => `$${(val / 1000).toFixed(0)}k`,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        return `
          <div class="glass p-3 rounded-xl border border-overlay/10 shadow-2xl flex flex-col gap-0.5 select-none text-left">
            <span class="text-[9px] uppercase tracking-wider font-semibold" style="color:${textSecondary}">${w.globals.categoryHeaders[dataPointIndex]} Revenue</span>
            <span class="text-sm font-bold" style="color:${tooltipValue}">$${value.toLocaleString()}</span>
          </div>
        `;
      },
    },
    markers: {
      size: 4,
      colors: [isDark ? '#7C3AED' : '#6D31D9'],
      strokeColors: isDark ? '#06040B' : '#FFFFFF',
      strokeWidth: 2,
      hover: { size: 6 },
    },
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '260px' }}>
      <Chart
        options={chartOptions}
        series={[{ name: 'Revenue', data: seriesData }]}
        type="area"
        height="100%"
        width="100%"
      />
    </div>
  );
}

export default RevenueAreaChart;
