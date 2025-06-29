const express = require("express");
const Visitor = require("../models/visitors");
const User = require("../models/db");
const Room = require("../models/room");
const { auth, authorize } = require("../middleware/authmiddleware");
const { validateVisitor } = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/visitors
// @desc    Get all visitors with filters
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { status, visitingStudent, room } = req.query;
    const filter = {};

    // Students can only see visitors for their room
    if (req.user.role === "student") {
      filter.visitingStudent = req.user._id;
    }

    if (status) filter.status = status;
    if (visitingStudent) filter.visitingStudent = visitingStudent;
    if (room) filter.room = room;

    const visitors = await Visitor.find(filter)
      .populate("visitingStudent", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .populate("approvedBy", "name role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("Get visitors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/visitors/:id
// @desc    Get single visitor
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate(
        "visitingStudent",
        "name email studentId phoneNumber profilePicture"
      )
      .populate("room", "roomNumber building floor")
      .populate("approvedBy", "name role");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Students can only view visitors for their room
    if (
      req.user.role === "student" &&
      visitor.visitingStudent._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      visitor,
    });
  } catch (error) {
    console.error("Get visitor error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/visitors
// @desc    Register a new visitor
// @access  Private
router.post("/", auth, validateVisitor, async (req, res) => {
  try {
    // Students can only register visitors for their own room
    const visitingStudent =
      req.user.role === "student" ? req.user._id : req.body.visitingStudent;

    if (!visitingStudent) {
      return res.status(400).json({
        success: false,
        message: "Visiting student is required",
      });
    }

    // Get student's room
    const student = await User.findById(visitingStudent).populate("room");
    if (!student || !student.room) {
      return res.status(400).json({
        success: false,
        message: "Student does not have a room assigned",
      });
    }

    const visitorData = {
      ...req.body,
      visitingStudent,
      room: student.room._id,
    };

    // Check for existing visitor with same ID number (not checked out)
    const existingVisitor = await Visitor.findOne({
      idNumber: req.body.idNumber,
      status: { $in: ["waiting_approval", "checked_in"] },
    });

    if (existingVisitor) {
      return res.status(400).json({
        success: false,
        message: "A visitor with this ID is already in the system",
      });
    }

    const visitor = new Visitor(visitorData);
    await visitor.save();

    await visitor.populate([
      { path: "visitingStudent", select: "name email studentId phoneNumber" },
      { path: "room", select: "roomNumber building floor" },
    ]);

    // Emit real-time notification to wardens and admins
    const io = req.app.get("io");
    io.emit("newVisitorRegistration", visitor);

    res.status(201).json({
      success: true,
      message: "Visitor registered successfully",
      visitor,
    });
  } catch (error) {
    console.error("Register visitor error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/visitors/:id/approve
// @desc    Approve visitor entry
// @access  Admin/Warden
router.put(
  "/:id/approve",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found",
        });
      }

      if (visitor.status !== "waiting_approval") {
        return res.status(400).json({
          success: false,
          message: "Visitor is not waiting for approval",
        });
      }

      visitor.status = "checked_in";
      visitor.approvedBy = req.user._id;
      visitor.approvalTime = new Date();
      visitor.checkInTime = new Date();

      await visitor.save();

      await visitor.populate([
        { path: "visitingStudent", select: "name email studentId phoneNumber" },
        { path: "room", select: "roomNumber building floor" },
        { path: "approvedBy", select: "name role" },
      ]);

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("visitorApproved", visitor);

      res.json({
        success: true,
        message: "Visitor approved and checked in",
        visitor,
      });
    } catch (error) {
      console.error("Approve visitor error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/visitors/:id/reject
// @desc    Reject visitor entry
// @access  Admin/Warden
router.put(
  "/:id/reject",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found",
        });
      }

      if (visitor.status !== "waiting_approval") {
        return res.status(400).json({
          success: false,
          message: "Visitor is not waiting for approval",
        });
      }

      visitor.status = "rejected";
      visitor.rejectionReason = rejectionReason;
      visitor.approvedBy = req.user._id;
      visitor.approvalTime = new Date();

      await visitor.save();

      await visitor.populate([
        { path: "visitingStudent", select: "name email studentId phoneNumber" },
        { path: "room", select: "roomNumber building floor" },
        { path: "approvedBy", select: "name role" },
      ]);

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("visitorRejected", visitor);

      res.json({
        success: true,
        message: "Visitor entry rejected",
        visitor,
      });
    } catch (error) {
      console.error("Reject visitor error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/visitors/:id/checkout
// @desc    Check out visitor
// @access  Admin/Warden
router.put(
  "/:id/checkout",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({
          success: false,
          message: "Visitor not found",
        });
      }

      if (visitor.status !== "checked_in" && visitor.status !== "overstayed") {
        return res.status(400).json({
          success: false,
          message: "Visitor is not checked in",
        });
      }

      visitor.status = "checked_out";
      visitor.actualCheckOutTime = new Date();

      await visitor.save();

      await visitor.populate([
        { path: "visitingStudent", select: "name email studentId phoneNumber" },
        { path: "room", select: "roomNumber building floor" },
        { path: "approvedBy", select: "name role" },
      ]);

      // Emit real-time notification
      const io = req.app.get("io");
      io.emit("visitorCheckedOut", visitor);

      res.json({
        success: true,
        message: "Visitor checked out successfully",
        visitor,
      });
    } catch (error) {
      console.error("Checkout visitor error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/visitors/active/count
// @desc    Get count of active visitors
// @access  Admin/Warden
router.get(
  "/active/count",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const activeCount = await Visitor.countDocuments({
        status: { $in: ["checked_in", "overstayed"] },
      });

      const waitingApprovalCount = await Visitor.countDocuments({
        status: "waiting_approval",
      });

      res.json({
        success: true,
        activeVisitors: activeCount,
        waitingApproval: waitingApprovalCount,
      });
    } catch (error) {
      console.error("Get active visitors count error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/visitors/stats/summary
// @desc    Get visitor statistics
// @access  Admin/Warden
router.get(
  "/stats/summary",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const stats = await Visitor.aggregate([
        {
          $group: {
            _id: null,
            totalVisitors: { $sum: 1 },
            checkedInVisitors: {
              $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
            },
            checkedOutVisitors: {
              $sum: { $cond: [{ $eq: ["$status", "checked_out"] }, 1, 0] },
            },
            overstayedVisitors: {
              $sum: { $cond: [{ $eq: ["$status", "overstayed"] }, 1, 0] },
            },
            waitingApproval: {
              $sum: { $cond: [{ $eq: ["$status", "waiting_approval"] }, 1, 0] },
            },
            rejectedVisitors: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
          },
        },
      ]);

      const visitorStats = stats[0] || {
        totalVisitors: 0,
        checkedInVisitors: 0,
        checkedOutVisitors: 0,
        overstayedVisitors: 0,
        waitingApproval: 0,
        rejectedVisitors: 0,
      };

      res.json({
        success: true,
        stats: visitorStats,
      });
    } catch (error) {
      console.error("Get visitor stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/visitors/check-overstay
// @desc    Check for overstayed visitors and update status
// @access  Admin/Warden
router.post(
  "/check-overstay",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const overstayedVisitors = await Visitor.updateMany(
        {
          status: "checked_in",
          expectedCheckOutTime: { $lt: new Date() },
        },
        {
          $set: { status: "overstayed" },
        }
      );

      res.json({
        success: true,
        message: `Updated ${overstayedVisitors.modifiedCount} overstayed visitors`,
        modifiedCount: overstayedVisitors.modifiedCount,
      });
    } catch (error) {
      console.error("Check overstay error:", error);
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
