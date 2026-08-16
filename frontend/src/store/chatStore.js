// frontend/src/store/chatStore.js
// Zustand store for team chat — conversations, real-time messages, typing indicators and read receipts.
// Real-time events (chat:message, chat:typing, chat:read) are wired to the shared Socket.io instance.
// Used in: pages/Chat.jsx.

import { create } from 'zustand';
import api from '../api/axios';
import { useAuthStore } from './authStore';

let registeredHandlers = null;

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  messagePagination: { totalItems: 0, totalPages: 0, currentPage: 1, limit: 30 },
  unreadByConversation: {},
  typingUsers: {}, // conversationId -> { userId: name }
  loadingConversations: false,
  loadingMessages: false,
  sending: false,
  error: null,

  // (Re)attaches Socket.io listeners for chat events. Called on socket (re)connection.
  init: (socket) => {
    if (registeredHandlers) {
      registeredHandlers.off();
      registeredHandlers = null;
    }
    if (!socket) return;

    const onMessage = (msg) => {
      const state = get();
      // Append/dedupe into the active thread.
      if (state.activeId === msg.conversation_id) {
        if (!state.messages.some((m) => m.id === msg.id)) {
          set({ messages: [...state.messages, msg] });
        }
      } else {
        // Bump unread for inactive conversations.
        const current = state.unreadByConversation[msg.conversation_id] || 0;
        set({ unreadByConversation: { ...state.unreadByConversation, [msg.conversation_id]: current + 1 } });
      }
      // Refresh the conversation list ordering + last message preview.
      get().refreshConversationPreview(msg);
    };

    const onTyping = (data) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [data.conversationId]: data.isTyping
            ? { ...(state.typingUsers[data.conversationId] || {}), [data.userId]: data.name }
            : removeKey(state.typingUsers[data.conversationId], data.userId),
        },
      }));
    };

    const onRead = (data) => {
      set((state) => {
        if (state.activeId !== data.conversationId) return state;
        return {
          messages: state.messages.map((m) =>
            m.sender_id !== data.userId ? m : { ...m, is_read: true }
          ),
        };
      });
    };

    const handlerMap = { 'chat:message': onMessage, 'chat:typing': onTyping, 'chat:read': onRead };
    Object.entries(handlerMap).forEach(([event, handler]) => socket.on(event, handler));

    registeredHandlers = { off: () => Object.entries(handlerMap).forEach(([event, handler]) => socket.off(event, handler)) };
  },

  // Fetches the current user's conversations.
  fetchConversations: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const response = await api.get('/chat/conversations');
      set({ conversations: response.data.conversations, loadingConversations: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load conversations.', loadingConversations: false });
    }
  },

  // Opens a conversation: joins the socket room, fetches history, and marks it read.
  openConversation: async (id) => {
    set({ activeId: id, loadingMessages: true });
    const socket = useAuthStore.getState().socketInstance;
    if (socket) socket.emit('chat:join', { conversationId: id });

    try {
      const response = await api.get(`/chat/conversations/${id}/messages?page=1&limit=50`);
      set({ messages: response.data.messages, messagePagination: response.data.pagination, loadingMessages: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load messages.', loadingMessages: false });
    }

    get().markRead(id);
    get().clearUnread(id);
  },

  // Sends a message via Socket.io (falls back to REST if the socket is not connected).
  sendMessage: async (content) => {
    const trimmed = (content || '').trim();
    const { activeId } = get();
    if (!trimmed || !activeId) return;

    const socket = useAuthStore.getState().socketInstance;
    set({ sending: true });
    try {
      if (socket && socket.connected) {
        socket.emit('chat:message', { conversationId: activeId, content: trimmed }, (ack) => {
          if (ack?.ok) {
            set((state) => {
              const exists = state.messages.some((m) => m.id === ack.message.id);
              return {
                messages: exists ? state.messages : [...state.messages, ack.message],
                sending: false,
              };
            });
            get().refreshConversationPreview(ack.message);
          } else {
            set({ sending: false, error: ack?.message || 'Failed to send message.' });
          }
        });
      } else {
        const response = await api.post(`/chat/conversations/${activeId}/messages`, { content: trimmed });
        set({ messages: [...get().messages, response.data.message], sending: false });
        get().refreshConversationPreview(response.data.message);
      }
    } catch (error) {
      set({ sending: false, error: error.response?.data?.message || 'Failed to send message.' });
    }
  },

  // Marks a conversation's messages as read over the socket.
  markRead: (id) => {
    const socket = useAuthStore.getState().socketInstance;
    if (socket && socket.connected) socket.emit('chat:read', { conversationId: id });
    else api.post(`/chat/conversations/${id}/read`).catch(() => {});
  },

  // Emits the typing indicator for the active conversation.
  emitTyping: (isTyping) => {
    const { activeId } = get();
    const socket = useAuthStore.getState().socketInstance;
    if (socket && socket.connected && activeId) {
      socket.emit('chat:typing', { conversationId: activeId, isTyping });
    }
  },

  clearUnread: (id) => {
    set((state) => {
      if (!(state.unreadByConversation[id])) return state;
      const next = { ...state.unreadByConversation };
      delete next[id];
      return { unreadByConversation: next };
    });
  },

  // Moves the updated conversation to the top and refreshes its preview.
  refreshConversationPreview: (message) => {
    set((state) => {
      const target = state.conversations.find((c) => c.id === message.conversation_id);
      const updated = target
        ? { ...target, lastMessage: message, createdAt: message.createdAt }
        : target;
      const rest = state.conversations.filter((c) => c.id !== message.conversation_id);
      return { conversations: updated ? [updated, ...rest] : state.conversations };
    });
  },
}));

// Removes a key from an object without mutating the source.
function removeKey(obj, key) {
  if (!obj) return undefined;
  const next = { ...obj };
  delete next[key];
  return Object.keys(next).length ? next : undefined;
}
