import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach Authorization header from localStorage when available.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('agentAccessToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore localStorage read errors
  }
  // Ensure requests without an explicit absolute URL are prefixed with /api
  try {
    const url = config.url || '';
    const isAbsolute = /^https?:\/\//i.test(url);
    if (!isAbsolute) {
      // If not already starting with /api/, add it. Keep absolute-like paths untouched.
      if (!url.startsWith('/api/')) {
        if (url.startsWith('/')) {
          config.url = '/api' + url;
        } else {
          config.url = '/api/' + url;
        }
      }
    }
  } catch (e) {
    // ignore URL normalization errors
  }
  // Debug: show outgoing requests and auth header for troubleshooting
  try {
    // eslint-disable-next-line no-console
    console.debug('API request:', config.method?.toUpperCase(), config.url, 'Authorization:', config.headers?.Authorization || 'none');
  } catch (e) {}
  return config;
}, (error) => Promise.reject(error));

export const getPost = () => {
  return api.get("/branches/");
};

export default api;