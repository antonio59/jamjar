import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function readCookie(name) {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// The session lives in an httpOnly cookie the browser attaches itself; the
// readable CSRF cookie is echoed back as a header so cross-site pages, which
// can send the cookie but not read it, can't forge writes.
const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const csrf = readCookie('jj_csrf');
  if (csrf) config.headers['X-CSRF-Token'] = csrf;
  return config;
});

// Route allowlisted thumbnail hosts through the server-side proxy — family
// DNS filters and ad-blockers commonly block img.youtube.com entirely.
const THUMB_PROXY_HOSTS = new Set([
  'img.youtube.com',
  'i.ytimg.com',
  'covers.openlibrary.org',
]);

export function thumbUrl(url) {
  if (!url) return null;
  try {
    if (THUMB_PROXY_HOSTS.has(new URL(url).hostname)) {
      return `${API_URL}/thumb?u=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return null;
  }
}

export { API_URL, readCookie };
export default api;
