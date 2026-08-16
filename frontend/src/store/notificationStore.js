// frontend/src/store/notificationStore.js
// Zustand store for in-app notifications — history, unread badge count, and live notification:new events.
// Used in: components/layout/Topbar.jsx.

import { create } from 'zustand';
import api from '../api/axios';

let notificationHandler = null;

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Attaches a live listener for the notification:new socket event.
  init: (socket) => {
    if (notificationHandler) {
      socket?.off('notification:new', notificationHandler);
      notificationHandler = null;
    }
    if (!socket) return;

    notificationHandler = (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    };
    socket.on('notification:new', notificationHandler);
  },

  // Fetches the latest notifications (newest first).
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/notifications?page=1&limit=20');
      set({ notifications: response.data.notifications, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load notifications.', loading: false });
    }
  },

  // Fetches the unread count badge.
  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      set({ unreadCount: response.data.unreadCount });
    } catch {
    }
  },

  // Marks a single notification as read and updates the badge.
  markRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(state.unreadCount - 1, 0),
      }));
    } catch {
    }
  },

  // Marks all notifications as read.
  markAllRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
    }
  },
}));
