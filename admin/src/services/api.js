// admin/src/services/api.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Configure axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("shms_admin_token");

    if (token && token.startsWith("hardcoded_admin_")) {
      // For hardcoded admin, set special header and don't send Authorization
      config.headers["X-Admin-Mode"] = "hardcoded";
      // Don't set Authorization header for hardcoded admin
    } else if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("shms_admin_token");
      // Only logout if it's not a hardcoded admin
      if (!token || !token.startsWith("hardcoded_admin_")) {
        localStorage.removeItem("shms_admin_token");
        localStorage.removeItem("shms_admin_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const api = {
  // Authentication APIs
  login: (credentials) => axiosInstance.post("/auth/login", credentials),
  logout: () => axiosInstance.post("/auth/logout"),
  getProfile: () => axiosInstance.get("/auth/me"),

  // Dashboard APIs
  getDashboardStats: () => axiosInstance.get("/dashboard/stats"),
  getRecentActivities: (limit = 10) =>
    axiosInstance.get(`/dashboard/recent-activities?limit=${limit}`),

  // User Management APIs
  getAllUsers: (params) => axiosInstance.get("/users", { params }),
  getUserById: (id) => axiosInstance.get(`/users/${id}`),
  createUser: (userData) => axiosInstance.post("/users", userData),
  updateUser: (id, userData) => axiosInstance.put(`/users/${id}`, userData),
  deleteUser: (id) => axiosInstance.delete(`/users/${id}`),
  getUserStats: () => axiosInstance.get("/users/stats/summary"),

  // Room Management APIs
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  getAllRooms: (params) => axiosInstance.get("/rooms", { params }),
  getRoomById: (id) => axiosInstance.get(`/rooms/${id}`),
  createRoom: (roomData) => axiosInstance.post("/rooms", roomData),
  updateRoom: (id, roomData) => axiosInstance.put(`/rooms/${id}`, roomData),
  deleteRoom: (id) => axiosInstance.delete(`/rooms/${id}`),
  getRoomOccupancy: () => axiosInstance.get("/rooms/stats/occupancy"),

  // Payment Management APIs
  getAllPayments: (params) => axiosInstance.get("/payments", { params }),
  getPaymentById: (id) => axiosInstance.get(`/payments/${id}`),
  createPayment: (paymentData) => axiosInstance.post("/payments", paymentData),
  createManualPayment: (paymentData) =>
    axiosInstance.post("/payments/manual", paymentData),
  updatePayment: (id, paymentData) =>
    axiosInstance.put(`/payments/${id}`, paymentData),
  processRefund: (id, refundData) =>
    axiosInstance.post(`/payments/${id}/refund`, refundData),
  getOverduePayments: () => axiosInstance.get("/payments/overdue"),
  getPaymentStats: () => axiosInstance.get("/payments/stats/summary"),
  getPaymentAnalytics: (params) =>
    axiosInstance.get("/payments/analytics", { params }),

  // Complaint Management APIs
  getAllComplaints: (params) => axiosInstance.get("/complaints", { params }),
  getComplaintById: (id) => axiosInstance.get(`/complaints/${id}`),
  updateComplaint: (id, complaintData) =>
    axiosInstance.put(`/complaints/${id}`, complaintData),
  assignComplaint: (id, assignData) =>
    axiosInstance.post(`/complaints/${id}/assign`, assignData),
  resolveComplaint: (id, resolutionData) =>
    axiosInstance.post(`/complaints/${id}/resolve`, resolutionData),
  getComplaintStats: () => axiosInstance.get("/complaints/stats/summary"),

  // Visitor Management APIs
  getAllVisitors: (params) => axiosInstance.get("/visitors", { params }),
  getVisitorById: (id) => axiosInstance.get(`/visitors/${id}`),
  approveVisitor: (id) => axiosInstance.put(`/visitors/${id}/approve`),
  rejectVisitor: (id, rejectionData) =>
    axiosInstance.put(`/visitors/${id}/reject`, rejectionData),
  checkoutVisitor: (id) => axiosInstance.put(`/visitors/${id}/checkout`),
  getVisitorAnalytics: () => axiosInstance.get("/visitors/stats/summary"),

  // Gate Management APIs (for QR scanning)
  getAllGates: (params = {}) => axiosInstance.get("/gates", { params }),
  getGate: (id) => axiosInstance.get(`/gates/${id}`),
  createGate: (gateData) => axiosInstance.post("/gates", gateData),
  updateGate: (id, gateData) => axiosInstance.put(`/gates/${id}`, gateData),
  deleteGate: (id) => axiosInstance.delete(`/gates/${id}`),

  // Entry/Exit APIs
  scanStudentQR: (scanData) =>
    axiosInstance.post("/gates/scan-student-qr", scanData),
  getEntryExitLogs: (params = {}) =>
    axiosInstance.get("/gates/entry-exit-logs", { params }),
  getGateStats: () => axiosInstance.get("/gates/stats"),
  getStudentQR: (studentId) =>
    axiosInstance.get(`/gates/student-qr/${studentId}`),

  // System Settings APIs
  getSystemSettings: () => axiosInstance.get("/admin/settings"),
  updateSystemSettings: (settings) =>
    axiosInstance.put("/admin/settings", settings),
};

export default api;
export { api as adminAPI };
