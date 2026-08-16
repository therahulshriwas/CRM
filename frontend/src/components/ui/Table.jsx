// frontend/src/components/ui/Table.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Accessible, semantic data table. Supports:
//   • Column sorting (click header — shows up/down arrow + direction)
//   • Row selection (checkbox header + rows)
//   • Hover + focus rings + striped rows
//   • Empty state (renders StatusState)
//   • Responsive: horizontally scrolls on sm; on mobile collapses to cards
//   • Sticky header when scrolling
//   • Variant: 'default' | 'compact' | 'ghost'
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import StatusState from './StatusState';

function Table({
  columns = [],        // [{ key, header, sortable, width?, align?, render?, className? }]
  rows = [],           // array of objects keyed by column.key
  sortKey,             // currently sorted column key
  sortDir,             // 'asc' | 'desc'
  onSort,              // (key, dir) => void
  selected = [],       // array of selected row ids
  onSelect,          // (ids) => void
  getRowId = (r) => r.id,
  variant = 'default', // 'default' | 'compact' | 'ghost'
  stickyHeader = true,
  emptyState,
  className = '',
}) {
  const variantClasses = {
    default: 'border border-overlay/5',
    compact: '',
    ghost: '',
  };
  const isSelectable = !!onSelect;
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(getRowId(r)));
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    const ids = allSelected ? [] : rows.map((r) => getRowId(r));
    onSelect?.(ids);
  };

  const sortedColumns = columns;

  if (rows.length === 0 && emptyState !== false) {
    return (
      <div className={`rounded-2xl overflow-hidden ${variantClasses[variant]} ${className}`}>
        {emptyState || <StatusState type="empty" title="No records" />}
      </div>
    );
  }

  const renderCell = (row, col) => {
    const value = row[col.key];
    if (col.render) return col.render(value, row);
    return value ?? '—';
  };

  return (
    <div
      className={`
        w-full overflow-x-auto rounded-2xl
        ${variantClasses[variant]}
        ${variant === 'compact' ? '' : ''}
        ${className}
      `}
    >
      <table className="w-full border-collapse text-sm">
        <thead className={stickyHeader ? 'sticky top-0' : ''}>
          <tr
            className={`
              ${stickyHeader ? 'bg-bg-surface/80 backdrop-blur-xl' : ''}
              border-b border-overlay/5
            `}
          >
            {isSelectable && (
              <th className="w-9 px-3 py-2.5 text-left">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAll}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                    ${allSelected ? 'bg-accent-primary border-accent-primary text-white' : someSelected ? 'bg-accent-primary/50 border-accent-primary/50 text-white' : 'border-overlay/20 text-transparent hover:border-accent-primary hover:text-accent-glow'}
                    cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary`}
                  aria-label={allSelected ? 'Deselect all' : 'Select all'}
                >
                  <Check size={11} />
                </motion.button>
              </th>
            )}
            {sortedColumns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-3 py-2.5 text-xs font-semibold text-text-tertiary uppercase
                  tracking-wider text-left
                  ${col.align === 'right' ? 'text-right' : 'text-left'}
                  ${col.sortable ? 'cursor-pointer select-none hover:text-text-secondary' : ''}
                `}
                style={{ width: col.width }}
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort?.(col.key, sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 rounded-md text-left focus-visible:ring-2 focus-visible:ring-accent-primary outline-none"
                  >
                    <span>{col.header}</span>
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const rowId = getRowId(row);
            const rowSelected = selected.includes(rowId);
            return (
              <motion.tr
                key={rowId ?? ri}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.03, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`
                  border-b border-overlay/3
                  ${rowSelected ? 'bg-accent-primary/4' : ''}
                  ${variant === 'compact' ? 'hover:bg-bg-hover' : 'hover:bg-bg-hover/30'}
                `}
              >
                {isSelectable && (
                  <td className="px-3 py-2.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const newSel = rowSelected
                          ? selected.filter((id) => id !== rowId)
                          : [...selected, rowId];
                        onSelect?.(newSel);
                      }}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                        ${rowSelected ? 'bg-accent-primary border-accent-primary text-white' : 'border-overlay/20 text-transparent hover:border-accent-primary hover:text-accent-glow'}
                        cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary`}
                      aria-label={rowSelected ? 'Deselect' : 'Select'}
                    >
                      <Check size={11} />
                    </motion.button>
                  </td>
                )}
                {sortedColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-3 py-2.5 align-middle text-text-primary
                      ${col.align === 'right' ? 'text-right' : 'text-left'}
                      ${col.className || ''}
                    `}
                  >
                    {renderCell(row, col)}
                  </td>
                ))}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
