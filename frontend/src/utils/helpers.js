import { format, formatDistance, isValid, parseISO } from "date-fns";

// Date formatting helpers
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

// Currency formatting
export const formatCurrency = (amount, currency = "INR") => {
  if (typeof amount !== "number") return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Text formatting
export const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeWords = (str) => {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Status helpers
export const getStatusColor = (status, type = "default") => {
  const statusColors = {
    // Payment statuses
    pending: "warning",
    completed: "success",
    failed: "error",
    refunded: "info",

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
    checked_in: "success",
    checked_out: "info",
    overstayed: "error",
  };

  return statusColors[status] || "default";
};

export const getPriorityColor = (priority) => {
  const priorityColors = {
    low: "success",
    medium: "info",
    high: "warning",
    urgent: "error",
  };

  return priorityColors[priority] || "default";
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

export default {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatCurrency,
  capitalizeFirst,
  capitalizeWords,
  getStatusColor,
  getPriorityColor,
  getErrorMessage,
};
