import axios from "axios";

// Base API configuration - make sure this matches your backend
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Ensure this matches your backend port
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
  (error) => {
    return Promise.reject(error);
  }
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

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivities: (limit = 10) =>
    api.get(`/dashboard/recent-activities?limit=${limit}`),
  getNotifications: () => api.get("/dashboard/notifications"),
};

// Rooms API
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

// Payments API
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

// Complaints API
export const complaintsAPI = {
  getComplaints: (params = {}) => api.get("/complaints", { params }),
  getComplaint: (id) => api.get(`/complaints/${id}`),
  createComplaint: (complaintData) => api.post("/complaints", complaintData),
  updateComplaint: (id, complaintData) =>
    api.put(`/complaints/${id}`, complaintData),
  assignComplaint: (id, assignData) =>
    api.post(`/complaints/${id}/assign`, assignData),
  addComment: (id, commentData) =>
    api.post(`/complaints/${id}/comments`, commentData),
  resolveComplaint: (id, resolutionData) =>
    api.post(`/complaints/${id}/resolve`, resolutionData),
  addFeedback: (id, feedbackData) =>
    api.post(`/complaints/${id}/feedback`, feedbackData),
  getComplaintStats: () => api.get("/complaints/stats/summary"),
};

// Visitors API
export const visitorsAPI = {
  getVisitors: (params = {}) => api.get("/visitors", { params }),
  getVisitor: (id) => api.get(`/visitors/${id}`),
  registerVisitor: (visitorData) => api.post("/visitors", visitorData),
  approveVisitor: (id) => api.put(`/visitors/${id}/approve`),
  rejectVisitor: (id, rejectionData) =>
    api.put(`/visitors/${id}/reject`, rejectionData),
  checkoutVisitor: (id) => api.put(`/visitors/${id}/checkout`),
  getActiveCount: () => api.get("/visitors/active/count"),
  getVisitorStats: () => api.get("/visitors/stats/summary"),
  checkOverstay: () => api.post("/visitors/check-overstay"),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get("/users", { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  uploadAvatar: (id, formData) =>
    api.post(`/users/${id}/upload-avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadIdProof: (id, formData) =>
    api.post(`/users/${id}/upload-id-proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (id, passwordData) =>
    api.put(`/users/${id}/change-password`, passwordData),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get("/users/stats/summary"),
};

// Gate API - Fix the getStudentQR function
export const gateAPI = {
  getGates: (params = {}) => api.get("/gates", { params }),
  getGate: (id) => api.get(`/gates/${id}`),
  createGate: (gateData) => api.post("/gates", gateData),
  updateGate: (id, gateData) => api.put(`/gates/${id}`, gateData),
  deleteGate: (id) => api.delete(`/gates/${id}`),
  scanStudentQR: (scanData) => api.post("/gates/scan-student-qr", scanData),
  getEntryExitLogs: (params = {}) =>
    api.get("/gates/entry-exit-logs", { params }),
  // Enhanced student QR function with better error handling
  getStudentQR: (studentId) => {
    if (!studentId || studentId === "undefined" || studentId === "null") {
      return Promise.reject(new Error("Valid student ID is required"));
    }
    return api.get(`/gates/student-qr/${studentId}`);
  },
  getGateStats: () => api.get("/gates/stats"),
};

// Mess Feedback API
export const messFeedbackAPI = {
  submitFeedback: (feedbackData) => api.post("/mess-feedback", feedbackData),
  getMyFeedback: (params = {}) =>
    api.get("/mess-feedback/my-feedback", { params }),
  getAllFeedback: (params = {}) => api.get("/mess-feedback", { params }),
  getFeedbackStats: (params = {}) =>
    api.get("/mess-feedback/stats", { params }),
  checkDailySubmission: () => api.get("/mess-feedback/check-daily-submission"),
};

// Entry/Exit API
export const entryExitAPI = {
  getMyHistory: (params = {}) => api.get("/gates/entry-exit-logs", { params }),
  getAllHistory: (params = {}) => api.get("/gates/entry-exit-logs", { params }),
  getStats: () => api.get("/gates/stats"),
};

export default api;
