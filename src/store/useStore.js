import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Translate technical API errors into kid-friendly messages
function friendlyError(error) {
  if (error.code === 'ERR_NETWORK') {
    return 'The app is not responding right now. Please try again or ask a grown-up for help.';
  }
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    return 'Please ask a grown-up to log in again to continue.';
  }
  if (status === 429) {
    return 'You\'re going too fast! Please wait a minute and try again.';
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again or ask a grown-up for help.';
  }
  return error.response?.data?.error || error.message || 'Something went wrong. Please try again.';
}

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
      const raw = error.response?.data?.error;
      let message;
      if (error.code === 'ERR_NETWORK') {
        message = 'The app is not responding right now. Please try again or ask a grown-up for help.';
      } else if (error.response?.status === 401) {
        message = 'That username or PIN is wrong. Please try again!';
      } else if (error.response?.status === 429) {
        message = 'Too many attempts! Please wait a few minutes and try again.';
      } else {
        message = raw || 'Something went wrong. Please try again.';
      }
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
  
  rejectRequest: async (id, reason = 'Not appropriate') => {
    const { sessionId } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/reject`, { reason }, {
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

  retryDownload: async (id) => {
    const { sessionId } = get();
    const response = await axios.post(`${API_URL}/requests/${id}/retry`, { force: true }, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },

  retryAllDummy: async () => {
    const { sessionId } = get();
    const response = await axios.post(`${API_URL}/requests/retry-all-dummy`, {}, {
      headers: { 'X-Session-Id': sessionId },
    });
    return response.data;
  },

  checkDuplicate: async (title) => {
    const { sessionId } = get();
    if (!sessionId) return 0;
    try {
      const response = await axios.get(`${API_URL}/requests/check-duplicate`, {
        params: { title },
        headers: { 'X-Session-Id': sessionId },
      });
      return response.data.count;
    } catch {
      return 0;
    }
  },

  getArtists: async (profile) => {
    const { sessionId } = get();
    if (!sessionId) return [];
    try {
      const response = await axios.get(`${API_URL}/library/artists`, {
        params: profile ? { profile } : {},
        headers: { 'X-Session-Id': sessionId },
      });
      return response.data;
    } catch {
      return [];
    }
  },
}));

export default useStore;
