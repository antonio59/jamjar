import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const useStore = create((set, get) => ({
  // Auth state
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  // UI state
  currentPage: 'home',
  
  // Actions
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  },
  
  register: async (username, password, role, profile, displayName) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username, password, role, profile, displayName,
      });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  search: async (query, type) => {
    const { token } = get();
    if (!token) return [];
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { q: query, type },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },
  
  createRequest: async (data) => {
    const { token } = get();
    if (!token) throw new Error('Not authenticated');
    const response = await axios.post(`${API_URL}/requests`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  
  getRequests: async () => {
    const { token } = get();
    if (!token) return [];
    const response = await axios.get(`${API_URL}/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  
  getPendingRequests: async () => {
    const { token } = get();
    if (!token) return [];
    const response = await axios.get(`${API_URL}/requests/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  
  approveRequest: async (id) => {
    const { token } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  
  rejectRequest: async (id) => {
    const { token } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  
  deleteRequest: async (id) => {
    const { token } = get();
    await axios.delete(`${API_URL}/requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  
  getAnalytics: async () => {
    const { token } = get();
    if (!token) return null;
    const response = await axios.get(`${API_URL}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
}));

export default useStore;
