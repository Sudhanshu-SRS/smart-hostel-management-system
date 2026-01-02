const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/db");
const { auth } = require("../middleware/authmiddleware");
const { validateRegister, validateLogin } = require("../middleware/validation");
const emailService = require("../services/emailService"); // Add this import

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Helper function to generate next student ID (SHMS001, SHMS002, etc.)
const generateStudentId = async () => {
  try {
    // Get the last student created with SHMS prefix
    const lastStudent = await User.findOne(
      { studentId: { $regex: "^SHMS" } },
      { studentId: 1 },
      { sort: { createdAt: -1 } }
    );

    if (!lastStudent || !lastStudent.studentId) {
      // First student
      return "SHMS001";
    }

    // Extract number from studentId (e.g., "SHMS001" -> 1)
    const match = lastStudent.studentId.match(/SHMS(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `SHMS${String(nextNumber).padStart(3, "0")}`;
    }

    return "SHMS001";
  } catch (error) {
    console.error("Error generating student ID:", error);
    return "SHMS001";
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateRegister, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      role,
      emergencyContact,
      address,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Generate student ID automatically for students
    let studentId = null;
    if (role === "student") {
      studentId = await generateStudentId();
      console.log(`📝 Generated student ID: ${studentId}`);
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      role,
      studentId,
      emergencyContact,
      address,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email asynchronously (don't wait for it to complete)
    emailService
      .sendWelcomeEmail({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
        role: user.role,
        emergencyContact: user.emergencyContact,
      })
      .then((result) => {
        if (result.success) {
          console.log(`📧 Welcome email sent to ${user.email}`);
        } else {
          console.error(
            `❌ Failed to send welcome email to ${user.email}:`,
            result.error
          );
        }
      })
      .catch((error) => {
        console.error(`❌ Welcome email error for ${user.email}:`, error);
      });

    res.status(201).json({
      success: true,
      message: "User registered successfully! Welcome email has been sent.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email })
      .select("+password")
      .populate("room");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password - use comparePassword instead of matchPassword
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id, // Add id for frontend compatibility
        _id: user._id, // Keep _id for backend compatibility
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
        room: user.room,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        currentStatus: user.currentStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("room");

    res.json({
      success: true,
      user: {
        id: user._id, // Add id for frontend compatibility
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        studentId: user.studentId,
        room: user.room,
        profilePicture: user.profilePicture,
        currentStatus: user.currentStatus,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side mainly)
// @access  Private
router.post("/logout", auth, async (req, res) => {
  try {
    // In a real-world scenario, you might want to blacklist the token
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      user,
      resetToken
    );

    if (emailResult.success) {
      res.json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
        error:
          process.env.NODE_ENV === "development"
            ? emailResult.error
            : undefined,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
