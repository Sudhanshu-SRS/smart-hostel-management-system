// API endpoints
export const API_ENDPOINTS = {
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  ROOMS: "/rooms",
  PAYMENTS: "/payments",
  COMPLAINTS: "/complaints",
  VISITORS: "/visitors",
  USERS: "/users",
};

// User roles
export const USER_ROLES = {
  STUDENT: "student",
  WARDEN: "warden",
  ADMIN: "admin",
};

// Room types
export const ROOM_TYPES = {
  SINGLE: "single",
  DOUBLE: "double",
  TRIPLE: "triple",
  QUAD: "quad",
};

// Room status
export const ROOM_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
  RESERVED: "reserved",
};

// Payment types
export const PAYMENT_TYPES = {
  MONTHLY_RENT: "monthly_rent",
  SECURITY_DEPOSIT: "security_deposit",
  MAINTENANCE: "maintenance",
  FINE: "fine",
  LAUNDRY: "laundry",
  MESS_FEE: "mess_fee",
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

// Complaint categories
export const COMPLAINT_CATEGORIES = {
  MAINTENANCE: "maintenance",
  ELECTRICAL: "electrical",
  PLUMBING: "plumbing",
  CLEANING: "cleaning",
  SECURITY: "security",
  WIFI: "wifi",
  NOISE: "noise",
  OTHER: "other",
};

// Complaint priorities
export const COMPLAINT_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Complaint status
export const COMPLAINT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
  REJECTED: "rejected",
};

// Visitor status
export const VISITOR_STATUS = {
  WAITING_APPROVAL: "waiting_approval",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  OVERSTAYED: "overstayed",
  REJECTED: "rejected",
};

// ID types
export const ID_TYPES = {
  AADHAR: "aadhar",
  PASSPORT: "passport",
  DRIVING_LICENSE: "driving_license",
  VOTER_ID: "voter_id",
  PAN_CARD: "pan_card",
};

// Relationships
export const RELATIONSHIPS = {
  PARENT: "parent",
  GUARDIAN: "guardian",
  SIBLING: "sibling",
  FRIEND: "friend",
  RELATIVE: "relative",
  OTHER: "other",
};

// Navigation items
export const NAVIGATION_ITEMS = [
  {
    text: "Dashboard",
    path: "/dashboard",
    icon: "Dashboard",
    roles: [USER_ROLES.STUDENT, USER_ROLES.WARDEN, USER_ROLES.ADMIN],
  },
  {
    text: "Rooms",
    path: "/rooms",
    icon: "Hotel",
    roles: [USER_ROLES.STUDENT, USER_ROLES.WARDEN, USER_ROLES.ADMIN],
  },
  {
    text: "Payments",
    path: "/payments",
    icon: "Payment",
    roles: [USER_ROLES.STUDENT, USER_ROLES.WARDEN, USER_ROLES.ADMIN],
  },
  {
    text: "Complaints",
    path: "/complaints",
    icon: "ReportProblem",
    roles: [USER_ROLES.STUDENT, USER_ROLES.WARDEN, USER_ROLES.ADMIN],
  },
  {
    text: "Visitors",
    path: "/visitors",
    icon: "Visibility",
    roles: [USER_ROLES.STUDENT, USER_ROLES.WARDEN, USER_ROLES.ADMIN],
  },
  {
    text: "Users",
    path: "/users",
    icon: "People",
    roles: [USER_ROLES.WARDEN, USER_ROLES.ADMIN],
  },
];

// Status colors
export const STATUS_COLORS = {
  // Payment status colors
  [PAYMENT_STATUS.PENDING]: "warning",
  [PAYMENT_STATUS.COMPLETED]: "success",
  [PAYMENT_STATUS.FAILED]: "error",
  [PAYMENT_STATUS.REFUNDED]: "info",

  // Complaint status colors
  [COMPLAINT_STATUS.OPEN]: "error",
  [COMPLAINT_STATUS.IN_PROGRESS]: "warning",
  [COMPLAINT_STATUS.RESOLVED]: "success",
  [COMPLAINT_STATUS.CLOSED]: "info",
  [COMPLAINT_STATUS.REJECTED]: "default",

  // Room status colors
  [ROOM_STATUS.AVAILABLE]: "success",
  [ROOM_STATUS.OCCUPIED]: "warning",
  [ROOM_STATUS.MAINTENANCE]: "error",
  [ROOM_STATUS.RESERVED]: "info",

  // Visitor status colors
  [VISITOR_STATUS.WAITING_APPROVAL]: "warning",
  [VISITOR_STATUS.CHECKED_IN]: "success",
  [VISITOR_STATUS.CHECKED_OUT]: "info",
  [VISITOR_STATUS.OVERSTAYED]: "error",
  [VISITOR_STATUS.REJECTED]: "default",
};

// Priority colors
export const PRIORITY_COLORS = {
  [COMPLAINT_PRIORITIES.LOW]: "success",
  [COMPLAINT_PRIORITIES.MEDIUM]: "info",
  [COMPLAINT_PRIORITIES.HIGH]: "warning",
  [COMPLAINT_PRIORITIES.URGENT]: "error",
};
