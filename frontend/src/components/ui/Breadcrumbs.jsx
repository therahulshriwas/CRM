// frontend/src/components/ui/Breadcrumbs.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible breadcrumb navigation. Auto-truncates overflow on small screens.
// Items: BreadcrumbItem[] { label, href?, icon? }
// =============================================================================

import React from 'react';
import { ChevronRight } from 'lucide-react';

function Breadcrumbs({ items = [], className = '', maxItems = 3 }) {
  // If too many items, show: Home / …ellipsis / last 2
  let displayed = items;
  if (items.length > maxItems) {
    const first = items[0];
    const last = items.slice(-2);
    displayed = [first, { label: '…', ellipsis: true }, ...last];
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`
        flex items-center gap-1.5 text-xs
        text-text-tertiary
        ${className}
      `}
    >
      {displayed.map((item, i) => {
        const isLast = i === displayed.length - 1;
        const isEllipsis = !!item.ellipsis;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={11} className="text-text-tertiary/40" />}
            {isEllipsis ? (
              <span className="text-text-tertiary/60">…</span>
            ) : isLast ? (
              <span
                className={`
                  text-text-tertiary
                  ${isLast ? 'font-medium' : ''}
                `}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="hover:text-text-primary transition-colors text-text-secondary"
              >
                {item.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
