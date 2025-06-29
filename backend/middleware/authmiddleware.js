const jwt = require("jsonwebtoken");
const User = require("../models/db");

const auth = async (req, res, next) => {
  try {
    // Check if hardcoded admin (bypass token verification)
    if (req.user && req.user._id === "hardcoded_admin") {
      console.log(
        `🔐 Hardcoded admin authenticated for: ${req.method} ${req.path}`
      );
      return next();
    }

    // Normal token-based authentication
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔍 Decoded token:", decoded); // Debug log

    // Fix: Use decoded.id instead of decoded.userId
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid - user not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    req.user = user;
    console.log("✅ User authenticated:", user.email, "Role:", user.role);
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Allow hardcoded admin to access everything
    if (req.user && req.user._id === "hardcoded_admin") {
      console.log(
        `🔐 Hardcoded admin authorized for: ${req.method} ${
          req.path
        } (${roles.join(", ")})`
      );
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
