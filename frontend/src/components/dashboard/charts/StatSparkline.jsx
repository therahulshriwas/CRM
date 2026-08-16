// frontend/src/components/dashboard/charts/StatSparkline.jsx
// Lightweight sparkline area chart for embedding inside stat cards.
// Used in: components/common/StatCard.jsx

import React from 'react';
import Chart from '../../common/ApexChart';

function StatSparkline({ data = [], color = '#7C3AED' }) {
  const chartOptions = {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: true, speed: 400 },
      background: 'transparent',
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.25,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    colors: [color],
    tooltip: { enabled: false },
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="w-[100px] h-[40px]">
      <Chart
        options={chartOptions}
        series={[{ data }]}
        type="area"
        height="100%"
        width="100%"
      />
    </div>
  );
}

export default StatSparkline;
