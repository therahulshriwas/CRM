// frontend/src/components/dashboard/RecentDealsTable.jsx
// Recent Deals data table shown on the Dashboard — deal name, customer, value, stage chip, owner and relative time.
// Used in: pages/Dashboard.jsx Row 4 (left column).

import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';
import { stageBadgeVariants } from '../../config/dealStages';
import { formatCurrency, formatRelativeTime } from '../../utils/format';
import { resolveMediaUrl } from '../../utils/media';

function RecentDealsTable({ deals = [] }) {
  const total = deals.length;

  return (
    <div className="glass-deep rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-text-primary font-display font-semibold">Recent Deals</h3>
          <span className="text-[10px] text-text-secondary/60 mt-0.5 block">
            Showing {Math.min(total, 5)} of {total} results
          </span>
        </div>
        <Link
          to="/app/deals"
          className="text-xs font-semibold text-accent-glow hover:text-accent-secondary-glow transition-colors"
        >
          View Pipeline →
        </Link>
      </div>

      {total === 0 ? (
        <EmptyState title="No deals yet" description="Deals you create will show up here." />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-overlay/5">
                {['Deal', 'Customer', 'Value', 'Stage', 'Owner', 'Last Activity'].map((col) => (
                  <th
                    key={col}
                    className="py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary/50 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.slice(0, 5).map((deal) => (
                <tr key={deal.id} className="border-b border-overlay/5 last:border-0 hover:bg-overlay/2 transition-colors">
                  <td className="py-3 px-2 text-xs font-semibold text-text-primary whitespace-nowrap max-w-[180px] truncate">
                    {deal.title}
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary whitespace-nowrap max-w-[160px] truncate">
                    {deal.lead?.name || '—'}
                  </td>
                  <td className="py-3 px-2 text-xs font-bold text-text-primary whitespace-nowrap">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="py-3 px-2">
                    <Badge label={deal.stage} variant={stageBadgeVariants[deal.stage] || 'secondary'} />
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={deal.owner?.name || 'U'} role={deal.owner?.role || 'agent'} size={24} src={resolveMediaUrl(deal.owner?.avatar_url)} />
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        {deal.owner?.name || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary/70 whitespace-nowrap">
                    {formatRelativeTime(deal.updatedAt || deal.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentDealsTable;
