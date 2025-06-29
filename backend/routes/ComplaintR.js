const express = require("express");
const Complaint = require("../models/complaint");
const User = require("../models/db");
const { auth, authorize } = require("../middleware/authmiddleware");
const { validateComplaint } = require("../middleware/validation");
const emailService = require("../services/emailService");

const router = express.Router();

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

    // Emit real-time notification to wardens and admins
    const io = req.app.get("io");
    io.emit("newComplaint", complaint);

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

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("complaintUpdated", updatedComplaint);

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

// @route   POST /api/complaints/:id/assign
// @desc    Assign complaint to staff member
// @access  Admin/Warden
router.post(
  "/:id/assign",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
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
      if (!assignee || !["warden", "admin"].includes(assignee.role)) {
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

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("complaintAssigned", complaint);

      res.json({
        success: true,
        message: "Complaint assigned successfully",
        complaint,
      });
    } catch (error) {
      console.error("Assign complaint error:", error);
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

    // Only staff can add internal comments
    const commentData = {
      user: req.user._id,
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
    console.error("Add comment error:", error);
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

module.exports = router;
