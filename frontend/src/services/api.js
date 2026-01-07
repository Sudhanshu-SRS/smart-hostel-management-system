import axios from "axios";

// ✅ Dynamic base URL (Vite-safe)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Base API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("shms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("shms_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* =========================
   AUTH API
========================= */
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

/* =========================
   DASHBOARD API
========================= */
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivities: (limit = 10) =>
    api.get(`/dashboard/recent-activities?limit=${limit}`),
  getNotifications: () => api.get("/dashboard/notifications"),
};

/* =========================
   ROOMS API
========================= */
export const roomsAPI = {
  getRooms: (params = {}) => api.get("/rooms", { params }),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (roomData) => api.post("/rooms", roomData),
  updateRoom: (id, roomData) => api.put(`/rooms/${id}`, roomData),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
  bookRoom: (id) => api.post(`/rooms/${id}/book`),
  vacateRoom: (id, data = {}) => api.post(`/rooms/${id}/vacate`, data),
  getOccupancyStats: () => api.get("/rooms/stats/occupancy"),
};

/* =========================
   PAYMENTS API
========================= */
export const paymentsAPI = {
  getPayments: (params = {}) => api.get("/payments", { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createOrder: (orderData) => api.post("/payments/create-order", orderData),
  verifyPayment: (paymentData) => api.post("/payments/verify", paymentData),
  createPayment: (paymentData) => api.post("/payments", paymentData),
  createManualPayment: (paymentData) =>
    api.post("/payments/manual", paymentData),
  updatePayment: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  processRefund: (id, refundData) =>
    api.post(`/payments/${id}/refund`, refundData),
  getUserPayments: (userId) => api.get(`/payments/user/${userId}`),
  getOverduePayments: () => api.get("/payments/overdue"),
  getPaymentStats: () => api.get("/payments/stats/summary"),
  getMyPaymentStats: () => api.get("/payments/stats/my-summary"),
  getPaymentAnalytics: (params = {}) =>
    api.get("/payments/analytics", { params }),
};

/* =========================
   COMPLAINTS API
========================= */
export const complaintsAPI = {
  getComplaints: (params = {}) => api.get("/complaints", { params }),
  getComplaint: (id) => api.get(`/complaints/${id}`),
  createComplaint: (data) => api.post("/complaints", data),
  updateComplaint: (id, data) => api.put(`/complaints/${id}`, data),
  assignComplaint: (id, data) => api.post(`/complaints/${id}/assign`, data),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
  resolveComplaint: (id, data) => api.post(`/complaints/${id}/resolve`, data),
  addFeedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),
  getComplaintStats: () => api.get("/complaints/stats/summary"),
};

/* =========================
   VISITORS API
========================= */
export const visitorsAPI = {
  getVisitors: (params = {}) => api.get("/visitors", { params }),
  getVisitor: (id) => api.get(`/visitors/${id}`),
  registerVisitor: (data) => api.post("/visitors", data),
  approveVisitor: (id) => api.put(`/visitors/${id}/approve`),
  rejectVisitor: (id, data) => api.put(`/visitors/${id}/reject`, data),
  checkoutVisitor: (id) => api.put(`/visitors/${id}/checkout`),
  getActiveCount: () => api.get("/visitors/active/count"),
  getVisitorStats: () => api.get("/visitors/stats/summary"),
  checkOverstay: () => api.post("/visitors/check-overstay"),
};

/* =========================
   USERS API
========================= */
export const usersAPI = {
  getUsers: (params = {}) => api.get("/users", { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  uploadAvatar: (id, formData) =>
    api.post(`/users/${id}/upload-avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadIdProof: (id, formData) =>
    api.post(`/users/${id}/upload-id-proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (id, data) => api.put(`/users/${id}/change-password`, data),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get("/users/stats/summary"),
};

/* =========================
   GATE API
========================= */
export const gateAPI = {
  getGates: (params = {}) => api.get("/gates", { params }),
  getGate: (id) => api.get(`/gates/${id}`),
  createGate: (data) => api.post("/gates", data),
  updateGate: (id, data) => api.put(`/gates/${id}`, data),
  deleteGate: (id) => api.delete(`/gates/${id}`),
  scanStudentQR: (data) => api.post("/gates/scan-student-qr", data),
  getEntryExitLogs: (params = {}) =>
    api.get("/gates/entry-exit-logs", { params }),
  getStudentQR: (studentId) => {
    if (!studentId || studentId === "undefined" || studentId === "null") {
      return Promise.reject(new Error("Valid student ID is required"));
    }
    return api.get(`/gates/student-qr/${studentId}`);
  },
  getGateStats: () => api.get("/gates/stats"),
};

/* =========================
   MESS FEEDBACK API
========================= */
export const messFeedbackAPI = {
  submitFeedback: (data) => api.post("/mess-feedback", data),
  getMyFeedback: (params = {}) =>
    api.get("/mess-feedback/my-feedback", { params }),
  getAllFeedback: (params = {}) => api.get("/mess-feedback", { params }),
  getFeedbackStats: (params = {}) =>
    api.get("/mess-feedback/stats", { params }),
  checkDailySubmission: () => api.get("/mess-feedback/check-daily-submission"),
};

/* =========================
   ENTRY / EXIT API
========================= */
export const entryExitAPI = {
  getMyHistory: (params = {}) => api.get("/gates/entry-exit-logs", { params }),
  getAllHistory: (params = {}) => api.get("/gates/entry-exit-logs", { params }),
  getStats: () => api.get("/gates/stats"),
};

/* =========================
   VACATION REQUEST API
========================= */
export const vacationRequestAPI = {
  createRequest: (reason) => api.post("/vacation-requests", { reason }),
  getMyRequest: () => api.get("/vacation-requests/my-request"),
  getPendingRequests: (params = {}) =>
    api.get("/vacation-requests/pending", { params }),
  getAllRequests: (params = {}) => api.get("/vacation-requests", { params }),
  approveByAdmin: (id, comments) =>
    api.post(`/vacation-requests/${id}/approve-admin`, { comments }),
  approveByWarden: (id, comments) =>
    api.post(`/vacation-requests/${id}/approve-warden`, { comments }),
  rejectRequest: (id, reason) =>
    api.post(`/vacation-requests/${id}/reject`, { reason }),
};

export default api;
