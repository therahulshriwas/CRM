// frontend/src/components/dashboard/rightPanel/LiveActivityFeed.jsx
// Displays a scrolling list of recent system and agent activities with status-colored indicators.
// Used in: Dashboard persistent right panel.

import React from 'react';
import { Sparkles, GitBranch, DollarSign, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/format';

function LiveActivityFeed({ activities = [] }) {

  // Maps activity type to Lucide icons and categorical color markers
  const getActivityMeta = (type, notes = '') => {
    switch (type) {
      case 'deal_created':
        return {
          icon: Sparkles,
          iconColor: '#A855F7', // accent-highlight (purple)
          dotColor: 'bg-accent-highlight',
          title: 'New Deal Created',
        };
      case 'stage_change':
        const isWon = notes.toLowerCase().includes('won');
        const isLost = notes.toLowerCase().includes('lost');
        return {
          icon: GitBranch,
          iconColor: isWon ? '#10B981' : isLost ? '#F43F5E' : '#F59E0B',
          dotColor: isWon ? 'bg-success' : isLost ? 'bg-danger' : 'bg-warning',
          title: isWon ? 'Deal Closed Won 🎉' : 'Deal Stage Progress',
        };
      case 'payment':
        return {
          icon: DollarSign,
          iconColor: '#10B981', // success (green)
          dotColor: 'bg-success',
          title: 'Payment Received',
        };
      case 'task':
        return {
          icon: CheckCircle2,
          iconColor: '#3B82F6', // info (blue)
          dotColor: 'bg-info',
          title: 'Task Completed',
        };
      default:
        return {
          icon: MessageSquare,
          iconColor: '#B7B8C5',
          dotColor: 'bg-text-secondary/40',
          title: 'Agent Note Added',
        };
    }
  };

  return (
    <div className="flex flex-col gap-4 select-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-text-secondary/40 font-bold uppercase tracking-wider">Live Activity</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-overlay/5 rounded-xl bg-overlay/2 h-[120px]">
          <span className="text-xs text-text-secondary">No recent events.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {activities.map((activity) => {
            const meta = getActivityMeta(activity.type, activity.notes);
            const Icon = meta.icon;
            
            return (
              <div key={activity.id} className="flex gap-3 p-3 rounded-xl hover:bg-overlay/2 transition-colors border border-overlay/5 bg-bg-surface/50">
                {/* Colored Icon box */}
                <div className="flex flex-col items-center justify-start mt-0.5">
                  <div className="p-2 rounded-lg bg-bg-card flex items-center justify-center border border-overlay/5 relative">
                    <Icon size={14} color={meta.iconColor} />
                    <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-bg-secondary ${meta.dotColor}`} />
                  </div>
                </div>

                {/* Details text */}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0 select-text">
                  <span className="text-text-primary text-xs font-semibold">{meta.title}</span>
                  <span className="text-[11px] text-text-secondary line-clamp-2 leading-normal">
                    {activity.notes}
                  </span>
                  <span className="text-[9px] text-text-secondary/50 font-medium mt-1">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LiveActivityFeed;
