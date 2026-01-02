const express = require("express");
const User = require("../models/db");
const Room = require("../models/room");
const Payment = require("../models/payment");
const Complaint = require("../models/complaint");
const Visitor = require("../models/visitors");
const { auth, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get comprehensive dashboard statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === "student") {
      // Student dashboard stats
      const userPayments = await Payment.find({ user: req.user._id });
      const userComplaints = await Complaint.find({ user: req.user._id });
      const userVisitors = await Visitor.find({
        visitingStudent: req.user._id,
      });

      stats = {
        payments: {
          total: userPayments.length,
          pending: userPayments.filter((p) => p.status === "pending").length,
          completed: userPayments.filter((p) => p.status === "completed")
            .length,
          totalAmount: userPayments.reduce((sum, p) => sum + p.finalAmount, 0),
          pendingAmount: userPayments
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + p.finalAmount, 0),
        },
        complaints: {
          total: userComplaints.length,
          open: userComplaints.filter((c) => c.status === "open").length,
          inProgress: userComplaints.filter((c) => c.status === "in_progress")
            .length,
          resolved: userComplaints.filter((c) => c.status === "resolved")
            .length,
        },
        visitors: {
          total: userVisitors.length,
          active: userVisitors.filter((v) => v.status === "checked_in").length,
          waitingApproval: userVisitors.filter(
            (v) => v.status === "waiting_approval"
          ).length,
        },
        room: req.user.room
          ? await Room.findById(req.user.room).populate(
              "beds.occupant",
              "name email"
            )
          : null,
      };
    } else {
      // Admin/Warden dashboard stats
      const [roomStats, userStats, paymentStats, complaintStats, visitorStats] =
        await Promise.all([
          // Room statistics
          Room.aggregate([
            {
              $group: {
                _id: null,
                totalRooms: { $sum: 1 },
                totalCapacity: { $sum: "$capacity" },
                totalOccupants: { $sum: { $size: "$occupants" } },
                availableRooms: {
                  $sum: {
                    $cond: [
                      { $lt: [{ $size: "$occupants" }, "$capacity"] },
                      1,
                      0,
                    ],
                  },
                },
                maintenanceRooms: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0],
                  },
                },
              },
            },
          ]),

          // User statistics
          User.aggregate([
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
                usersWithRooms: {
                  $sum: { $cond: [{ $ne: ["$room", null] }, 1, 0] },
                },
              },
            },
          ]),

          // Payment statistics
          Payment.aggregate([
            {
              $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: "$finalAmount" },
                pendingPayments: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                completedPayments: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                pendingAmount: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "pending"] }, "$finalAmount", 0],
                  },
                },
                completedAmount: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "completed"] },
                      "$finalAmount",
                      0,
                    ],
                  },
                },
              },
            },
          ]),

          // Complaint statistics
          Complaint.aggregate([
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
                urgentComplaints: {
                  $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
                },
              },
            },
          ]),

          // Visitor statistics
          Visitor.aggregate([
            {
              $group: {
                _id: null,
                totalVisitors: { $sum: 1 },
                activeVisitors: {
                  $sum: { $cond: [{ $eq: ["$status", "checked_in"] }, 1, 0] },
                },
                waitingApproval: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "waiting_approval"] }, 1, 0],
                  },
                },
                overstayedVisitors: {
                  $sum: { $cond: [{ $eq: ["$status", "overstayed"] }, 1, 0] },
                },
              },
            },
          ]),
        ]);

      stats = {
        rooms: roomStats[0] || {
          totalRooms: 0,
          totalCapacity: 0,
          totalOccupants: 0,
          availableRooms: 0,
          maintenanceRooms: 0,
        },
        users: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          students: 0,
          usersWithRooms: 0,
        },
        payments: paymentStats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          pendingPayments: 0,
          completedPayments: 0,
          pendingAmount: 0,
          completedAmount: 0,
        },
        complaints: complaintStats[0] || {
          totalComplaints: 0,
          openComplaints: 0,
          inProgressComplaints: 0,
          resolvedComplaints: 0,
          urgentComplaints: 0,
        },
        visitors: visitorStats[0] || {
          totalVisitors: 0,
          activeVisitors: 0,
          waitingApproval: 0,
          overstayedVisitors: 0,
        },
      };

      // Calculate occupancy rate
      if (stats.rooms.totalCapacity > 0) {
        stats.rooms.occupancyRate = (
          (stats.rooms.totalOccupants / stats.rooms.totalCapacity) *
          100
        ).toFixed(2);
      } else {
        stats.rooms.occupancyRate = 0;
      }
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities for dashboard
// @access  Private
router.get("/recent-activities", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    let activities = [];

    if (req.user.role === "student") {
      // Get student's recent activities
      const [recentPayments, recentComplaints, recentVisitors] =
        await Promise.all([
          Payment.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("paymentType amount status createdAt"),
          Complaint.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("title status priority createdAt"),
          Visitor.find({ visitingStudent: req.user._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("name status createdAt"),
        ]);

      activities = [
        ...recentPayments.map((p) => ({
          type: "payment",
          title: `Payment - ${p.paymentType}`,
          description: `₹${p.amount} - ${p.status}`,
          timestamp: p.createdAt,
          status: p.status,
        })),
        ...recentComplaints.map((c) => ({
          type: "complaint",
          title: c.title,
          description: `Status: ${c.status}`,
          timestamp: c.createdAt,
          status: c.status,
          priority: c.priority,
        })),
        ...recentVisitors.map((v) => ({
          type: "visitor",
          title: `Visitor - ${v.name}`,
          description: `Status: ${v.status}`,
          timestamp: v.createdAt,
          status: v.status,
        })),
      ];
    } else {
      // Get admin/warden recent activities
      const [recentComplaints, recentVisitors, recentPayments] =
        await Promise.all([
          Complaint.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name studentId")
            .select("title status priority user createdAt"),
          Visitor.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("visitingStudent", "name studentId")
            .select("name status visitingStudent createdAt"),
          Payment.find({ status: "pending" })
            .sort({ dueDate: 1 })
            .limit(5)
            .populate("user", "name studentId")
            .select("paymentType amount user dueDate"),
        ]);

      activities = [
        ...recentComplaints.map((c) => ({
          type: "complaint",
          title: `New Complaint - ${c.title}`,
          description: `By: ${c.user.name} (${c.user.studentId})`,
          timestamp: c.createdAt,
          status: c.status,
          priority: c.priority,
        })),
        ...recentVisitors.map((v) => ({
          type: "visitor",
          title: `Visitor Registration - ${v.name}`,
          description: `For: ${v.visitingStudent.name} (${v.visitingStudent.studentId})`,
          timestamp: v.createdAt,
          status: v.status,
        })),
        ...recentPayments.map((p) => ({
          type: "payment",
          title: `Pending Payment - ${p.paymentType}`,
          description: `${p.user.name} - ₹${p.amount}`,
          timestamp: p.dueDate,
          status: "pending",
        })),
      ];
    }

    // Sort by timestamp and limit
    activities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get recent activities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/dashboard/notifications
// @desc    Get notifications for user
// @access  Private
router.get("/notifications", auth, async (req, res) => {
  try {
    let notifications = [];

    if (req.user.role === "student") {
      // Student notifications
      const [overduePayments, urgentComplaints, pendingVisitors] =
        await Promise.all([
          Payment.find({
            user: req.user._id,
            status: "pending",
            dueDate: { $lt: new Date() },
          }).countDocuments(),
          Complaint.find({
            user: req.user._id,
            status: { $in: ["open", "in_progress"] },
            priority: "urgent",
          }).countDocuments(),
          Visitor.find({
            visitingStudent: req.user._id,
            status: "waiting_approval",
          }).countDocuments(),
        ]);

      if (overduePayments > 0) {
        notifications.push({
          type: "warning",
          title: "Overdue Payments",
          message: `You have ${overduePayments} overdue payment(s)`,
          action: "/payments",
        });
      }

      if (urgentComplaints > 0) {
        notifications.push({
          type: "info",
          title: "Urgent Complaints",
          message: `You have ${urgentComplaints} urgent complaint(s) pending`,
          action: "/complaints",
        });
      }

      if (pendingVisitors > 0) {
        notifications.push({
          type: "info",
          title: "Visitor Approvals",
          message: `${pendingVisitors} visitor(s) waiting for approval`,
          action: "/visitors",
        });
      }
    } else {
      // Admin/Warden notifications
      const [
        urgentComplaints,
        pendingVisitors,
        overduePayments,
        maintenanceRooms,
      ] = await Promise.all([
        Complaint.find({
          status: "open",
          priority: "urgent",
        }).countDocuments(),
        Visitor.find({
          status: "waiting_approval",
        }).countDocuments(),
        Payment.find({
          status: "pending",
          dueDate: { $lt: new Date() },
        }).countDocuments(),
        Room.find({
          status: "maintenance",
        }).countDocuments(),
      ]);

      if (urgentComplaints > 0) {
        notifications.push({
          type: "error",
          title: "Urgent Complaints",
          message: `${urgentComplaints} urgent complaint(s) need immediate attention`,
          action: "/complaints?priority=urgent",
        });
      }

      if (pendingVisitors > 0) {
        notifications.push({
          type: "warning",
          title: "Visitor Approvals",
          message: `${pendingVisitors} visitor(s) waiting for approval`,
          action: "/visitors?status=waiting_approval",
        });
      }

      if (overduePayments > 0) {
        notifications.push({
          type: "warning",
          title: "Overdue Payments",
          message: `${overduePayments} payment(s) are overdue`,
          action: "/payments?status=pending",
        });
      }

      if (maintenanceRooms > 0) {
        notifications.push({
          type: "info",
          title: "Maintenance Rooms",
          message: `${maintenanceRooms} room(s) under maintenance`,
          action: "/rooms?status=maintenance",
        });
      }
    }

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
