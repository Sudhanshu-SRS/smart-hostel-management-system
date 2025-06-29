const express = require("express");
const Room = require("../models/room");
const User = require("../models/db");
const { auth, authorize } = require("../middleware/authmiddleware");
const { validateRoom } = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms with filters
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { status, floor, roomType, building, available } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (floor) filter.floor = parseInt(floor);
    if (roomType) filter.roomType = roomType;
    if (building) filter.building = building;

    // If available filter is true, only show rooms with available beds
    if (available === "true") {
      filter.$expr = { $lt: [{ $size: "$occupants" }, "$capacity"] };
    }

    const rooms = await Room.find(filter)
      .populate("occupants", "name email phoneNumber studentId")
      .sort({ building: 1, floor: 1, roomNumber: 1 });

    res.json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "occupants",
      "name email phoneNumber studentId profilePicture"
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Admin only
router.post("/", auth, authorize("admin"), validateRoom, async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomCreated", room);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Create room error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Room number already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Admin/Warden
router.put("/:id", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("occupants", "name email phoneNumber studentId");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomUpdated", room);

    res.json({
      success: true,
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Admin only
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check if room has occupants
    if (room.occupants.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete room with occupants. Please relocate students first.",
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomDeleted", { roomId: req.params.id });

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/rooms/:id/book
// @desc    Book a room
// @access  Student
router.post("/:id/book", auth, authorize("student"), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check if room is available
    if (room.status === "maintenance") {
      return res.status(400).json({
        success: false,
        message: "Room is under maintenance",
      });
    }

    // Check if room has available beds
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: "Room is full",
      });
    }

    // Check if user already has a room
    if (req.user.room) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a room assigned. Please vacate current room first.",
      });
    }

    // Check if user is already in this room
    if (room.occupants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You are already in this room",
      });
    }

    // Add user to room occupants
    room.occupants.push(req.user._id);
    await room.save();

    // Update user's room
    await User.findByIdAndUpdate(req.user._id, { room: room._id });

    // Populate the updated room
    await room.populate("occupants", "name email phoneNumber studentId");

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomBooked", {
      room,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });

    res.json({
      success: true,
      message: "Room booked successfully",
      room,
    });
  } catch (error) {
    console.error("Book room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/rooms/:id/vacate
// @desc    Vacate a room
// @access  Student/Admin/Warden
router.post("/:id/vacate", auth, async (req, res) => {
  try {
    const { userId } = req.body;

    // Students can only vacate their own room, admins/wardens can vacate any
    const targetUserId = userId || req.user._id;

    if (
      req.user.role === "student" &&
      targetUserId !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only vacate your own room",
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check if user is in this room
    if (!room.occupants.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "User is not in this room",
      });
    }

    // Remove user from room occupants
    room.occupants = room.occupants.filter(
      (occupant) => occupant.toString() !== targetUserId
    );
    await room.save();

    // Update user's room
    await User.findByIdAndUpdate(targetUserId, { room: null });

    // Populate the updated room
    await room.populate("occupants", "name email phoneNumber studentId");

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomVacated", {
      room,
      userId: targetUserId,
    });

    res.json({
      success: true,
      message: "Room vacated successfully",
      room,
    });
  } catch (error) {
    console.error("Vacate room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/rooms/stats/occupancy
// @desc    Get room occupancy statistics
// @access  Admin/Warden
router.get(
  "/stats/occupancy",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const stats = await Room.aggregate([
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            totalCapacity: { $sum: "$capacity" },
            totalOccupants: { $sum: { $size: "$occupants" } },
            availableRooms: {
              $sum: {
                $cond: [{ $lt: [{ $size: "$occupants" }, "$capacity"] }, 1, 0],
              },
            },
            fullyOccupiedRooms: {
              $sum: {
                $cond: [{ $eq: [{ $size: "$occupants" }, "$capacity"] }, 1, 0],
              },
            },
            maintenanceRooms: {
              $sum: {
                $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0],
              },
            },
          },
        },
      ]);

      const occupancyStats = stats[0] || {
        totalRooms: 0,
        totalCapacity: 0,
        totalOccupants: 0,
        availableRooms: 0,
        fullyOccupiedRooms: 0,
        maintenanceRooms: 0,
      };

      occupancyStats.occupancyRate =
        occupancyStats.totalCapacity > 0
          ? (
              (occupancyStats.totalOccupants / occupancyStats.totalCapacity) *
              100
            ).toFixed(2)
          : 0;

      res.json({
        success: true,
        stats: occupancyStats,
      });
    } catch (error) {
      console.error("Get occupancy stats error:", error);
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
