// backend/middleware/adminMiddleware.js
const User = require("../models/db");

const adminMiddleware = async (req, res, next) => {
  try {
    // Check if it's a hardcoded admin request
    if (req.headers["x-admin-mode"] === "hardcoded") {
      // Create a fake admin user for hardcoded admin
      req.user = {
        _id: "hardcoded_admin",
        id: "hardcoded_admin",
        role: "admin",
        name: "Hardcoded Admin",
        email: "admin@shms.com",
        isActive: true,
      };
      console.log(
        `🔐 Hardcoded admin access granted for: ${req.method} ${req.path}`
      );
      return next();
    }

    // Otherwise, continue with normal flow
    next();
  } catch (error) {
    console.error("❌ Admin middleware error:", error);
    next();
  }
};

module.exports = adminMiddleware;
