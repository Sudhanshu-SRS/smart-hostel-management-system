const express = require("express");
const Room = require("../models/room");
const User = require("../models/db");
const Complaint = require("../models/complaint");
const Payment = require("../models/payment");
const Visitor = require("../models/visitors");
const EntryExit = require("../models/EntryExit");
const { auth, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// @route   GET /api/reports/occupancy
// @desc    Generate room occupancy report
// @access  Admin/Warden
router.get(
  "/occupancy",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { startDate, endDate, building, floor } = req.query;
      const filter = {};

      if (building) filter.building = building;
      if (floor) filter.floor = parseInt(floor);

      const rooms = await Room.find(filter)
        .populate(
          "beds.occupant",
          "name studentId email phoneNumber course year"
        )
        .sort({ building: 1, floor: 1, roomNumber: 1 });

      const report = {
        summary: {
          totalRooms: rooms.length,
          totalBeds: rooms.reduce((sum, room) => sum + room.capacity, 0),
          occupiedBeds: rooms.reduce(
            (sum, room) =>
              sum + room.beds.filter((bed) => bed.isOccupied).length,
            0
          ),
          vacantBeds: rooms.reduce(
            (sum, room) =>
              sum + room.beds.filter((bed) => !bed.isOccupied).length,
            0
          ),
        },
        buildingWise: {},
        floorWise: {},
        rooms: rooms.map((room) => ({
          _id: room._id,
          roomNumber: room.roomNumber,
          building: room.building,
          floor: room.floor,
          capacity: room.capacity,
          occupancy: room.beds.filter((bed) => bed.isOccupied).length,
          occupancyRate:
            (room.beds.filter((bed) => bed.isOccupied).length / room.capacity) *
            100,
          beds: room.beds.map((bed) => ({
            bedNumber: bed.bedNumber,
            isOccupied: bed.isOccupied,
            occupant: bed.occupant
              ? {
                  name: bed.occupant.name,
                  studentId: bed.occupant.studentId,
                  email: bed.occupant.email,
                  course: bed.occupant.course,
                  year: bed.occupant.year,
                  allocationDate: bed.allocationDate,
                }
              : null,
          })),
        })),
      };

      // Calculate building-wise statistics
      rooms.forEach((room) => {
        if (!report.buildingWise[room.building]) {
          report.buildingWise[room.building] = {
            totalRooms: 0,
            totalBeds: 0,
            occupiedBeds: 0,
            vacantBeds: 0,
            occupancyRate: 0,
          };
        }
        const building = report.buildingWise[room.building];
        building.totalRooms++;
        building.totalBeds += room.capacity;
        building.occupiedBeds += room.beds.filter(
          (bed) => bed.isOccupied
        ).length;
        building.vacantBeds += room.beds.filter(
          (bed) => !bed.isOccupied
        ).length;
        building.occupancyRate =
          (building.occupiedBeds / building.totalBeds) * 100;
      });

      // Calculate floor-wise statistics
      rooms.forEach((room) => {
        const key = `${room.building}-${room.floor}`;
        if (!report.floorWise[key]) {
          report.floorWise[key] = {
            building: room.building,
            floor: room.floor,
            totalRooms: 0,
            totalBeds: 0,
            occupiedBeds: 0,
            vacantBeds: 0,
            occupancyRate: 0,
          };
        }
        const floor = report.floorWise[key];
        floor.totalRooms++;
        floor.totalBeds += room.capacity;
        floor.occupiedBeds += room.beds.filter((bed) => bed.isOccupied).length;
        floor.vacantBeds += room.beds.filter((bed) => !bed.isOccupied).length;
        floor.occupancyRate = (floor.occupiedBeds / floor.totalBeds) * 100;
      });

      report.summary.occupancyRate =
        (report.summary.occupiedBeds / report.summary.totalBeds) * 100;
      report.generatedAt = new Date();
      report.reportType = "occupancy";

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("Occupancy report error:", error);
      res.status(500).json({
        success: false,
        message: "Error generating occupancy report",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/reports/complaints
// @desc    Generate complaints analytics report
// @access  Admin/Warden
router.get(
  "/complaints",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { startDate, endDate, status, category, priority } = req.query;
      const filter = {};

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;

      const complaints = await Complaint.find(filter)
        .populate("user", "name studentId email course year")
        .populate("assignedTo", "name email role")
        .populate("room", "roomNumber building floor")
        .sort({ createdAt: -1 });

      // Calculate statistics
      const stats = {
        total: complaints.length,
        byStatus: {},
        byCategory: {},
        byPriority: {},
        avgResolutionTime: 0,
        satisfactionRating: 0,
        byBuilding: {},
        byMonth: {},
        resolutionStats: {
          resolved: 0,
          pending: 0,
          overdue: 0,
        },
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;
      let totalRating = 0;
      let ratedCount = 0;

      complaints.forEach((complaint) => {
        // Status statistics
        stats.byStatus[complaint.status] =
          (stats.byStatus[complaint.status] || 0) + 1;

        // Category statistics
        stats.byCategory[complaint.category] =
          (stats.byCategory[complaint.category] || 0) + 1;

        // Priority statistics
        stats.byPriority[complaint.priority] =
          (stats.byPriority[complaint.priority] || 0) + 1;

        // Building statistics
        if (complaint.room && complaint.room.building) {
          stats.byBuilding[complaint.room.building] =
            (stats.byBuilding[complaint.room.building] || 0) + 1;
        }

        // Monthly statistics
        const month = complaint.createdAt.toISOString().substring(0, 7);
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

        // Resolution time calculation
        if (complaint.actualResolutionDate) {
          const resolutionTime =
            complaint.actualResolutionDate - complaint.createdAt;
          totalResolutionTime += resolutionTime;
          resolvedCount++;
          stats.resolutionStats.resolved++;
        } else {
          stats.resolutionStats.pending++;

          // Check if overdue (more than 7 days for non-urgent, 24 hours for urgent)
          const overdueThreshold =
            complaint.priority === "urgent"
              ? 24 * 60 * 60 * 1000
              : 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - complaint.createdAt > overdueThreshold) {
            stats.resolutionStats.overdue++;
          }
        }

        // Rating calculation
        if (complaint.rating) {
          totalRating += complaint.rating;
          ratedCount++;
        }
      });

      stats.avgResolutionTime =
        resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
      stats.satisfactionRating = ratedCount > 0 ? totalRating / ratedCount : 0;

      const report = {
        summary: stats,
        complaints: complaints.map((complaint) => ({
          _id: complaint._id,
          title: complaint.title,
          category: complaint.category,
          priority: complaint.priority,
          status: complaint.status,
          createdAt: complaint.createdAt,
          resolvedAt: complaint.actualResolutionDate,
          resolutionTime: complaint.actualResolutionDate
            ? complaint.actualResolutionDate - complaint.createdAt
            : null,
          rating: complaint.rating,
          user: complaint.user
            ? {
                name: complaint.user.name,
                studentId: complaint.user.studentId,
                course: complaint.user.course,
              }
            : null,
          room: complaint.room
            ? {
                roomNumber: complaint.room.roomNumber,
                building: complaint.room.building,
                floor: complaint.room.floor,
              }
            : null,
          assignedTo: complaint.assignedTo
            ? {
                name: complaint.assignedTo.name,
                role: complaint.assignedTo.role,
              }
            : null,
        })),
        generatedAt: new Date(),
        reportType: "complaints",
      };

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("Complaints report error:", error);
      res.status(500).json({
        success: false,
        message: "Error generating complaints report",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/reports/payments
// @desc    Generate payments report
// @access  Admin/Warden
router.get(
  "/payments",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { startDate, endDate, status, paymentType } = req.query;
      const filter = {};

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      if (status) filter.status = status;
      if (paymentType) filter.paymentType = paymentType;

      const payments = await Payment.find(filter)
        .populate("user", "name studentId email course year")
        .populate("room", "roomNumber building floor")
        .sort({ createdAt: -1 });

      // Calculate statistics
      const stats = {
        total: payments.length,
        totalAmount: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        byStatus: {},
        byType: {},
        byMonth: {},
        byBuilding: {},
      };

      payments.forEach((payment) => {
        stats.totalAmount += payment.amount;

        if (payment.status === "completed") {
          stats.collectedAmount += payment.amount;
        } else {
          stats.pendingAmount += payment.amount;
        }

        // Status statistics
        stats.byStatus[payment.status] =
          (stats.byStatus[payment.status] || 0) + 1;

        // Type statistics
        stats.byType[payment.paymentType] =
          (stats.byType[payment.paymentType] || 0) + 1;

        // Monthly statistics
        const month = payment.createdAt.toISOString().substring(0, 7);
        if (!stats.byMonth[month]) {
          stats.byMonth[month] = { count: 0, amount: 0 };
        }
        stats.byMonth[month].count++;
        stats.byMonth[month].amount += payment.amount;

        // Building statistics
        if (payment.room && payment.room.building) {
          if (!stats.byBuilding[payment.room.building]) {
            stats.byBuilding[payment.room.building] = { count: 0, amount: 0 };
          }
          stats.byBuilding[payment.room.building].count++;
          stats.byBuilding[payment.room.building].amount += payment.amount;
        }
      });

      const report = {
        summary: stats,
        payments: payments.map((payment) => ({
          _id: payment._id,
          amount: payment.amount,
          paymentType: payment.paymentType,
          status: payment.status,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
          user: payment.user
            ? {
                name: payment.user.name,
                studentId: payment.user.studentId,
                course: payment.user.course,
              }
            : null,
          room: payment.room
            ? {
                roomNumber: payment.room.roomNumber,
                building: payment.room.building,
                floor: payment.room.floor,
              }
            : null,
        })),
        generatedAt: new Date(),
        reportType: "payments",
      };

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("Payments report error:", error);
      res.status(500).json({
        success: false,
        message: "Error generating payments report",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/reports/student-activity
// @desc    Generate student activity report
// @access  Admin/Warden
router.get(
  "/student-activity",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { startDate, endDate, building } = req.query;
      const filter = {};

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const entryExitRecords = await EntryExit.find(filter)
        .populate("user", "name studentId email course year room")
        .populate("gate", "name location")
        .sort({ timestamp: -1 });

      // Calculate statistics
      const stats = {
        totalEntries: 0,
        totalExits: 0,
        uniqueStudents: new Set(),
        byDay: {},
        byHour: {},
        byGate: {},
        lateEntries: 0, // After 10 PM
      };

      entryExitRecords.forEach((record) => {
        if (record.type === "entry") {
          stats.totalEntries++;
        } else {
          stats.totalExits++;
        }

        stats.uniqueStudents.add(record.user._id.toString());

        // Day statistics
        const day = record.timestamp.toISOString().substring(0, 10);
        if (!stats.byDay[day]) {
          stats.byDay[day] = { entries: 0, exits: 0 };
        }
        stats.byDay[day][record.type === "entry" ? "entries" : "exits"]++;

        // Hour statistics
        const hour = record.timestamp.getHours();
        if (!stats.byHour[hour]) {
          stats.byHour[hour] = { entries: 0, exits: 0 };
        }
        stats.byHour[hour][record.type === "entry" ? "entries" : "exits"]++;

        // Gate statistics
        if (record.gate) {
          if (!stats.byGate[record.gate.name]) {
            stats.byGate[record.gate.name] = { entries: 0, exits: 0 };
          }
          stats.byGate[record.gate.name][
            record.type === "entry" ? "entries" : "exits"
          ]++;
        }

        // Late entries (after 10 PM)
        if (record.type === "entry" && hour >= 22) {
          stats.lateEntries++;
        }
      });

      stats.uniqueStudents = stats.uniqueStudents.size;

      const report = {
        summary: stats,
        records: entryExitRecords.slice(0, 100).map((record) => ({
          // Limit to 100 recent records
          _id: record._id,
          type: record.type,
          timestamp: record.timestamp,
          user: record.user
            ? {
                name: record.user.name,
                studentId: record.user.studentId,
                course: record.user.course,
              }
            : null,
          gate: record.gate
            ? {
                name: record.gate.name,
                location: record.gate.location,
              }
            : null,
        })),
        generatedAt: new Date(),
        reportType: "student-activity",
      };

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("Student activity report error:", error);
      res.status(500).json({
        success: false,
        message: "Error generating student activity report",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/reports/dashboard-analytics
// @desc    Generate comprehensive dashboard analytics
// @access  Admin/Warden
router.get(
  "/dashboard-analytics",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const currentDate = new Date();
      const lastMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      const thisMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      // Parallel queries for better performance
      const [
        totalUsers,
        totalRooms,
        occupancyData,
        complaintsThisMonth,
        complaintsLastMonth,
        paymentsThisMonth,
        paymentsLastMonth,
        recentActivity,
      ] = await Promise.all([
        User.countDocuments({ role: "student" }),
        Room.countDocuments(),
        Room.aggregate([
          {
            $project: {
              totalBeds: "$capacity",
              occupiedBeds: {
                $size: {
                  $filter: {
                    input: "$beds",
                    cond: { $eq: ["$$this.isOccupied", true] },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalBeds: { $sum: "$totalBeds" },
              occupiedBeds: { $sum: "$occupiedBeds" },
            },
          },
        ]),
        Complaint.countDocuments({ createdAt: { $gte: thisMonth } }),
        Complaint.countDocuments({
          createdAt: { $gte: lastMonth, $lt: thisMonth },
        }),
        Payment.aggregate([
          { $match: { createdAt: { $gte: thisMonth } } },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
        Payment.aggregate([
          { $match: { createdAt: { $gte: lastMonth, $lt: thisMonth } } },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
        EntryExit.find({
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
          .populate("user", "name studentId")
          .sort({ timestamp: -1 })
          .limit(10),
      ]);

      const occupancy = occupancyData[0] || { totalBeds: 0, occupiedBeds: 0 };
      const paymentsThisMonthData = paymentsThisMonth[0] || {
        total: 0,
        count: 0,
      };
      const paymentsLastMonthData = paymentsLastMonth[0] || {
        total: 0,
        count: 0,
      };

      // Calculate growth percentages
      const complaintsGrowth =
        complaintsLastMonth > 0
          ? ((complaintsThisMonth - complaintsLastMonth) /
              complaintsLastMonth) *
            100
          : 0;

      const paymentsGrowth =
        paymentsLastMonthData.total > 0
          ? ((paymentsThisMonthData.total - paymentsLastMonthData.total) /
              paymentsLastMonthData.total) *
            100
          : 0;

      const analytics = {
        summary: {
          totalStudents: totalUsers,
          totalRooms: totalRooms,
          occupancyRate:
            occupancy.totalBeds > 0
              ? (occupancy.occupiedBeds / occupancy.totalBeds) * 100
              : 0,
          totalBeds: occupancy.totalBeds,
          occupiedBeds: occupancy.occupiedBeds,
          availableBeds: occupancy.totalBeds - occupancy.occupiedBeds,
        },
        complaints: {
          thisMonth: complaintsThisMonth,
          lastMonth: complaintsLastMonth,
          growth: complaintsGrowth,
        },
        payments: {
          thisMonth: {
            amount: paymentsThisMonthData.total,
            count: paymentsThisMonthData.count,
          },
          lastMonth: {
            amount: paymentsLastMonthData.total,
            count: paymentsLastMonthData.count,
          },
          growth: paymentsGrowth,
        },
        recentActivity: recentActivity.map((activity) => ({
          type: activity.type,
          timestamp: activity.timestamp,
          user: activity.user
            ? {
                name: activity.user.name,
                studentId: activity.user.studentId,
              }
            : null,
        })),
        generatedAt: new Date(),
        reportType: "dashboard-analytics",
      };

      res.json({
        success: true,
        analytics,
      });
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Error generating dashboard analytics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/reports/export/:type
// @desc    Export report data in CSV format
// @access  Admin/Warden
router.get(
  "/export/:type",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { type } = req.params;
      const { format = "json" } = req.query;

      let reportData;
      let filename;

      // Generate the appropriate report
      switch (type) {
        case "occupancy":
          const occupancyResult = await generateOccupancyData(req.query);
          reportData = occupancyResult.rooms;
          filename = `occupancy_report_${new Date()
            .toISOString()
            .substring(0, 10)}.${format}`;
          break;

        case "complaints":
          const complaintsResult = await generateComplaintsData(req.query);
          reportData = complaintsResult.complaints;
          filename = `complaints_report_${new Date()
            .toISOString()
            .substring(0, 10)}.${format}`;
          break;

        case "payments":
          const paymentsResult = await generatePaymentsData(req.query);
          reportData = paymentsResult.payments;
          filename = `payments_report_${new Date()
            .toISOString()
            .substring(0, 10)}.${format}`;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type",
          });
      }

      if (format === "csv") {
        // Convert to CSV
        const csv = convertToCSV(reportData);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.send(csv);
      } else {
        // Return JSON
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.json({
          success: true,
          data: reportData,
          exportedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Export report error:", error);
      res.status(500).json({
        success: false,
        message: "Error exporting report",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Helper functions
async function generateOccupancyData(query) {
  const filter = {};
  if (query.building) filter.building = query.building;
  if (query.floor) filter.floor = parseInt(query.floor);

  const rooms = await Room.find(filter)
    .populate("beds.occupant", "name studentId email")
    .sort({ building: 1, floor: 1, roomNumber: 1 });

  return { rooms };
}

async function generateComplaintsData(query) {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const complaints = await Complaint.find(filter)
    .populate("user", "name studentId email")
    .populate("room", "roomNumber building floor")
    .sort({ createdAt: -1 });

  return { complaints };
}

async function generatePaymentsData(query) {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const payments = await Payment.find(filter)
    .populate("user", "name studentId email")
    .populate("room", "roomNumber building floor")
    .sort({ createdAt: -1 });

  return { payments };
}

function convertToCSV(data) {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(","));
  return headers + "\n" + rows.join("\n");
}

module.exports = router;
