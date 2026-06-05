import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, token: null, isLoading: false, isAuthenticated: false,
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('token', data.token);
          initSocket(data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true });
          return data;
        } finally { set({ isLoading: false }); }
      },
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.register(userData);
          localStorage.setItem('token', data.token);
          initSocket(data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true });
          return data;
        } finally { set({ isLoading: false }); }
      },
      logout: () => { localStorage.removeItem('token'); disconnectSocket(); set({ user: null, token: null, isAuthenticated: false }); },
      updateUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
      initAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
          const { data } = await authAPI.getMe();
          initSocket(token);
          set({ user: data.user, token, isAuthenticated: true });
        } catch { localStorage.removeItem('token'); set({ user: null, token: null, isAuthenticated: false }); }
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ token: s.token }) }
  )
);
