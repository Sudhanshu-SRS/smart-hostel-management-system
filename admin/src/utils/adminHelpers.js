// admin/src/utils/adminHelpers.js
import { format, formatDistance, isValid, parseISO } from "date-fns";

// Enhanced formatting utilities for admin
export const formatCurrency = (amount, currency = "INR") => {
  if (typeof amount !== "number") return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date, formatString = "MMM dd, yyyy") => {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, formatString) : "";
};

export const formatDateTime = (date) => {
  return formatDate(date, "MMM dd, yyyy hh:mm a");
};

export const formatTimeAgo = (date) => {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return isValid(parsedDate)
    ? formatDistance(parsedDate, new Date(), { addSuffix: true })
    : "";
};

// Status color helpers
export const getStatusColor = (status, type = "default") => {
  const statusColors = {
    // User statuses
    active: "success",
    inactive: "error",
    suspended: "warning",
    pending: "info",

    // Payment statuses
    completed: "success",
    pending: "warning",
    failed: "error",
    refunded: "info",
    overdue: "error",

    // Complaint statuses
    open: "error",
    in_progress: "warning",
    resolved: "success",
    closed: "info",
    rejected: "default",

    // Room statuses
    available: "success",
    occupied: "warning",
    maintenance: "error",
    reserved: "info",

    // Visitor statuses
    waiting_approval: "warning",
    approved: "info",
    checked_in: "success",
    checked_out: "default",
    rejected: "error",
    overstayed: "error",

    // System statuses
    online: "success",
    offline: "error",
    maintenance: "warning",
    updating: "info",
  };

  return statusColors[status] || "default";
};

export const getPriorityColor = (priority) => {
  const priorityColors = {
    low: "success",
    medium: "info",
    high: "warning",
    urgent: "error",
    critical: "error",
  };

  return priorityColors[priority] || "default";
};

// Data processing utilities
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const generateRandomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Error handling
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Data export utilities
export const exportToCSV = (data, filename) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

// Chart data processing
export const processChartData = (data, xKey, yKey, groupBy = null) => {
  if (!data.length) return [];

  if (groupBy) {
    const grouped = data.reduce((acc, item) => {
      const group = item[groupBy];
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {});

    return Object.keys(grouped).map((group) => ({
      [xKey]: group,
      [yKey]: grouped[group].reduce((sum, item) => sum + (item[yKey] || 0), 0),
    }));
  }

  return data.map((item) => ({
    [xKey]: item[xKey],
    [yKey]: item[yKey] || 0,
  }));
};

// Analytics utilities
export const calculateGrowthRate = (current, previous, period = "month") => {
  if (!previous || previous === 0) return 0;

  const growth = ((current - previous) / previous) * 100;
  return {
    value: growth,
    formatted: formatPercentage(growth),
    trend: growth > 0 ? "up" : growth < 0 ? "down" : "neutral",
    period,
  };
};

export const calculateAverage = (data, key) => {
  if (!data.length) return 0;
  const sum = data.reduce((acc, item) => acc + (item[key] || 0), 0);
  return sum / data.length;
};

export const findTrend = (data, key, periods = 3) => {
  if (data.length < periods) return "insufficient_data";

  const recent = data.slice(-periods);
  let increasing = 0;
  let decreasing = 0;

  for (let i = 1; i < recent.length; i++) {
    if (recent[i][key] > recent[i - 1][key]) increasing++;
    if (recent[i][key] < recent[i - 1][key]) decreasing++;
  }

  if (increasing > decreasing) return "increasing";
  if (decreasing > increasing) return "decreasing";
  return "stable";
};

// Role-based access helpers
export const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    student: 1,
    warden: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canManageUsers = (userRole) => hasPermission(userRole, "warden");
export const canAccessSettings = (userRole) => hasPermission(userRole, "admin");
export const canViewAnalytics = (userRole) => hasPermission(userRole, "warden");

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  getStatusColor,
  getPriorityColor,
  calculatePercentageChange,
  formatPercentage,
  generateRandomId,
  getErrorMessage,
  exportToCSV,
  validateEmail,
  validatePhoneNumber,
  processChartData,
  calculateGrowthRate,
  calculateAverage,
  findTrend,
  hasPermission,
  canManageUsers,
  canAccessSettings,
  canViewAnalytics,
};
