// frontend/src/store/authStore.js
// Zustand state manager for user authentication. Handles registration, login, logout, profile checks, and Socket.io life-cycles.
// Used in: Pages (Login, Register, Dashboard) and Axios interceptors.

import { create } from 'zustand';
import axios from 'axios';
import io from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// Global socket reference
export let socket = null;

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: false,
  loading: false,
  error: null,
  socketConnected: false,
  socketInstance: socket,

  // Connects Socket.io client using the JWT token. If a socket already exists,
  // just updates its auth payload and reconnects when it is disconnected.
  connectSocket: (token) => {
    if (socket) {
      socket.auth = { token };
      if (socket.disconnected) {
        socket.connect();
      }
      set({ socketInstance: socket });
      return;
    }

    socket = io(socketURL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    set({ socketInstance: socket });

    socket.on('connect', () => {
      set({ socketConnected: true });
    });

    socket.on('disconnect', () => {
      set({ socketConnected: false });
    });

    socket.on('connect_error', async () => {
      set({ socketConnected: false });
      // The access token may have expired (server rejects socket auth). Refresh
      // it and reconnect so live chat/dashboard features keep working.
      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = refreshResponse.data;
        set({ accessToken, isAuthenticated: true });
        socket.auth = { token: accessToken };
        socket.connect();
      } catch {
        // Refresh failed — the session is gone; the axios interceptor handles logout.
      }
    });
  },

  // Disconnects Socket.io client
  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      set({ socketConnected: false, socketInstance: null });
    }
  },

  // Action to set the access token and (re)connect the socket without dropping
  // an already-connected socket during background refreshes.
  setAccessToken: (token) => {
    if (token) {
      set({ accessToken: token, isAuthenticated: true });
      if (socket) {
        socket.auth = { token };
        if (socket.disconnected) {
          socket.connect();
        }
      } else {
        get().connectSocket(token);
      }
    } else {
      set({ accessToken: null, isAuthenticated: false });
      get().disconnectSocket();
    }
  },

  // Action to register a new user
  register: async (name, email, password, role, extra = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${baseURL}/auth/register`,
        { name, email, password, role, ...extra },
        { withCredentials: true }
      );

      const { accessToken, user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));

      set({
        accessToken,
        user,
        isAuthenticated: true,
        loading: false,
      });

       get().connectSocket(accessToken);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Action to log in user. `remember` keeps the session for 7 days instead of 1.
  login: async (email, password, remember = false) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(
        `${baseURL}/auth/login`,
        { email, password, remember },
        { withCredentials: true }
      );

      const { accessToken, user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));

      set({
        accessToken,
        user,
        isAuthenticated: true,
        loading: false,
      });

      get().connectSocket(accessToken);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed.';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // Persists editable profile fields and refreshes the local session user.
  updateProfile: async (profile) => {
    const token = get().accessToken;
    try {
      const response = await axios.put(`${baseURL}/users/me`, profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Profile update failed.' };
    }
  },

  // Uploads a new avatar image for the signed-in user and refreshes the session.
  uploadAvatar: async (file) => {
    const token = get().accessToken;
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await axios.post(`${baseURL}/uploads/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Avatar upload failed.' };
    }
  },

  // Removes the signed-in user's avatar entirely and refreshes the session.
  removeAvatar: async () => {
    const token = get().accessToken;
    try {
      const response = await axios.delete(`${baseURL}/uploads/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Avatar removal failed.' };
    }
  },

  // Action to log out user
  logout: async () => {
    const token = get().accessToken;
    set({ loading: true });
    try {
      if (token) {
        await axios.post(`${baseURL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
      }
    } catch {
    } finally {
       localStorage.removeItem('user');
      get().disconnectSocket();
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  },

  // Action to fetch and check if user profile is authenticated on app mount
  checkAuth: async () => {
    set({ loading: true });
    try {
      let token = get().accessToken;
      if (!token) {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        token = refreshResponse.data.accessToken;
      }
      const response = await axios.get(`${baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false });
      set({ accessToken: token });
      get().connectSocket(token);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('user');
        get().disconnectSocket();
        set({ accessToken: null, user: null, isAuthenticated: false, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },
}));
