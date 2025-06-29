// admin/src/config/adminConfig.js
export const ADMIN_CREDENTIALS = {
  email: "admin@shms.com",
  password: "admin123456",
  name: "System Administrator",
  role: "admin",
};

export const WARDEN_CREDENTIALS = {
  email: "warden@shms.com",
  password: "warden123456",
  name: "Hostel Warden",
  role: "warden",
};

// You can add more hardcoded admin accounts here
export const HARDCODED_ADMINS = [
  ADMIN_CREDENTIALS,
  WARDEN_CREDENTIALS,
  {
    email: "superadmin@shms.com",
    password: "superadmin123",
    name: "Super Administrator",
    role: "admin",
  },
];

export default {
  ADMIN_CREDENTIALS,
  WARDEN_CREDENTIALS,
  HARDCODED_ADMINS,
};
