import { create } from 'zustand';
import api, { readCookie } from '../api/client.js';

// Translate technical API errors into kid-friendly messages
export function friendlyError(error) {
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
  // Optimistic hint so a returning user doesn't flash the login screen; the
  // session cookie is httpOnly, so restoreSession()'s /auth/me is the real check.
  isAuthenticated: !!readCookie('jj_csrf'),
  accessToken: null,
  accessTokenExpiresAt: 0,
  
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
    try {
      const response = await api.get(`/auth/me`);
      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch {
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },

  login: async (username, pin) => {
    try {
      const response = await api.post(`/auth/login`, { username, pin });
      set({ user: response.data.user, isAuthenticated: true });
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
    await api.post(`/auth/logout`, {});
    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      accessTokenExpiresAt: 0,
    });
  },
  
  search: async (query, type) => {
    if (!get().isAuthenticated) return [];
    try {
      const response = await api.get(`/search`, {
        params: { q: query, type },
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  searchBooks: async (query) => {
    if (!get().isAuthenticated) return [];
    try {
      const response = await api.get(`/search/books`, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Book search error:', error);
      return [];
    }
  },

  getVideoInfo: async (url) => {
    if (!get().isAuthenticated) return null;
    try {
      const response = await api.get(`/video-info`, {
        params: { url },
      });
      return response.data;
    } catch (error) {
      console.error('Video info error:', error);
      return null;
    }
  },

  markUploaded: async (id) => {
    const response = await api.post(`/requests/${id}/mark-uploaded`, {});
    return response.data;
  },

  getUsers: async () => {
    if (!get().isAuthenticated) return [];
    const response = await api.get(`/users`);
    return response.data;
  },

  createChild: async (data) => {
    const response = await api.post(`/users`, data);
    return response.data;
  },

  updateChild: async (id, data) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  setUserPin: async (id, pin) => {
    await api.post(`/users/${id}/pin`, { pin });
  },

  deleteChild: async (id) => {
    await api.delete(`/users/${id}`);
  },

  getBlockedKeywords: async () => {
    if (!get().isAuthenticated) return [];
    const response = await api.get(`/blocked-keywords`);
    return response.data;
  },

  addBlockedKeyword: async (keyword) => {
    await api.post(`/blocked-keywords`, { keyword });
  },

  removeBlockedKeyword: async (id) => {
    await api.delete(`/blocked-keywords/${id}`);
  },
  
  createRequest: async (data) => {
    if (!get().isAuthenticated) throw new Error('Not authenticated');
    const response = await api.post(`/requests`, data);
    return response.data;
  },
  
  // Short-lived token for URLs the browser fetches without our auth header
  // (<audio src>, EventSource). Cached until shortly before it expires.
  getAccessToken: async () => {
    const { isAuthenticated, accessToken, accessTokenExpiresAt } = get();
    if (!isAuthenticated) return null;
    if (accessToken && Date.now() < accessTokenExpiresAt - 15000) {
      return accessToken;
    }
    const response = await api.post(`/access-token`, {});
    set({
      accessToken: response.data.token,
      accessTokenExpiresAt: Date.now() + response.data.expiresIn * 1000,
    });
    return response.data.token;
  },

  getRequests: async () => {
    if (!get().isAuthenticated) return [];
    const response = await api.get(`/requests`);
    return response.data;
  },
  
  getPendingRequests: async () => {
    if (!get().isAuthenticated) return [];
    const response = await api.get(`/requests/pending`);
    return response.data;
  },
  
  approveRequest: async (id) => {
    const response = await api.post(`/requests/${id}/approve`, {});
    return response.data;
  },
  
  rejectRequest: async (id, reason = 'Not appropriate') => {
    const response = await api.post(`/requests/${id}/reject`, { reason });
    return response.data;
  },
  
  deleteRequest: async (id) => {
    await api.delete(`/requests/${id}`);
  },
  
  getRequestStatus: async (id) => {
    if (!get().isAuthenticated) return null;
    try {
      const response = await api.get(`/requests/${id}/status`);
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  },
  
  getAnalytics: async () => {
    if (!get().isAuthenticated) return null;
    const response = await api.get(`/analytics`);
    return response.data;
  },

  retryDownload: async (id) => {
    const response = await api.post(`/requests/${id}/retry`, { force: true });
    return response.data;
  },

  retryAllDummy: async () => {
    const response = await api.post(`/requests/retry-all-dummy`, {});
    return response.data;
  },

  checkDuplicate: async (title) => {
    if (!get().isAuthenticated) return 0;
    try {
      const response = await api.get(`/requests/check-duplicate`, {
        params: { title },
      });
      return response.data.count;
    } catch {
      return 0;
    }
  },

  getArtists: async (profile) => {
    if (!get().isAuthenticated) return [];
    try {
      const response = await api.get(`/library/artists`, {
        params: profile ? { profile } : {},
      });
      return response.data;
    } catch {
      return [];
    }
  },
}));

export default useStore;
