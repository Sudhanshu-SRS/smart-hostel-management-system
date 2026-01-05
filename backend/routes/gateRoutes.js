// backend/routes/gateRoutes.js
const express = require("express");
const Gate = require("../models/gate");
const EntryExitLog = require("../models/EntryExit");
const User = require("../models/db");
const { auth, authorize } = require("../middleware/authmiddleware");
const qrCodeService = require("../services/qrCodeService");
const emailService = require("../services/emailService");

const router = express.Router();

// @route   GET /api/gates
// @desc    Get all gates
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const gates = await Gate.find({ isActive: true })
      .populate("wardenInCharge", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: gates.length,
      gates,
    });
  } catch (error) {
    console.error("Get gates error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/gates
// @desc    Create a new gate
// @access  Admin/Warden only
router.post("/", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const { gateName, location, wardenInCharge, workingHours } = req.body;

    // Generate QR code for the gate
    const { qrData, qrCodeDataURL } = await qrCodeService.generateGateQR(
      null, // gateId will be generated automatically
      { gateName, location }
    );

    const gate = new Gate({
      gateName,
      location,
      wardenInCharge: wardenInCharge || req.user._id,
      qrCodeData: qrData,
      qrCodeImage: qrCodeDataURL,
      workingHours,
    });

    await gate.save();
    await gate.populate("wardenInCharge", "name email role");

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("gateCreated", gate);
    }

    res.status(201).json({
      success: true,
      message: "Gate created successfully",
      gate,
    });
  } catch (error) {
    console.error("Create gate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create gate",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/gates/scan-student-qr
// @desc    Scan student QR code for entry/exit
// @access  Admin/Warden only
router.post(
  "/scan-student-qr",
  auth,
  authorize("admin", "warden"), // Allow both admin and warden
  async (req, res) => {
    try {
      const {
        studentQRData,
        gateId,
        outingReason,
        expectedReturnTime,
        location,
      } = req.body;

      console.log("🔍 Student QR Scan Request:", {
        scannerUser: req.user.name,
        gateId,
        outingReason: outingReason?.substring(0, 50) + "...",
      });

      // Verify student QR code
      const verifiedStudentQR = qrCodeService.verifyQRCode(studentQRData);

      if (verifiedStudentQR.type !== "student_entry_exit") {
        return res.status(400).json({
          success: false,
          message: "Invalid student QR code type",
        });
      }

      // Find the student
      const student = await User.findById(verifiedStudentQR.studentId).populate(
        "room",
        "roomNumber building floor"
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      // Find the gate
      const gate = await Gate.findById(gateId);
      if (!gate || !gate.isActive) {
        return res.status(404).json({
          success: false,
          message: "Gate not found or inactive",
        });
      }

      // Check if gate is within working hours
      const currentTime = new Date().toTimeString().substr(0, 5);
      if (
        currentTime < gate.workingHours.start ||
        currentTime > gate.workingHours.end
      ) {
        console.warn(`⚠️ Gate access outside working hours: ${currentTime}`);
      }

      // Determine action type based on student's current status and last log
      const lastLog = await EntryExitLog.findOne({ student: student._id })
        .sort({ createdAt: -1 })
        .populate("gate", "gateName location");

      let actionType = "exit"; // Default to exit

      if (!lastLog || lastLog.actionType === "entry") {
        actionType = "exit";
      } else {
        actionType = "entry";
      }

      // For exit, require reason and expected return time
      if (actionType === "exit" && (!outingReason || !expectedReturnTime)) {
        return res.status(400).json({
          success: false,
          message:
            "Outing reason and expected return time are required for exit",
        });
      }

      // Create entry/exit log
      const logData = {
        student: student._id,
        gate: gate._id,
        actionType,
        approvedBy: req.user._id,
        location,
      };

      if (actionType === "exit") {
        logData.outingReason = outingReason;
        logData.expectedReturnTime = new Date(expectedReturnTime);
      }

      const entryExitLog = new EntryExitLog(logData);

      // Check for late return if this is an entry
      if (actionType === "entry" && lastLog && lastLog.expectedReturnTime) {
        entryExitLog.checkLateReturn();
        if (entryExitLog.isLateReturn) {
          console.warn(`⚠️ Late return detected for student: ${student.name}`);
        }
      }

      await entryExitLog.save();

      // Populate the log for response and notifications
      await entryExitLog.populate([
        {
          path: "student",
          select: "name email studentId parentGuardianContact room",
        },
        { path: "gate", select: "gateName location" },
        { path: "approvedBy", select: "name role" },
      ]);

      // Update student's current status and timestamps
      const updateData = {
        currentStatus: actionType === "exit" ? "out_of_hostel" : "in_hostel",
      };

      if (actionType === "exit") {
        updateData.lastExitTime = new Date();
      } else {
        updateData.lastEntryTime = new Date();
      }

      await User.findByIdAndUpdate(student._id, updateData);

      // Send notifications
      try {
        await emailService.sendEntryExitNotification(
          entryExitLog.student,
          actionType,
          {
            outingReason: entryExitLog.outingReason,
            expectedReturnTime: entryExitLog.expectedReturnTime,
            gate: entryExitLog.gate,
            approvedBy: entryExitLog.approvedBy,
          }
        );

        // Send late return alert if applicable
        if (entryExitLog.isLateReturn) {
          await emailService.sendLateReturnAlert(entryExitLog.student, {
            expectedReturnTime: lastLog.expectedReturnTime,
            actualReturnTime: entryExitLog.createdAt,
            outingReason: lastLog.outingReason,
            gate: entryExitLog.gate,
          });

          // Update notification status
          entryExitLog.notificationsSent.lateReturnAlert = true;
          await entryExitLog.save();
        }

        // Update notification status
        entryExitLog.notificationsSent.parentEmail = true;
        entryExitLog.notificationsSent.wardenEmail = true;
        await entryExitLog.save();
      } catch (emailError) {
        console.error("❌ Email notification error:", emailError);
        // Don't fail the request if email fails
      }

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.emit("entryExitRecorded", {
          type: "entry_exit",
          action: actionType,
          student: {
            name: student.name,
            studentId: student.studentId,
            room: student.room?.roomNumber,
          },
          gate: {
            name: gate.gateName,
            location: gate.location,
          },
          timestamp: entryExitLog.createdAt,
          isLateReturn: entryExitLog.isLateReturn,
          approvedBy: req.user.name,
        });
      }

      res.json({
        success: true,
        message: `${
          actionType.charAt(0).toUpperCase() + actionType.slice(1)
        } recorded successfully${
          entryExitLog.isLateReturn ? " (Late Return Detected)" : ""
        }`,
        data: {
          logId: entryExitLog._id,
          actionType,
          student: {
            name: student.name,
            studentId: student.studentId,
            room: student.room?.roomNumber,
          },
          gate: {
            name: gate.gateName,
            location: gate.location,
          },
          timestamp: entryExitLog.createdAt,
          outingReason: entryExitLog.outingReason,
          expectedReturnTime: entryExitLog.expectedReturnTime,
          isLateReturn: entryExitLog.isLateReturn,
          approvedBy: req.user.name,
        },
      });
    } catch (error) {
      console.error("❌ Student QR scan error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process student QR scan",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// @route   POST /api/gates/record-attendance
// @desc    Record attendance via face recognition
// @access  Admin/Warden
router.post(
  "/record-attendance",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const {
        studentId,
        gateId,
        recognitionConfidence,
        attendanceMethod = "face_recognition",
        wardenId,
      } = req.body;

      // Find student
      const student = await User.findOne({ studentId }).populate("room");
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      // Find gate
      const gate = await Gate.findById(gateId);
      if (!gate) {
        return res.status(404).json({
          success: false,
          message: "Gate not found",
        });
      }

      // Determine action based on current status
      const action = student.currentStatus === "in_hostel" ? "exit" : "entry";

      // Create entry/exit log
      const logData = {
        student: student._id,
        gate: gateId,
        actionType: action,
        method: attendanceMethod,
        recognitionConfidence: recognitionConfidence,
        approvedBy: req.user._id,
        additionalData: {
          wardenId: wardenId,
          autoProcessed: true,
          timestamp: new Date(),
        },
      };

      // Add exit-specific data
      if (action === "exit") {
        logData.outingReason = "Face Recognition Exit";
        logData.expectedReturnTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours default
      }

      const log = new EntryExitLog(logData);
      await log.save();

      // Update student status
      student.currentStatus = action === "exit" ? "out_of_hostel" : "in_hostel";
      if (action === "exit") {
        student.lastExitTime = new Date();
      } else {
        student.lastEntryTime = new Date();
      }
      await student.save();

      await log.populate([
        {
          path: "student",
          select: "name studentId email phoneNumber profilePicture",
        },
        { path: "gate", select: "gateName location" },
        { path: "approvedBy", select: "name role" },
      ]);

      // Send notifications
      try {
        // Email to parents/guardians
        if (student.parentGuardianContact?.email) {
          await emailService.sendEntryExitNotification(student, action, {
            gate,
            outingReason: logData.outingReason,
            expectedReturnTime: logData.expectedReturnTime,
            approvedBy: req.user,
            recognitionConfidence,
          });
        }

        // Real-time notification
        const io = req.app.get("io");
        io.emit("attendanceRecorded", {
          student: {
            name: student.name,
            studentId: student.studentId,
            profilePicture: student.profilePicture,
          },
          action,
          gate: gate.gateName,
          method: attendanceMethod,
          confidence: recognitionConfidence,
          timestamp: new Date(),
        });
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
        // Don't fail the main operation for notification errors
      }

      res.json({
        success: true,
        message: `${action} recorded successfully via face recognition`,
        action,
        log,
        student: {
          name: student.name,
          studentId: student.studentId,
          currentStatus: student.currentStatus,
        },
        confidence: recognitionConfidence,
      });
    } catch (error) {
      console.error("Record attendance error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/gates/entry-exit-logs
// @desc    Get entry/exit logs with filters
// @access  Private
router.get("/entry-exit-logs", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      studentId,
      gateId,
      actionType,
      startDate,
      endDate,
      isLateReturn,
    } = req.query;

    const user = req.user;

    // Build filter
    const filter = {};

    // Students can only see their own logs
    if (user.role === "student") {
      filter.student = user._id;
    } else if (studentId) {
      filter.student = studentId;
    }

    if (gateId) filter.gate = gateId;
    if (actionType) filter.actionType = actionType;
    if (isLateReturn === "true") filter.isLateReturn = true;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, totalCount] = await Promise.all([
      EntryExitLog.find(filter)
        .populate("student", "name email studentId room")
        .populate("gate", "gateName location")
        .populate("approvedBy", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      EntryExitLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalRecords: totalCount,
        hasNext: skip + logs.length < totalCount,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get entry/exit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/gates/student-qr/:studentId
// @desc    Get or generate student QR code
// @access  Private
router.get("/student-qr/:studentId", auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate studentId parameter
    if (!studentId || studentId === "undefined" || studentId === "null") {
      return res.status(400).json({
        success: false,
        message: "Valid student ID is required",
      });
    }

    // Students can only get their own QR code, admins/wardens can get any
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only access your own QR code",
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Generate new QR code if doesn't exist or needs refresh
    if (!student.qrCode || !student.qrCodeImage) {
      const { qrData, qrCodeDataURL } = await qrCodeService.generateStudentQR(
        student._id,
        {
          name: student.name,
          studentId: student.studentId,
        }
      );

      student.qrCode = qrData;
      student.qrCodeImage = qrCodeDataURL;
      await student.save();
    }

    res.json({
      success: true,
      qrCode: student.qrCode,
      qrCodeImage: student.qrCodeImage,
      student: {
        name: student.name,
        studentId: student.studentId,
        currentStatus: student.currentStatus,
      },
    });
  } catch (error) {
    console.error("Get student QR error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student QR code",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/gates/stats
// @desc    Get gate and entry/exit statistics
// @access  Admin/Warden
router.get("/stats", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (req.user.role === "student") {
      // Students get limited stats - only their own data
      const [myLogs, myTodayLogs] = await Promise.all([
        EntryExitLog.find({ student: req.user._id })
          .populate("gate", "gateName location")
          .sort({ createdAt: -1 })
          .limit(10),
        EntryExitLog.countDocuments({
          student: req.user._id,
          createdAt: { $gte: today, $lt: tomorrow },
        }),
      ]);

      return res.json({
        success: true,
        stats: {
          personal: {
            todayLogs: myTodayLogs,
            currentStatus: req.user.currentStatus,
            recentActivity: myLogs,
            totalLogs: myLogs.length,
          },
        },
      });
    }

    // Admin/Warden get full stats
    const [
      totalGates,
      activeGates,
      todayExits,
      todayEntries,
      currentlyOut,
      lateReturnsToday,
      recentLogs,
    ] = await Promise.all([
      Gate.countDocuments(),
      Gate.countDocuments({ isActive: true }),
      EntryExitLog.countDocuments({
        actionType: "exit",
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      EntryExitLog.countDocuments({
        actionType: "entry",
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      User.countDocuments({ currentStatus: "out_of_hostel" }),
      EntryExitLog.countDocuments({
        actionType: "entry",
        isLateReturn: true,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      EntryExitLog.find()
        .populate("student", "name studentId")
        .populate("gate", "gateName location")
        .populate("approvedBy", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      stats: {
        gates: {
          total: totalGates,
          active: activeGates,
        },
        today: {
          exits: todayExits,
          entries: todayEntries,
          lateReturns: lateReturnsToday,
        },
        current: {
          studentsOut: currentlyOut,
          studentsIn: await User.countDocuments({ currentStatus: "in_hostel" }),
        },
        recentActivity: recentLogs,
      },
    });
  } catch (error) {
    console.error("Get gate stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
