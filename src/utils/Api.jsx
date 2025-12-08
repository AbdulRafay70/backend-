import axios from "axios";

// Use Vite env variable when available, otherwise fall back to production backend.
// Ensure the baseURL includes the `/api` prefix so `api.get('/agencies/')` => `${baseURL}/agencies/` targets `/api/agencies/`.
const rawBase = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const baseURL = rawBase.endsWith("/api") ? rawBase : rawBase.replace(/\/$/, "") + "/api";

const api = axios.create({
  baseURL,
  // headers: { "Content-Type": "application/json" },
  timeout: 30000, // 10 seconds timeout
  // do NOT set withCredentials by default — use token auth via headers unless you specifically
  // need cookie-based sessions. Setting withCredentials without enabling CORS_ALLOW_CREDENTIALS
  // on the server causes a browser-level network error.
  withCredentials: false,
});

// Attach token automatically from localStorage (if available)
api.interceptors.request.use((config) => {
  try {
    // Support multiple possible storage keys (accessToken or legacy 'token')
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      // if token already contains 'Bearer ' prefix, don't double-prefix
      config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage might be unavailable in some environments
  }
  return config;
});

// Global response handler: on 401 clear tokens and optionally redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } catch (e) {}
      // optional: window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const getPost = () => api.get("/branches/");

// Helper to set or clear the default Authorization header on the axios instance
export const setAuthToken = (token) => {
  try {
    if (!api.defaults) api.defaults = {};
    if (!api.defaults.headers) api.defaults.headers = {};
    if (token) {
      // Accept either a raw token or a "Bearer ..." value
      api.defaults.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    } else {
      // remove header when token is null/undefined
      delete api.defaults.headers.Authorization;
    }
  } catch (e) {
    // ignore errors when running in non-browser environments
  }
};

export const getFinanceDashboard = (period = "today") => {
  return api.get(`/finance/dashboard`, { params: { period } });
};

export const getUniversalList = (params = {}) => {
  return api.get("/universal/list/", { params });
};

export const registerUniversal = (data) => {
  return api.post("/universal/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const approveUniversal = (id, data = {}) => {
  return api.post(`/universal/${id}/approve/`, data);
};

export const rejectUniversal = (id, data = {}) => {
  return api.post(`/universal/${id}/reject/`, data);
};

// Rules API functions
export const getRules = (params = {}) => {
  return api.get("/rules/list", { params });
};

export const createRule = (data) => {
  return api.post("/rules/", data);
};

export const updateRule = (id, data) => {
  return api.put(`/rules/${id}/`, data);
};

export const deleteRule = (id) => {
  return api.delete(`/rules/${id}/`);
};

export const toggleRuleStatus = (id) => {
  return api.patch(`/rules/${id}/toggle-status/`);
};