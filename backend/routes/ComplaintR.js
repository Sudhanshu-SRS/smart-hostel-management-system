const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/complaint");
const User = require("../models/db");
const { auth, authorize } = require("../middleware/authmiddleware");
const { validateComplaint } = require("../middleware/validation");
const emailService = require("../services/emailService");
const notificationService = require("../services/notificationService");

const router = express.Router();

// Helper function to resolve hardcoded admin to a real admin user ObjectId
const resolveUserId = async (userId) => {
  // If it's hardcoded admin, get the first real admin user from DB
  if (userId === "hardcoded_admin") {
    try {
      const adminUser = await User.findOne({ role: "admin" }).select("_id");
      if (adminUser) {
        console.log(
          "✅ Resolved hardcoded admin to real admin:",
          adminUser._id
        );
        return adminUser._id;
      }
      // If no admin exists, try warden
      console.warn(
        "⚠️ No admin user found in database for hardcoded admin request"
      );
      const warden = await User.findOne({ role: "warden" }).select("_id");
      if (warden) {
        console.log("⚠️ Using warden instead of admin:", warden._id);
        return warden._id;
      }
      // If still no user found, get any staff member
      const staff = await User.findOne({
        role: { $in: ["admin", "warden", "staff"] },
      }).select("_id");
      if (staff) {
        console.log("⚠️ Using available staff member:", staff._id);
        return staff._id;
      }

      // Last resort: Create a system/default ObjectId for hardcoded admin
      // This uses a reserved ObjectId pattern for system users
      const systemAdminId = new mongoose.Types.ObjectId(
        "000000000000000000000001"
      );
      console.warn(
        "⚠️ No users found - using system admin ObjectId:",
        systemAdminId
      );
      return systemAdminId;
    } catch (error) {
      console.error("❌ Error resolving hardcoded admin:", error);
      // Return system admin ObjectId as fallback
      return new mongoose.Types.ObjectId("000000000000000000000001");
    }
  }
  // If it's a valid ObjectId string, return it as-is
  return userId;
};

// ==================== BASE ROUTES ====================

// @route   GET /api/complaints
// @desc    Get all complaints with filters
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { status, category, priority, assignedTo } = req.query;
    const filter = {};

    // Students can only see their own complaints
    if (req.user.role === "student") {
      filter.user = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const complaints = await Complaint.find(filter)
      .populate("user", "name email studentId phoneNumber")
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber building floor")
      .populate("comments.user", "name role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private
router.post("/", auth, validateComplaint, async (req, res) => {
  try {
    const complaintData = {
      ...req.body,
      user: req.user._id,
      room: req.user.room,
    };

    const complaint = new Complaint(complaintData);
    await complaint.save();

    await complaint.populate([
      { path: "user", select: "name email studentId phoneNumber" },
      { path: "room", select: "roomNumber building floor" },
    ]);

    // Send notification to staff
    await notificationService.sendComplaintNotification(complaint, "new");

    // Send acknowledgment email to complainant
    await emailService
      .sendComplaintAcknowledgmentEmail(req.user, complaint)
      .then((result) => {
        if (result.success) {
          console.log(
            `📧 Complaint acknowledgment email sent to ${req.user.email}`
          );
        } else {
          console.error(
            `❌ Failed to send complaint acknowledgment email:`,
            result.error
          );
        }
      })
      .catch((error) => {
        console.error(
          `❌ Error sending complaint acknowledgment email:`,
          error
        );
      });

    // Emit real-time notification to wardens and admins
    const io = req.app.get("io");
    io.emit("newComplaint", complaint);
    notificationService.emitToRole(
      io,
      ["admin", "warden"],
      "newComplaint",
      complaint
    );

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ==================== BULK OPERATIONS (before specific /:id routes) ====================

// @route   POST /api/complaints/bulk-assign
// @desc    Bulk assign complaints to staff members
// @access  Admin/Warden
router.post(
  "/bulk-assign",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { complaintIds, assignedTo } = req.body;

      if (
        !complaintIds ||
        !Array.isArray(complaintIds) ||
        complaintIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Complaint IDs are required",
        });
      }

      if (!assignedTo) {
        return res.status(400).json({
          success: false,
          message: "Assignee is required",
        });
      }

      // Verify assignee exists and has appropriate role
      const assignee = await User.findById(assignedTo);
      if (!assignee || !["warden", "admin", "staff"].includes(assignee.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignee",
        });
      }

      const result = await Complaint.updateMany(
        { _id: { $in: complaintIds } },
        {
          assignedTo: assignedTo,
          status: "in_progress",
        }
      );

      const updatedComplaints = await Complaint.find({
        _id: { $in: complaintIds },
      })
        .populate("user", "name email studentId")
        .populate("assignedTo", "name email role");

      // Emit real-time notifications
      const io = req.app.get("io");
      io.emit("complaintsBulkAssigned", {
        complaints: updatedComplaints,
        assignedTo: assignee,
      });

      res.json({
        success: true,
        message: `${result.modifiedCount} complaints assigned successfully`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Bulk assign error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/complaints/bulk-update-status
// @desc    Bulk update complaint status
// @access  Admin/Warden
router.post(
  "/bulk-update-status",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { complaintIds, status } = req.body;

      if (
        !complaintIds ||
        !Array.isArray(complaintIds) ||
        complaintIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Complaint IDs are required",
        });
      }

      if (
        !status ||
        !["open", "in_progress", "resolved", "closed", "rejected"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid status is required",
        });
      }

      const updateData = { status };
      if (status === "resolved") {
        updateData.actualResolutionDate = new Date();
      }

      const result = await Complaint.updateMany(
        { _id: { $in: complaintIds } },
        updateData
      );

      const updatedComplaints = await Complaint.find({
        _id: { $in: complaintIds },
      })
        .populate("user", "name email studentId")
        .populate("assignedTo", "name email role");

      // Emit real-time notifications
      const io = req.app.get("io");
      io.emit("complaintsBulkUpdated", {
        complaints: updatedComplaints,
        status,
      });

      res.json({
        success: true,
        message: `${result.modifiedCount} complaints updated successfully`,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Bulk update status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ==================== NAMED/SPECIFIC ROUTES (before /:id routes) ====================

// @route   GET /api/complaints/stats/summary
// @desc    Get complaint statistics
// @access  Admin/Warden
router.get(
  "/stats/summary",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const stats = await Complaint.aggregate([
        {
          $group: {
            _id: null,
            totalComplaints: { $sum: 1 },
            openComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
            },
            inProgressComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
            },
            resolvedComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
            closedComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
            },
            urgentComplaints: {
              $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
            },
            averageRating: { $avg: "$rating" },
          },
        },
      ]);

      const categoryStats = await Complaint.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);

      const complaintStats = stats[0] || {
        totalComplaints: 0,
        openComplaints: 0,
        inProgressComplaints: 0,
        resolvedComplaints: 0,
        closedComplaints: 0,
        urgentComplaints: 0,
        averageRating: 0,
      };

      res.json({
        success: true,
        stats: complaintStats,
        categoryStats,
      });
    } catch (error) {
      console.error("Get complaint stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/complaints/overdue
// @desc    Get overdue complaints
// @access  Admin/Warden
router.get("/overdue", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    console.log("🔍 Fetching overdue complaints...");
    const currentDate = new Date();
    const urgentThreshold = new Date(currentDate - 24 * 60 * 60 * 1000); // 24 hours ago
    const normalThreshold = new Date(currentDate - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    console.log("📅 Current date:", currentDate);
    console.log("⏰ Urgent threshold:", urgentThreshold);
    console.log("⏰ Normal threshold:", normalThreshold);

    const overdueComplaints = await Complaint.find({
      status: { $in: ["open", "in_progress"] },
      $or: [
        {
          priority: "urgent",
          createdAt: { $lt: urgentThreshold },
        },
        {
          priority: { $in: ["high", "medium", "low"] },
          createdAt: { $lt: normalThreshold },
        },
      ],
    })
      .populate("user", "name email studentId phoneNumber")
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber building floor")
      .sort({ createdAt: 1 });

    console.log("📊 Found overdue complaints:", overdueComplaints.length);

    res.json({
      success: true,
      count: overdueComplaints.length,
      complaints: overdueComplaints,
    });
  } catch (error) {
    console.error("❌ Get overdue complaints error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/complaints/sla-metrics
// @desc    Get SLA compliance metrics
// @access  Admin/Warden
router.get(
  "/sla-metrics",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      console.log("📊 Fetching SLA metrics...");
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      console.log("📅 Thirty days ago:", thirtyDaysAgo);

      const complaints = await Complaint.find({
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: ["resolved", "closed"] },
      });

      console.log("📋 Found resolved complaints:", complaints.length);

      const slaMetrics = {
        urgent: { total: 0, withinSLA: 0, slaTarget: 24 }, // 24 hours
        high: { total: 0, withinSLA: 0, slaTarget: 72 }, // 3 days
        medium: { total: 0, withinSLA: 0, slaTarget: 168 }, // 7 days
        low: { total: 0, withinSLA: 0, slaTarget: 336 }, // 14 days
      };

      complaints.forEach((complaint) => {
        console.log(`🔍 Processing complaint ${complaint._id}:`, {
          priority: complaint.priority,
          createdAt: complaint.createdAt,
          actualResolutionDate: complaint.actualResolutionDate,
          status: complaint.status,
        });

        if (!complaint.actualResolutionDate) {
          console.log(
            `⚠️ Complaint ${complaint._id} has no actualResolutionDate`
          );
          return;
        }

        const resolutionTime =
          (complaint.actualResolutionDate - complaint.createdAt) /
          (1000 * 60 * 60); // in hours
        const priority = complaint.priority;

        console.log(
          `⏱️ Complaint ${complaint._id} resolution time: ${resolutionTime}h`
        );

        if (slaMetrics[priority]) {
          slaMetrics[priority].total++;
          if (resolutionTime <= slaMetrics[priority].slaTarget) {
            slaMetrics[priority].withinSLA++;
          }
          console.log(`📊 Updated ${priority} metrics:`, slaMetrics[priority]);
        }
      });

      // Calculate compliance percentages
      Object.keys(slaMetrics).forEach((priority) => {
        const metric = slaMetrics[priority];
        metric.complianceRate =
          metric.total > 0 ? (metric.withinSLA / metric.total) * 100 : 0;
      });

      // Overall SLA compliance
      const totalComplaints = Object.values(slaMetrics).reduce(
        (sum, m) => sum + m.total,
        0
      );
      const totalWithinSLA = Object.values(slaMetrics).reduce(
        (sum, m) => sum + m.withinSLA,
        0
      );
      const overallCompliance =
        totalComplaints > 0 ? (totalWithinSLA / totalComplaints) * 100 : 0;

      console.log("✅ SLA metrics calculated successfully");

      res.json({
        success: true,
        slaMetrics,
        overallCompliance,
        period: "Last 30 days",
      });
    } catch (error) {
      console.error("❌ Get SLA metrics error:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ==================== SPECIFIC /:id/* ROUTES (before generic /:id routes) ====================

// @route   POST /api/complaints/:id/assign
// @desc    Assign complaint to staff member
// @access  Admin/Warden
router.post(
  "/:id/assign",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      console.log("🔵 POST /:id/assign endpoint hit");
      const { assignedTo } = req.body;

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      // Verify assignee exists and has appropriate role
      const assignee = await User.findById(assignedTo);
      if (!assignee || !["warden", "admin", "staff"].includes(assignee.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignee",
        });
      }

      complaint.assignedTo = assignedTo;
      complaint.status = "in_progress";
      await complaint.save();

      await complaint.populate([
        { path: "user", select: "name email studentId phoneNumber" },
        { path: "assignedTo", select: "name email role" },
        { path: "room", select: "roomNumber building floor" },
      ]);

      console.log("✅ Complaint assigned successfully");

      // Send assignment notification
      await notificationService.sendComplaintNotification(
        complaint,
        "assigned"
      );

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("complaintAssigned", complaint);
      notificationService.emitToUser(
        io,
        complaint.user._id,
        "complaintAssigned",
        complaint
      );
      notificationService.emitToUser(
        io,
        assignedTo,
        "complaintAssigned",
        complaint
      );

      res.json({
        success: true,
        message: "Complaint assigned successfully",
        complaint,
      });
    } catch (error) {
      console.error("❌ Assign complaint error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/complaints/:id/comments
// @desc    Add comment to complaint
// @access  Private
router.post("/:id/comments", auth, async (req, res) => {
  try {
    console.log("🔵 POST /:id/comments endpoint hit");
    const { comment, isInternal } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user has access to this complaint
    if (
      req.user.role === "student" &&
      complaint.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Resolve hardcoded admin to real admin ObjectId
    const resolvedUserId = await resolveUserId(req.user._id);
    if (!resolvedUserId) {
      return res.status(500).json({
        success: false,
        message: "Cannot resolve user for comment - no admin found",
      });
    }

    // Only staff can add internal comments
    const commentData = {
      user: resolvedUserId,
      comment: comment.trim(),
      isInternal: req.user.role !== "student" ? isInternal : false,
    };

    complaint.comments.push(commentData);
    await complaint.save();

    await complaint.populate([
      { path: "user", select: "name email studentId phoneNumber" },
      { path: "assignedTo", select: "name email role" },
      { path: "comments.user", select: "name role profilePicture" },
    ]);

    console.log("✅ Comment added successfully");

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("complaintCommentAdded", {
      complaintId: complaint._id,
      comment: commentData,
      user: {
        name: req.user.name,
        role: req.user.role,
      },
    });

    res.json({
      success: true,
      message: "Comment added successfully",
      complaint,
    });
  } catch (error) {
    console.error("❌ Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/complaints/:id/resolve
// @desc    Mark complaint as resolved
// @access  Admin/Warden/Assigned Staff
router.post(
  "/:id/resolve",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { resolutionNotes, cost } = req.body;

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      // Check if user is assigned to this complaint or is admin/warden
      if (
        complaint.assignedTo &&
        complaint.assignedTo.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only assigned staff member or admin can resolve this complaint",
        });
      }

      complaint.status = "resolved";
      complaint.actualResolutionDate = new Date();
      complaint.resolutionNotes = resolutionNotes;
      complaint.cost = cost;

      await complaint.save();

      await complaint.populate([
        { path: "user", select: "name email studentId phoneNumber" },
        { path: "assignedTo", select: "name email role" },
        { path: "room", select: "roomNumber building floor" },
      ]);

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("complaintResolved", complaint);

      res.json({
        success: true,
        message: "Complaint marked as resolved",
        complaint,
      });
    } catch (error) {
      console.error("Resolve complaint error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/complaints/:id/feedback
// @desc    Add feedback and rating to resolved complaint
// @access  Student (complaint owner)
router.post("/:id/feedback", auth, authorize("student"), async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user owns this complaint
    if (complaint.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if complaint is resolved
    if (complaint.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "Can only provide feedback for resolved complaints",
      });
    }

    complaint.rating = rating;
    complaint.feedback = feedback;
    complaint.status = "closed";

    await complaint.save();

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Add feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/complaints/:id/escalate
// @desc    Escalate complaint to higher priority
// @access  Admin/Warden
router.post(
  "/:id/escalate",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { reason } = req.body;

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found",
        });
      }

      // Escalate priority
      const priorityLevels = ["low", "medium", "high", "urgent"];
      const currentIndex = priorityLevels.indexOf(complaint.priority);

      if (currentIndex < priorityLevels.length - 1) {
        complaint.priority = priorityLevels[currentIndex + 1];
      } else {
        return res.status(400).json({
          success: false,
          message: "Complaint is already at highest priority",
        });
      }

      // Add escalation comment
      complaint.comments.push({
        user: req.user._id,
        comment: `Complaint escalated to ${
          complaint.priority
        } priority. Reason: ${reason || "No reason provided"}`,
        isInternal: true,
      });

      await complaint.save();

      await complaint.populate([
        { path: "user", select: "name email studentId phoneNumber" },
        { path: "assignedTo", select: "name email role" },
        { path: "room", select: "roomNumber building floor" },
      ]);

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("complaintEscalated", complaint);

      res.json({
        success: true,
        message: "Complaint escalated successfully",
        complaint,
      });
    } catch (error) {
      console.error("Escalate complaint error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ==================== GENERIC /:id ROUTES (MUST BE LAST) ====================

// @route   GET /api/complaints/:id
// @desc    Get single complaint
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email studentId phoneNumber profilePicture")
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber building floor")
      .populate("comments.user", "name role profilePicture");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Students can only view their own complaints
    if (
      req.user.role === "student" &&
      complaint.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Students can only update their own complaints and only if status is 'open'
    if (req.user.role === "student") {
      if (complaint.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      if (complaint.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "Cannot update complaint that is not open",
        });
      }
      // Students can only update certain fields
      const allowedFields = ["title", "description", "category"];
      req.body = Object.keys(req.body)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});
    }

    // Auto-set resolution date if status is being changed to resolved
    if (req.body.status === "resolved" && complaint.status !== "resolved") {
      req.body.actualResolutionDate = new Date();
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: "user", select: "name email studentId phoneNumber" },
      { path: "assignedTo", select: "name email role" },
      { path: "room", select: "roomNumber building floor" },
    ]);

    // Send notifications based on status change
    if (req.body.status === "resolved" && complaint.status !== "resolved") {
      await notificationService.sendComplaintNotification(
        updatedComplaint,
        "resolved"
      );
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("complaintUpdated", updatedComplaint);
    notificationService.emitToUser(
      io,
      updatedComplaint.user._id,
      "complaintUpdated",
      updatedComplaint
    );
    if (updatedComplaint.assignedTo) {
      notificationService.emitToUser(
        io,
        updatedComplaint.assignedTo._id,
        "complaintUpdated",
        updatedComplaint
      );
    }

    // Send email notification if complaint is resolved or in progress
    if (
      updatedComplaint.status === "resolved" ||
      updatedComplaint.status === "in_progress"
    ) {
      const user = await User.findById(updatedComplaint.user);
      if (user) {
        emailService.sendComplaintNotificationEmail(user, updatedComplaint);
      }
    }

    res.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
