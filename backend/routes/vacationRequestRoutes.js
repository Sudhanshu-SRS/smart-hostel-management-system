const express = require("express");
const VacationRequest = require("../models/vacationRequest");
const User = require("../models/db");
const Room = require("../models/room");
const { auth, authorize } = require("../middleware/authmiddleware");
const notificationService = require("../services/notificationService");
const emailService = require("../services/emailService");

const router = express.Router();

// @route   POST /api/vacation-requests
// @desc    Student requests room vacation
// @access  Student
router.post("/", auth, authorize("student"), async (req, res) => {
  try {
    console.log("🔵 POST /vacation-requests endpoint hit");
    console.log("User:", req.user._id, "Role:", req.user.role);
    console.log("Request body:", req.body);

    const { reason } = req.body;

    // Validate required fields
    if (!reason) {
      console.log("❌ Reason not provided");
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    // Check if student has a room
    if (!req.user.room) {
      return res.status(400).json({
        success: false,
        message: "You must be assigned to a room to request vacation",
      });
    }

    // Check if there's already a pending request
    const existingRequest = await VacationRequest.findOne({
      student: req.user._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending vacation request",
      });
    }

    // Create new vacation request
    const vacationRequest = new VacationRequest({
      student: req.user._id,
      room: req.user.room,
      reason,
      status: "pending",
    });

    await vacationRequest.save();
    console.log("✅ Vacation request saved:", vacationRequest._id);

    // Populate for response
    await vacationRequest.populate("student", "name email studentId");
    await vacationRequest.populate("room", "roomNumber building floor");

    // Add vacation request to room's vacation requests history
    const room = await Room.findById(req.user.room);
    if (room) {
      room.vacationRequests.push(vacationRequest._id);
      await room.save();
    }

    // Send acknowledgment email to student - they are requesting vacation
    await emailService
      .sendRoomVacationAcknowledgmentEmail(
        req.user,
        room || vacationRequest.room
      )
      .then((result) => {
        if (result.success) {
          console.log(
            `📧 Vacation acknowledgment email sent to ${req.user.email}`
          );
        } else {
          console.error(
            `❌ Failed to send vacation acknowledgment email:`,
            result.error
          );
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending vacation acknowledgment email:`, error);
      });

    // Send notifications to admins and wardens
    const adminsWardens = await User.find({
      role: { $in: ["admin", "warden"] },
    });

    for (const staff of adminsWardens) {
      await emailService.sendVacationRequestNotification(
        staff,
        vacationRequest
      );
    }

    // Emit real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("vacationRequestCreated", vacationRequest);
      notificationService.emitToRole(
        io,
        ["admin", "warden"],
        "vacationRequestCreated",
        vacationRequest
      );
    }

    res.status(201).json({
      success: true,
      message: "Vacation request submitted successfully",
      vacationRequest,
    });
  } catch (error) {
    console.error("❌ Create vacation request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vacation request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/vacation-requests/my-request
// @desc    Get student's current vacation request
// @access  Student
router.get("/my-request", auth, authorize("student"), async (req, res) => {
  try {
    const vacationRequest = await VacationRequest.findOne({
      student: req.user._id,
      status: "pending",
    })
      .populate("student", "name email studentId")
      .populate("room", "roomNumber building floor")
      .populate("adminApproval.admin", "name email role")
      .populate("wardenApproval.warden", "name email role");

    res.json({
      success: true,
      vacationRequest: vacationRequest || null,
    });
  } catch (error) {
    console.error("Get my vacation request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vacation request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/vacation-requests/pending
// @desc    Get all pending vacation requests (Admin/Warden)
// @access  Admin/Warden
router.get("/pending", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const pendingRequests = await VacationRequest.find({
      status: "pending",
    })
      .populate("student", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .populate("adminApproval.admin", "name email")
      .populate("wardenApproval.warden", "name email")
      .sort({ requestDate: -1 });

    res.json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("Get pending vacation requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/vacation-requests/:id/approve-admin
// @desc    Admin approves vacation request
// @access  Admin
router.post(
  "/:id/approve-admin",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const { comments } = req.body;

      const vacationRequest = await VacationRequest.findById(req.params.id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Vacation request not found",
        });
      }

      if (vacationRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only approve pending requests",
        });
      }

      // Update admin approval
      vacationRequest.adminApproval = {
        admin: req.user._id,
        approved: true,
        approvalDate: new Date(),
        comments,
      };

      // Check if both admin and warden have approved
      if (
        vacationRequest.adminApproval.approved &&
        vacationRequest.wardenApproval?.approved
      ) {
        vacationRequest.status = "approved";
        vacationRequest.finalApprovalDate = new Date();
      }

      await vacationRequest.save();

      await vacationRequest.populate("student", "name email studentId");
      await vacationRequest.populate("room", "roomNumber building floor");

      // Send notification to student
      const student = await User.findById(vacationRequest.student);
      if (student) {
        await emailService.sendVacationRequestApprovalNotification(
          student,
          vacationRequest,
          "approved_admin"
        );
      }

      // Emit real-time notification
      const io = req.app.get("io");
      if (io) {
        io.emit("vacationRequestUpdated", vacationRequest);
        notificationService.emitToUser(
          io,
          vacationRequest.student,
          "vacationRequestUpdated",
          vacationRequest
        );
      }

      res.json({
        success: true,
        message: "Vacation request approved by admin",
        vacationRequest,
      });
    } catch (error) {
      console.error("Approve vacation request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve vacation request",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/vacation-requests/:id/approve-warden
// @desc    Warden approves vacation request
// @access  Warden
router.post(
  "/:id/approve-warden",
  auth,
  authorize("warden"),
  async (req, res) => {
    try {
      const { comments } = req.body;

      const vacationRequest = await VacationRequest.findById(req.params.id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Vacation request not found",
        });
      }

      if (vacationRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only approve pending requests",
        });
      }

      // Update warden approval
      vacationRequest.wardenApproval = {
        warden: req.user._id,
        approved: true,
        approvalDate: new Date(),
        comments,
      };

      // Check if both admin and warden have approved
      if (
        vacationRequest.adminApproval?.approved &&
        vacationRequest.wardenApproval.approved
      ) {
        vacationRequest.status = "approved";
        vacationRequest.finalApprovalDate = new Date();
      }

      await vacationRequest.save();

      await vacationRequest.populate("student", "name email studentId");
      await vacationRequest.populate("room", "roomNumber building floor");

      // Send notification to student
      const student = await User.findById(vacationRequest.student);
      if (student) {
        await emailService.sendVacationRequestApprovalNotification(
          student,
          vacationRequest,
          "approved_warden"
        );
      }

      // Emit real-time notification
      const io = req.app.get("io");
      if (io) {
        io.emit("vacationRequestUpdated", vacationRequest);
        notificationService.emitToUser(
          io,
          vacationRequest.student,
          "vacationRequestUpdated",
          vacationRequest
        );
      }

      res.json({
        success: true,
        message: "Vacation request approved by warden",
        vacationRequest,
      });
    } catch (error) {
      console.error("Approve vacation request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve vacation request",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/vacation-requests/:id/reject
// @desc    Reject vacation request (Admin/Warden)
// @access  Admin/Warden
router.post(
  "/:id/reject",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { reason: rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const vacationRequest = await VacationRequest.findById(req.params.id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Vacation request not found",
        });
      }

      if (vacationRequest.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only reject pending requests",
        });
      }

      vacationRequest.status = "rejected";
      vacationRequest.rejectionReason = rejectionReason;

      await vacationRequest.save();

      await vacationRequest.populate("student", "name email studentId");
      await vacationRequest.populate("room", "roomNumber building floor");

      // Send notification to student
      const student = await User.findById(vacationRequest.student);
      if (student) {
        await emailService.sendVacationRequestRejectionNotification(
          student,
          vacationRequest
        );
      }

      // Emit real-time notification
      const io = req.app.get("io");
      if (io) {
        io.emit("vacationRequestUpdated", vacationRequest);
        notificationService.emitToUser(
          io,
          vacationRequest.student,
          "vacationRequestUpdated",
          vacationRequest
        );
      }

      res.json({
        success: true,
        message: "Vacation request rejected",
        vacationRequest,
      });
    } catch (error) {
      console.error("Reject vacation request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject vacation request",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/vacation-requests
// @desc    Get all vacation requests (pagination, filters)
// @access  Admin/Warden
router.get("/", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const requests = await VacationRequest.find(filter)
      .populate("student", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .populate("adminApproval.admin", "name email")
      .populate("wardenApproval.warden", "name email")
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VacationRequest.countDocuments(filter);

    res.json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      requests,
    });
  } catch (error) {
    console.error("Get vacation requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vacation requests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/vacation-requests/room/:roomId
// @desc    Get all vacation requests for a specific room
// @access  Admin/Warden
router.get(
  "/room/:roomId",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const vacationRequests = await VacationRequest.find({
        room: req.params.roomId,
      })
        .populate("student", "name email studentId phoneNumber")
        .populate("room", "roomNumber building floor")
        .populate("adminApproval.admin", "name email")
        .populate("wardenApproval.warden", "name email")
        .sort({ requestDate: -1 });

      res.json({
        success: true,
        count: vacationRequests.length,
        requests: vacationRequests,
      });
    } catch (error) {
      console.error("Get room vacation requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch room vacation requests",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/vacation-requests/:id
// @desc    Delete a vacation request (Admin/Warden can delete any, Student can delete own)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const vacationRequest = await VacationRequest.findById(req.params.id);

    if (!vacationRequest) {
      return res.status(404).json({
        success: false,
        message: "Vacation request not found",
      });
    }

    // Check authorization - admin/warden can delete any, student can only delete their own
    if (
      req.user.role === "student" &&
      vacationRequest.student.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this request",
      });
    }

    // Remove from room's vacation requests array
    if (vacationRequest.room) {
      await Room.findByIdAndUpdate(
        vacationRequest.room,
        { $pull: { vacationRequests: req.params.id } },
        { new: true }
      );
    }

    // Delete the request
    await VacationRequest.findByIdAndDelete(req.params.id);

    console.log(`✅ Vacation request ${req.params.id} deleted successfully`);

    // Emit real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("vacationRequestDeleted", { requestId: req.params.id });
    }

    res.json({
      success: true,
      message: "Vacation request deleted successfully",
    });
  } catch (error) {
    console.error("Delete vacation request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vacation request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/vacation-requests/:id/clear
// @desc    Clear a student's pending vacation request (Admin/Warden only)
// @access  Admin/Warden
router.post(
  "/:id/clear",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const vacationRequest = await VacationRequest.findById(req.params.id);

      if (!vacationRequest) {
        return res.status(404).json({
          success: false,
          message: "Vacation request not found",
        });
      }

      // Remove from room's vacation requests array
      if (vacationRequest.room) {
        await Room.findByIdAndUpdate(
          vacationRequest.room,
          { $pull: { vacationRequests: req.params.id } },
          { new: true }
        );
      }

      // Delete the request
      await VacationRequest.findByIdAndDelete(req.params.id);

      console.log(
        `✅ Vacation request ${req.params.id} cleared by admin/warden`
      );

      // Emit real-time notification
      const io = req.app.get("io");
      if (io) {
        io.emit("vacationRequestCleared", { requestId: req.params.id });
      }

      res.json({
        success: true,
        message: "Vacation request cleared successfully",
      });
    } catch (error) {
      console.error("Clear vacation request error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear vacation request",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
