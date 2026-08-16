// frontend/src/components/ui/Skeleton.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Pure skeleton loaders: shimmer bars / circles. Wraps the `.shimmer` CSS
// primitive so loading surfaces stay on-brand. Used inside StatusState
// (loading type) and inline in data tables / cards that have known structure.
// =============================================================================

import React from 'react';

function Skeleton({
  type = 'rect',  // 'rect' | 'circle' | 'text'
  width,
  height,
  className = '',
  count = 1,
}) {
  const base = 'shimmer rounded pointer-events-none';
  const typeCls = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded',
  };

  const items = [];
  for (let i = 0; i < count; i++) {
    const isText = type === 'text';
    let w = width;
    if (isText && !w) w = `${Math.floor(Math.random() * 40) + 60}%`;
    items.push(
      <div
        key={i}
        className={`${base} ${typeCls[type]} ${className}`}
        style={{
          width: w,
          height: height || (isText ? 14 : 16),
          animationDelay: `${i * 0.12}s`,
        }}
      />
    );
  }
  return <>{items}</>;
}

export default Skeleton;
