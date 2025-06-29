// admin/src/services/api.js
import axios from "axios";

// Base API configuration
const API_BASE = "/api";

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:5000";
axios.defaults.timeout = 10000;

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("shms_admin_token");
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
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("shms_admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Admin API Services
export const adminAPI = {
  // Dashboard APIs
  getDashboardStats: () => axios.get(`${API_BASE}/admin/dashboard/stats`),
  getSystemHealth: () => axios.get(`${API_BASE}/admin/system/health`),
  getRecentActivities: () => axios.get(`${API_BASE}/admin/activities`),

  // User Management APIs
  getAllUsers: (params) => axios.get("/api/users", { params }),
  getUserById: (id) => axios.get(`/api/users/${id}`),
  createUser: (userData) => axios.post("/api/users", userData),
  updateUser: (id, userData) => axios.put(`/api/users/${id}`, userData),
  deleteUser: (id) => axios.delete(`/api/users/${id}`),
  toggleUserStatus: (id) => axios.put(`/api/users/${id}/toggle-status`),
  getUserStats: () => axios.get("/api/users/stats/summary"),
  bulkUpdateUsers: (userIds, updateData) =>
    axios.put("/api/users/bulk", { userIds, updateData }),
  exportUsers: (format) =>
    axios.get(`/api/users/export/${format}`, {
      responseType: "blob",
    }),

  // Room Management APIs
  getAllRooms: (params) => axios.get(`${API_BASE}/admin/rooms`, { params }),
  getRoomById: (id) => axios.get(`${API_BASE}/admin/rooms/${id}`),
  createRoom: (roomData) => axios.post(`${API_BASE}/admin/rooms`, roomData),
  updateRoom: (id, roomData) =>
    axios.put(`${API_BASE}/admin/rooms/${id}`, roomData),
  deleteRoom: (id) => axios.delete(`${API_BASE}/admin/rooms/${id}`),
  bulkRoomOperation: (operation, roomIds, data) =>
    axios.post(`${API_BASE}/admin/rooms/bulk/${operation}`, { roomIds, data }),
  getRoomOccupancy: () => axios.get(`${API_BASE}/admin/rooms/occupancy`),

  // Payment Management APIs
  getAllPayments: (params) =>
    axios.get(`${API_BASE}/admin/payments`, { params }),
  getPaymentById: (id) => axios.get(`${API_BASE}/admin/payments/${id}`),
  updatePaymentStatus: (id, status) =>
    axios.put(`${API_BASE}/admin/payments/${id}/status`, { status }),
  getPaymentAnalytics: (period) =>
    axios.get(`${API_BASE}/admin/payments/analytics/${period}`),
  exportPayments: (format, params) =>
    axios.get(`${API_BASE}/admin/payments/export/${format}`, {
      params,
      responseType: "blob",
    }),
  initiateRefund: (paymentId, amount, reason) =>
    axios.post(`${API_BASE}/admin/payments/${paymentId}/refund`, {
      amount,
      reason,
    }),

  // Complaint Management APIs
  getAllComplaints: (params) =>
    axios.get(`${API_BASE}/admin/complaints`, { params }),
  getComplaintById: (id) => axios.get(`${API_BASE}/admin/complaints/${id}`),
  updateComplaintStatus: (id, status, response) =>
    axios.put(`${API_BASE}/admin/complaints/${id}/status`, {
      status,
      response,
    }),
  assignComplaint: (id, assignedTo) =>
    axios.put(`${API_BASE}/admin/complaints/${id}/assign`, { assignedTo }),
  bulkComplaintUpdate: (complaintIds, updateData) =>
    axios.put(`${API_BASE}/admin/complaints/bulk`, {
      complaintIds,
      updateData,
    }),
  getComplaintAnalytics: () =>
    axios.get(`${API_BASE}/admin/complaints/analytics`),

  // Visitor Management APIs
  getAllVisitors: (params) =>
    axios.get(`${API_BASE}/admin/visitors`, { params }),
  getVisitorById: (id) => axios.get(`${API_BASE}/admin/visitors/${id}`),
  updateVisitorStatus: (id, status) =>
    axios.put(`${API_BASE}/admin/visitors/${id}/status`, { status }),
  checkInVisitor: (id) =>
    axios.post(`${API_BASE}/admin/visitors/${id}/checkin`),
  checkOutVisitor: (id) =>
    axios.post(`${API_BASE}/admin/visitors/${id}/checkout`),
  getVisitorAnalytics: () => axios.get(`${API_BASE}/admin/visitors/analytics`),
  exportVisitors: (format, params) =>
    axios.get(`${API_BASE}/admin/visitors/export/${format}`, {
      params,
      responseType: "blob",
    }),

  // Analytics APIs
  getAdvancedAnalytics: (type, period) =>
    axios.get(`${API_BASE}/admin/analytics/${type}/${period}`),
  getCustomReport: (reportConfig) =>
    axios.post(`${API_BASE}/admin/analytics/custom`, reportConfig),

  // System Settings APIs
  getSystemSettings: () => axios.get(`${API_BASE}/admin/settings`),
  updateSystemSettings: (settings) =>
    axios.put(`${API_BASE}/admin/settings`, settings),
  getAuditLogs: (params) =>
    axios.get(`${API_BASE}/admin/audit-logs`, { params }),

  // Backup & Maintenance APIs
  initiateBackup: () => axios.post(`${API_BASE}/admin/system/backup`),
  getBackupHistory: () => axios.get(`${API_BASE}/admin/system/backups`),
  restoreBackup: (backupId) =>
    axios.post(`${API_BASE}/admin/system/restore/${backupId}`),
  enableMaintenanceMode: () =>
    axios.post(`${API_BASE}/admin/system/maintenance/enable`),
  disableMaintenanceMode: () =>
    axios.post(`${API_BASE}/admin/system/maintenance/disable`),

  // Notification APIs
  sendBulkNotification: (notificationData) =>
    axios.post(`${API_BASE}/admin/notifications/bulk`, notificationData),
  getNotificationTemplates: () =>
    axios.get(`${API_BASE}/admin/notifications/templates`),
  createNotificationTemplate: (template) =>
    axios.post(`${API_BASE}/admin/notifications/templates`, template),
};

export default adminAPI;
