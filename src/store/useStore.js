import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const useStore = create((set, get) => ({
  // Auth state
  user: null,
  sessionId: localStorage.getItem('sessionId'),
  isAuthenticated: !!localStorage.getItem('sessionId'),
  
  // Toast notifications
  toast: null,
  
  // UI state
  currentPage: 'home',
  
  // Toast actions
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  
  hideToast: () => set({ toast: null }),
  
  // Actions
  restoreSession: async () => {
    const { sessionId } = get();
    if (!sessionId) return false;
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { 'X-Session-Id': sessionId },
      });
      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch {
      localStorage.removeItem('sessionId');
      set({ user: null, sessionId: null, isAuthenticated: false });
      return false;
    }
  },

  login: async (username, pin) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, pin });
      const { user, sessionId } = response.data;
      localStorage.setItem('sessionId', sessionId);
      set({ user, sessionId, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error 
        || (error.code === 'ERR_NETWORK' ? 'Cannot reach server. Please check your connection.' : 'Login failed');
      return { success: false, error: message };
    }
  },
  
  logout: async () => {
    const { sessionId } = get();
    if (sessionId) {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { 'X-Session-Id': sessionId },
      });
    }
    localStorage.removeItem('sessionId');
    set({ user: null, sessionId: null, isAuthenticated: false });
  },
  
  search: async (query, type) => {
    const { sessionId } = get();
    if (!sessionId) return [];
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { q: query, type },
        headers: { 'X-Session-Id': sessionId },
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  searchBooks: async (query) => {
    const { sessionId } = get();
    if (!sessionId) return [];
    try {
      const response = await axios.get(`${API_URL}/search/books`, {
        params: { q: query },
        headers: { 'X-Session-Id': sessionId },
      });
      return response.data;
    } catch (error) {
      console.error('Book search error:', error);
      return [];
    }
  },

  getVideoInfo: async (url) => {
    const { sessionId } = get();
    if (!sessionId) return null;
    try {
      const response = await axios.get(`${API_URL}/video-info`, {
        params: { url },
        headers: { 'X-Session-Id': sessionId },
      });
      return response.data;
    } catch (error) {
      console.error('Video info error:', error);
      return null;
    }
  },

  markUploaded: async (id) => {
    const { sessionId } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/mark-uploaded`, {}, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },

  getBlockedKeywords: async () => {
    const { sessionId } = get();
    if (!sessionId) return [];
    const response = await axios.get(`${API_URL}/blocked-keywords`, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },

  addBlockedKeyword: async (keyword) => {
    const { sessionId } = get();
    await axios.post(`${API_URL}/blocked-keywords`, { keyword }, {
      headers: { 'X-Session-Id': sessionId },
    });
  },

  removeBlockedKeyword: async (id) => {
    const { sessionId } = get();
    await axios.delete(`${API_URL}/blocked-keywords/${id}`, {
      headers: { 'X-Session-Id': sessionId },
    });
  },
  
  createRequest: async (data) => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('Not authenticated');
    const response = await axios.post(`${API_URL}/requests`, data, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },
  
  getRequests: async () => {
    const { sessionId } = get();
    if (!sessionId) return [];
    const response = await axios.get(`${API_URL}/requests`, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },
  
  getPendingRequests: async () => {
    const { sessionId } = get();
    if (!sessionId) return [];
    const response = await axios.get(`${API_URL}/requests/pending`, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },
  
  approveRequest: async (id) => {
    const { sessionId } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/approve`, {}, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },
  
  rejectRequest: async (id) => {
    const { sessionId } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/reject`, {}, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },
  
  deleteRequest: async (id) => {
    const { sessionId } = get();
    await axios.delete(`${API_URL}/requests/${id}`, {
      headers: { 'X-Session-Id': sessionId },
    });
  },
  
  getRequestStatus: async (id) => {
    const { sessionId } = get();
    if (!sessionId) return null;
    try {
      const response = await axios.get(`${API_URL}/requests/${id}/status`, {
        headers: { 'X-Session-Id': sessionId },
      });
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  },
  
  getAnalytics: async () => {
    const { sessionId } = get();
    if (!sessionId) return null;
    const response = await axios.get(`${API_URL}/analytics`, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },
}));

export default useStore;
