import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE, withCredentials: true });

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      refreshing = true;
      try {
        const { data } = await axios.post(`${BASE}/api/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem("access_token", data.access_token);
        refreshQueue.forEach(({ resolve }) => resolve(data.access_token));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        refreshQueue.forEach(({ reject }) => reject(error));
        refreshQueue = [];
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth
export const authAPI = {
  register: (d) => api.post("/api/auth/register", d),
  login: (d) => api.post("/api/auth/login", d),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get("/api/auth/me"),
  googleUrl: () => api.get("/api/auth/google"),
  googleCallback: (code) => api.post("/api/auth/google/callback", { code }),
};

// ─── Users
export const usersAPI = {
  updateProfile: (d) => api.patch("/api/users/profile", d),
  uploadAvatar: (f) => { const fd = new FormData(); fd.append("file", f); return api.post("/api/users/avatar", fd); },
  getUser: (id) => api.get(`/api/users/${id}`),
};

// ─── Gigs
export const gigsAPI = {
  list: (params) => api.get("/api/gigs", { params }),
  get: (id) => api.get(`/api/gigs/${id}`),
  create: (d) => api.post("/api/gigs", d),
  update: (id, d) => api.put(`/api/gigs/${id}`, d),
  delete: (id) => api.delete(`/api/gigs/${id}`),
  uploadImage: (id, f) => { const fd = new FormData(); fd.append("file", f); return api.post(`/api/gigs/${id}/images`, fd); },
};

// ─── Bookings
export const bookingsAPI = {
  create: (d) => api.post("/api/bookings", d),
  list: () => api.get("/api/bookings"),
  updateStatus: (id, status) => api.patch(`/api/bookings/${id}/status`, { status }),
};

// ─── Messages
export const messagesAPI = {
  listConversations: () => api.get("/api/conversations"),
  getOrCreate: (other_user_id) => api.post("/api/conversations", { other_user_id }),
  getMessages: (conv_id) => api.get(`/api/conversations/${conv_id}/messages`),
  send: (d) => api.post("/api/messages", d),
  unreadCount: () => api.get("/api/messages/unread-count"),
};

// ─── Reviews
export const reviewsAPI = {
  create: (d) => api.post("/api/reviews", d),
};

// ─── Dashboard
export const dashboardAPI = {
  stats: () => api.get("/api/dashboard/stats"),
};

// ─── Categories & Cities
export const metaAPI = {
  categories: () => api.get("/api/categories"),
  cities: (q) => api.get("/api/cities", { params: { q } }),
};

// ─── Subscription
export const subscriptionAPI = {
  createOrder: () => api.post("/api/subscription/create-order"),
  verify: (d) => api.post("/api/subscription/verify", d),
};

export default api;
