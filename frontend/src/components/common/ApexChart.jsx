// frontend/src/components/common/ApexChart.jsx
// Lazy ApexCharts boundary shared by analytics surfaces so chart code never blocks the app shell.
// Used in: Dashboard widgets, Analytics, Reports, and StatCard sparklines.

import React, { lazy, Suspense } from 'react';

const ApexChart = lazy(() => import('react-apexcharts'));

function ApexChartBoundary(props) {
  return (
    <Suspense fallback={<div className="h-48 w-full rounded-xl shimmer" aria-label="Loading chart" />}>
      <ApexChart {...props} />
    </Suspense>
  );
}

export default ApexChartBoundary;
