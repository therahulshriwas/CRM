// frontend/src/pages/Notifications.jsx
// Notifications module — full history of in-app notifications from GET /api/notifications, with
// live socket updates (notification:new), mark-read + mark-all-read, and unread badge.
// Used in: App.jsx /notifications route.

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, RefreshCw, AlertCircle, CheckCircle, Info, AlertTriangle, GitBranch, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import StatusState from '../components/ui/StatusState';
import { pageVariants, itemVariants } from '../animations/variants';
import { formatRelativeTime } from '../utils/format';

const notificationIcons = {
  message: Bell,
  deal: GitBranch,
  reminder: AlertCircle,
  task: CheckCircle,
  general: Info,
  warning: AlertTriangle,
  profile: User,
};

function Notifications() {
  const { socketInstance: socket } = useAuthStore();
  const { notifications, loading, error, fetchNotifications, fetchUnreadCount, markRead, markAllRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    if (socket) {
      useNotificationStore.getState().init(socket);
    }
  }, [fetchNotifications, fetchUnreadCount, socket]);

  const handleMarkAllRead = async () => {
    await markAllRead();
    fetchUnreadCount();
  };

  const unreadCount_local = notifications.filter((n) => !n.read).length;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        icon={Bell}
        subtitle="Stay updated with everything happening in your workspace."
        badge="Live"
        accent="#8B5CF6"
        actions={
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => { fetchNotifications(); fetchUnreadCount(); }}>
              <RefreshCw size={14} />
            </Button>
            {unreadCount_local > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck size={14} />
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {/* Summary bar */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <div className="glass-deep rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-primary/10">
            <Bell size={18} className="text-accent-glow" />
          </div>
          <div>
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Unread</span>
            <span className="text-xl font-display font-bold text-text-primary block">{unreadCount_local}</span>
          </div>
        </div>
        <div className="glass-deep rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-success/10">
            <CheckCheck size={18} className="text-success" />
          </div>
          <div>
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Read</span>
            <span className="text-xl font-display font-bold text-text-primary block">
              {notifications.filter((n) => n.read).length}
            </span>
          </div>
        </div>
        <div className="glass-deep rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-info/10">
            <Bell size={18} className="text-info" />
          </div>
          <div>
            <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Total</span>
            <span className="text-xl font-display font-bold text-text-primary block">{notifications.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Notifications list */}
      <Panel title="Recent Notifications" subtitle="All notification history" icon={Bell} accent="#8B5CF6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : error ? (
          <div>
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div>
            <StatusState type="empty" title="All caught up" message="You have no notifications yet. New ones will appear here." />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="divide-y divide-overlay/5"
          >
            {notifications.map((notification, i) => {
              const Icon = notificationIcons[notification.type] || notificationIcons.general;
              const isUnread = !notification.read;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className={`
                    flex items-start gap-3 p-4 transition-all
                    ${isUnread ? 'bg-accent-primary/4 border-l-2 border-accent-primary' : 'hover:bg-overlay/3'}
                  `}
                >
                  <div className={`
                    p-2 rounded-xl shrink-0
                    ${isUnread ? 'bg-accent-primary/14' : 'bg-overlay/5'}
                  `}>
                    <Icon size={16} className={isUnread ? 'text-accent-glow' : 'text-text-tertiary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isUnread ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {notification.title}
                      </span>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shadow-[0_0_6px_rgba(124,58,237,0.6)] shrink-0" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-xs text-text-secondary/70 mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-tertiary">
                      <span>{formatRelativeTime(notification.createdAt || notification.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize">{notification.type}</span>
                    </div>
                  </div>
                  {isUnread && (
                    <Button variant="ghost" size="sm" title="Mark as read" onClick={() => markRead(notification.id)}>
                      <CheckCheck size={12} className="text-text-tertiary" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Panel>
    </motion.div>
  );
}

export default Notifications;
