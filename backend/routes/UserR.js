const express = require("express");
const User = require("../models/db");
const { auth, authorize } = require("../middleware/authmiddleware");
 const adminMiddleware = require("../middleware/adminMiddleware");

// Import multer and cloudinary utilities if you have them
// If not, comment out the upload routes
const multer = require("multer");

// Simple multer configuration (if cloudinary utils are not available)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = express.Router();

// 🔥 CRITICAL: Add admin middleware FIRST - before any other middleware
router.use(adminMiddleware);

// @route   GET /api/users
// @desc    Get all users with filtering
// @access  Admin/Warden
router.get("/", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    console.log("📋 Fetching users - User role:", req.user?.role);
    console.log("📋 Query params:", req.query);

    const { page = 1, limit = 10, search = "", role, isActive } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    console.log("📋 Applied filter:", filter);

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("room", "roomNumber building floor")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    console.log(`📋 Found ${users.length} users out of ${totalCount} total`);

    res.json({
      success: true,
      users,
      count: totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("❌ Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/users/stats/summary
// @desc    Get user statistics
// @access  Admin/Warden
router.get(
  "/stats/summary",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      console.log("📊 Fetching user stats - User role:", req.user?.role);

      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            students: {
              $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] },
            },
            wardens: {
              $sum: { $cond: [{ $eq: ["$role", "warden"] }, 1, 0] },
            },
            admins: {
              $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
            },
            usersWithRooms: {
              $sum: { $cond: [{ $ne: ["$room", null] }, 1, 0] },
            },
          },
        },
      ]);

      const userStats = stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        students: 0,
        wardens: 0,
        admins: 0,
        usersWithRooms: 0,
      };

      console.log("📊 User stats result:", userStats);

      res.json({
        success: true,
        stats: userStats,
      });
    } catch (error) {
      console.error("❌ Get user stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (own profile) / Admin/Warden (any profile)
router.get("/:id", auth, async (req, res) => {
  try {
    // Users can only view their own profile unless they're admin/warden
    if (
      req.user.role === "student" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("room", "roomNumber building floor capacity occupants");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
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

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (own profile) / Admin (any profile)
router.put("/:id", auth, async (req, res) => {
  try {
    // Students can only update their own profile
    if (
      req.user.role === "student" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Prevent students from changing their role
    if (req.user.role === "student" && req.body.role) {
      delete req.body.role;
    }

    // Prevent non-admins from changing admin-only fields
    if (req.user.role !== "admin") {
      delete req.body.isActive;
      delete req.body.role;
    }

    // Don't allow password updates through this route
    delete req.body.password;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("room", "roomNumber building floor");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Admin only
router.put("/:id/toggle-status", auth, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow deactivating yourself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Admin only
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow deleting yourself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
