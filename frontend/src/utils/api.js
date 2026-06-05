import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    } else if (err.response?.status !== 404) {
      toast.error(message);
    }
    return Promise.reject(err);
  }
);

export default api;
export const authAPI = { register: (d) => api.post('/auth/register', d), login: (d) => api.post('/auth/login', d), getMe: () => api.get('/auth/me'), updateMe: (d) => api.patch('/auth/me', d), changePassword: (d) => api.patch('/auth/change-password', d) };
export const taskAPI = { create: (d) => api.post('/tasks', d), getAll: (p) => api.get('/tasks', { params: p }), getById: (id) => api.get(`/tasks/${id}`), getLogs: (id) => api.get(`/tasks/${id}/logs`), delete: (id) => api.delete(`/tasks/${id}`), retry: (id) => api.post(`/tasks/${id}/retry`) };
export const agentAPI = { getLogs: (p) => api.get('/agents/logs', { params: p }), getTypes: () => api.get('/agents/types') };
export const documentAPI = { upload: (f) => api.post('/documents/upload', f, { headers: { 'Content-Type': 'multipart/form-data' } }), getAll: () => api.get('/documents'), delete: (id) => api.delete(`/documents/${id}`), search: (d) => api.post('/documents/search', d) };
export const analyticsAPI = { getDashboard: () => api.get('/analytics/dashboard') };
