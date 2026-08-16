// frontend/src/components/common/StatCard.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0 — Executive Control Center
// -----------------------------------------------------------------------------
// KPI statistic card with glass-deep surface, animated count-up (or direct string
// value), trend pill, and embedded sparkline/ring.
//
// Props:
//   title, value (string | number), prefix, suffix,
//   icon, iconColor,
//   trend, isPercentage, isPositive  — trend pill + arrow,
//   chartData (sparkline series), chartValue (ring %),
//   showGrowthTip — hover reveals a micro-popover.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart from './ApexChart';
import { TrendingUp, TrendingDown } from 'lucide-react';
import StatSparkline from '../dashboard/charts/StatSparkline';

// Semantic name → CSS var lookup. Dashboard passes role names like `text-success`;
// these resolve to the theme vars so inline alpha styles, lucide icons, and
// ApexCharts all receive real, renderable colors.
const ROLE_COLOR_VARS = {
  'text-success': 'var(--c-success)',
  'text-info': 'var(--c-info)',
  'text-warning': 'var(--c-warning)',
  'text-danger': 'var(--c-danger)',
  'text-accent-primary': 'var(--c-accent-primary)',
  'text-accent-glow': 'var(--c-accent-glow)',
  'text-accent-highlight': 'var(--c-accent-highlight)',
  'text-accent-secondary-glow': 'var(--c-accent-secondary-glow)',
  'text-text-primary': 'var(--c-text-primary)',
  'text-text-secondary': 'var(--c-text-secondary)',
};

const DEFAULT_TRIPLET = '139 92 246';

// Resolve any accepted color input to a renderable CSS color.
function resolveColor(name) {
  return ROLE_COLOR_VARS[name] || name;
}

// Reduce a color to a `r g b` triplet for alpha-modulated inline styles.
// Handles var(--c-*) (read via getComputedStyle), hex, and rgb() strings.
function tripletFrom(name) {
  const color = resolveColor(name);
  if (!color) return DEFAULT_TRIPLET;

  const varMatch = color.match(/var\((--[^)]+)\)/);
  if (varMatch) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varMatch[1]).trim();
    if (value && !value.includes(';')) return value;
    return DEFAULT_TRIPLET;
  }

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (![r, g, b].some(Number.isNaN)) return `${r} ${g} ${b}`;
    }
    return DEFAULT_TRIPLET;
  }

  const rgbMatch = color.match(/(\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)/);
  if (rgbMatch) return `${rgbMatch[1]} ${rgbMatch[2]} ${rgbMatch[3]}`;

  return DEFAULT_TRIPLET;
}

// Lightweight count-up animator for numeric dashboard metrics.
function CountUp({ end, duration = 1200, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endVal = parseFloat(end) || 0;
    if (endVal === 0) { setCount(0); return; }
    const totalSteps = duration / 20;
    const stepIncrement = endVal / totalSteps;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const nextCount = stepIncrement * currentStep;
      if (currentStep >= totalSteps) { setCount(endVal); clearInterval(timer); }
      else { setCount(nextCount); }
    }, 20);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{prefix}{Number(count).toLocaleString(undefined, { maximumFractionDigits: count > 1000 ? 0 : 2 })}{suffix}</span>;
}

function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconColor = 'var(--c-accent-glow)',
  percentChange,
  isPercentage = false,
  isPositive,
  chartType = 'sparkline',
  chartData = [],
  chartValue = 70,
  showGrowthTip = false,
}) {
  const [showTip, setShowTip] = useState(false);

  // Normalize the icon color once so every consumer (lucide icon, ApexCharts
  // ring, sparkline) gets a real, renderable color.
  const colorVar = resolveColor(iconColor);
  const triplet = tripletFrom(iconColor);
  const solidColor = `rgb(${triplet})`;

  const radialOptions = {
    chart: { type: 'radialBar', sparkline: { enabled: true }, background: 'transparent' },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        track: { background: 'rgb(var(--c-text-secondary) / 0.12)', strokeWidth: '100%' },
        dataLabels: { show: false },
      },
    },
    colors: [solidColor],
    stroke: { lineCap: 'round' },
  };

  const displayValue =
    typeof value === 'string' ? value : (
      <CountUp end={value} prefix={prefix} suffix={suffix} />
    );

  const effectiveTrend = percentChange;
  const showTrend = effectiveTrend !== undefined && effectiveTrend !== null && !Number.isNaN(Number(effectiveTrend));

  const trendPositive = isPositive ?? Number(effectiveTrend) >= 0;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="glass-deep rounded-2xl p-5 flex flex-col justify-between h-[180px] min-w-[160px] relative overflow-hidden group"
      onMouseEnter={() => showGrowthTip && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">{title}</span>
          <h3 className="text-text-primary text-2xl font-display font-semibold">{displayValue}</h3>
        </div>
        {Icon && <Icon size={20} color={colorVar} />}
      </div>

      <div className="flex justify-between items-end mt-4 gap-2">
        {showTrend && (
          <motion.div
            className={`flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-lg select-none ${
              trendPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendPositive ? '+' : ''}{Number(effectiveTrend).toFixed(isPercentage ? 1 : 0)}%</span>
          </motion.div>
        )}
        {chartType === 'sparkline' && chartData.length > 0 && (
          <StatSparkline data={chartData} color={solidColor} />
        )}
        {chartType === 'ring' && (
          <div className="w-[45px] h-[45px] relative">
            <Chart options={radialOptions} series={[chartValue]} type="radialBar" height="100%" width="100%" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-primary">
              {chartValue}%
            </span>
          </div>
        )}
      </div>

      {/* Growth tip micro-popover */}
      {showGrowthTip && showTip && (
        <motion.div
          className="absolute -top-16 right-4 max-w-[180px] glass rounded-xl p-2 shadow-elevation-2"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
        >
          <p className="text-[9px] text-text-secondary leading-relaxed">
            This metric reflects real growth against the prior period.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default StatCard;
export { CountUp };
