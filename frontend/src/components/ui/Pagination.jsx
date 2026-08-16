// frontend/src/components/ui/Pagination.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible pagination: prev/next, page numbers (with ellipsis for gaps),
// keyboard: arrow keys + Enter/Space, first/last.
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function Pagination({
  current = 1,
  perPage = 10,
  totalItems = 0,
  onChange,
  maxSize = 5,      // max page buttons shown
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrent = Math.max(1, Math.min(totalPages, current));
  const hasPrev = safeCurrent > 1;
  const hasNext = safeCurrent < totalPages;

  // Build the visible pages array (with ellipsis placeholder)
  const pages = [];
  if (totalPages <= maxSize) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxSize / 2);
    let start = Math.max(1, safeCurrent - half);
    let end = Math.min(totalPages, safeCurrent + half);
    if (start === 1) end = Math.min(maxSize, totalPages);
    if (end === totalPages) start = Math.max(totalPages - maxSize + 1, 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (start > 2) pages.unshift('…');
    if (end < totalPages - 1) pages.push('…');
    if (!pages.includes(1)) pages.unshift(1);
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  const go = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    onChange?.(p);
  };

  const PageButton = ({ page, isActive = false, isEllipsis = false }) =>
    isEllipsis ? (
      <span className="px-2 py-1 text-xs text-text-tertiary/60">…</span>
    ) : (
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => go(page)}
        aria-current={isActive ? 'page' : undefined}
        className={`
          px-2.5 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 cursor-pointer outline-none
          ${isActive
            ? 'bg-accent-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}
        `}
      >
        {page}
      </motion.button>
    );

  return (
    <div
      role="navigation"
      aria-label="Pagination"
      className={`
        flex items-center justify-center gap-1
        text-xs
        ${className}
      `}
    >
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => go(1)}
        disabled={!hasPrev}
        aria-label="First page"
        className={`
          p-1.5 rounded-lg text-text-tertiary
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:text-text-primary hover:bg-bg-hover
          transition-all cursor-pointer outline-none
          focus-visible:ring-2 focus-visible:ring-accent-primary
        `}
      >
        <ChevronsLeft size={13} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => go(safeCurrent - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
        className={`
          p-1.5 rounded-lg text-text-tertiary
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:text-text-primary hover:bg-bg-hover
          transition-all cursor-pointer outline-none
          focus-visible:ring-2 focus-visible:ring-accent-primary
        `}
      >
        <ChevronLeft size={13} />
      </motion.button>
      {pages.map((page, i) =>
        page === '…' ? (
          <span key={`e-${i}`} className="px-1 py-1 text-text-tertiary/50">…</span>
        ) : (
          <PageButton
            key={page}
            page={page}
            isActive={page === safeCurrent}
          />
        )
      )}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => go(safeCurrent + 1)}
        disabled={!hasNext}
        aria-label="Next page"
        className={`
          p-1.5 rounded-lg text-text-tertiary
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:text-text-primary hover:bg-bg-hover
          transition-all cursor-pointer outline-none
          focus-visible:ring-2 focus-visible:ring-accent-primary
        `}
      >
        <ChevronRight size={13} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => go(totalPages)}
        disabled={!hasNext}
        aria-label="Last page"
        className={`
          p-1.5 rounded-lg text-text-tertiary
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:text-text-primary hover:bg-bg-hover
          transition-all cursor-pointer outline-none
          focus-visible:ring-2 focus-visible:ring-accent-primary
        `}
      >
        <ChevronsRight size={13} />
      </motion.button>
    </div>
  );
}

export default Pagination;
