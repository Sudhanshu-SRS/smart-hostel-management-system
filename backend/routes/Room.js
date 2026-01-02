const express = require("express");
const Room = require("../models/room");
const User = require("../models/db");
const { auth, authorize } = require("../middleware/authmiddleware");
const { validateRoom } = require("../middleware/validation");

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms with filters (role-based data filtering)
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
      filter["beds"] = { $elemMatch: { isOccupied: false } };
    }

    let populateFields = "";
    let selectFields = "";

    // Role-based data filtering
    if (req.user.role === "admin" || req.user.role === "warden") {
      // Admin and warden can see all details including occupant information
      populateFields = "beds.occupant";
      selectFields =
        "name email phoneNumber studentId profilePicture course year";
    } else {
      // Students can only see room availability, not occupant details
      selectFields =
        "roomNumber floor building capacity roomType amenities monthlyRent status beds.bedNumber beds.isOccupied";
    }

    const query = Room.find(filter).sort({
      building: 1,
      floor: 1,
      roomNumber: 1,
    });

    if (req.user.role === "admin" || req.user.role === "warden") {
      query.populate({
        path: "beds.occupant",
        select: selectFields,
      });
    } else {
      query.select(selectFields);
    }

    const rooms = await query;

    // Filter sensitive data for students
    let responseRooms = rooms;
    if (req.user.role === "student") {
      responseRooms = rooms.map((room) => {
        const roomObj = room.toObject();
        // Remove occupant details from beds for students
        roomObj.beds = roomObj.beds.map((bed) => ({
          bedNumber: bed.bedNumber,
          isOccupied: bed.isOccupied,
        }));
        return roomObj;
      });
    }

    res.json({
      success: true,
      count: responseRooms.length,
      rooms: responseRooms,
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
// @desc    Get single room (role-based data filtering)
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    let room;

    if (req.user.role === "admin" || req.user.role === "warden") {
      // Admin and warden can see all details including occupant information and vacation requests
      room = await Room.findById(req.params.id)
        .populate({
          path: "beds.occupant",
          select: "name email phoneNumber studentId profilePicture course year",
        })
        .populate({
          path: "vacationRequests",
          select: "student room reason status requestDate finalApprovalDate",
          populate: [
            { path: "student", select: "name email studentId" },
            {
              path: "adminApproval.admin",
              select: "name email",
            },
            {
              path: "wardenApproval.warden",
              select: "name email",
            },
          ],
        });
    } else {
      // Students can only see basic room info and bed availability
      room = await Room.findById(req.params.id).select(
        "roomNumber floor building capacity roomType amenities monthlyRent status beds.bedNumber beds.isOccupied description images"
      );
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Filter sensitive data for students
    if (req.user.role === "student") {
      const roomObj = room.toObject();
      roomObj.beds = roomObj.beds.map((bed) => ({
        bedNumber: bed.bedNumber,
        isOccupied: bed.isOccupied,
      }));
      room = roomObj;
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
    console.log("📦 Creating room with data:", req.body);
    const room = new Room(req.body);
    await room.save();

    console.log("✅ Room created successfully:", room._id);

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomCreated", room);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("❌ Create room error:", error.message);
    console.error("📋 Error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      ...(error.errors && {
        validationErrors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      }),
    });

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
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
    }).populate("beds.occupant", "name email phoneNumber studentId");

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
    const occupiedBeds = room.beds.filter((bed) => bed.isOccupied);
    if (occupiedBeds.length > 0) {
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
// @desc    Book a room (automatic bed allocation)
// @access  Student
router.post("/:id/book", auth, authorize("student"), async (req, res) => {
  try {
    console.log(
      `📚 Student ${req.user._id} attempting to book room ${req.params.id}`
    );

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
    const availableBeds = room.beds.filter((bed) => !bed.isOccupied);
    if (availableBeds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Room is full",
      });
    }

    // Get the user to check if they already have a room
    const user = await User.findById(req.user._id);
    console.log(`👤 User room status:`, user.room);

    // Check if user already has a room
    if (user && user.room && user.room !== null) {
      console.log(`⚠️  User already has room: ${user.room}`);
      return res.status(400).json({
        success: false,
        message:
          "You already have a room assigned. Please vacate current room first.",
      });
    }

    // Check if user is already in this room
    const userBed = room.beds.find(
      (bed) =>
        bed.isOccupied &&
        bed.occupant &&
        bed.occupant.toString() === req.user._id.toString()
    );
    if (userBed) {
      return res.status(400).json({
        success: false,
        message: "You are already in this room",
      });
    }

    // Allocate the first available bed
    const bedToAllocate = availableBeds[0];
    const bedIndex = room.beds.findIndex(
      (bed) => bed.bedNumber === bedToAllocate.bedNumber
    );

    console.log(
      `🛏️ Allocating bed ${bedToAllocate.bedNumber} to student ${req.user._id}`
    );

    room.beds[bedIndex].isOccupied = true;
    room.beds[bedIndex].occupant = req.user._id;
    room.beds[bedIndex].allocationDate = new Date();

    await room.save();

    // Update user's room
    await User.findByIdAndUpdate(req.user._id, { room: room._id });

    // Populate the updated room
    await room.populate({
      path: "beds.occupant",
      select: "name email phoneNumber studentId",
    });

    console.log(
      `✅ Room ${room._id} booked successfully for student ${req.user._id}`
    );

    // Send room booking confirmation email
    const emailService = require("../services/emailService");
    await emailService
      .sendRoomBookingAcknowledgmentEmail(req.user, room)
      .then((result) => {
        if (result.success) {
          console.log(
            `📧 Room booking confirmation email sent to ${req.user.email}`
          );
        } else {
          console.error(`❌ Failed to send room booking email:`, result.error);
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending room booking email:`, error);
      });

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomBooked", {
      room,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      bedNumber: bedToAllocate.bedNumber,
    });

    res.json({
      success: true,
      message: `Room booked successfully. Bed ${bedToAllocate.bedNumber} allocated.`,
      room,
      allocatedBed: bedToAllocate.bedNumber,
    });
  } catch (error) {
    console.error("❌ Book room error:", error.message);
    console.error("📋 Error stack:", error.stack);

    // Send detailed error response in development
    if (process.env.NODE_ENV === "development") {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
});

// @route   POST /api/rooms/:id/vacate
// @desc    Vacate a room
// @access  Student/Admin/Warden
// NOTE: Students require an approved vacation request. Admin/Warden can vacate without request.
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

    // If student is vacating, check for approved vacation request
    if (req.user.role === "student") {
      const VacationRequest = require("../models/vacationRequest");
      const approvedRequest = await VacationRequest.findOne({
        student: req.user._id,
        status: "approved",
      });

      if (!approvedRequest) {
        return res.status(400).json({
          success: false,
          message:
            "You must have an approved vacation request to vacate your room",
        });
      }
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Find the user's bed in the room
    const userBedIndex = room.beds.findIndex(
      (bed) =>
        bed.isOccupied &&
        bed.occupant &&
        bed.occupant.toString() === targetUserId.toString()
    );

    if (userBedIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not occupying any bed in this room",
      });
    }

    // Deallocate the bed
    const bedNumber = room.beds[userBedIndex].bedNumber;
    room.beds[userBedIndex].isOccupied = false;
    room.beds[userBedIndex].occupant = null;
    room.beds[userBedIndex].allocationDate = null;

    await room.save();

    // Update user's room
    await User.findByIdAndUpdate(targetUserId, { room: null });

    // Populate the updated room
    await room.populate({
      path: "beds.occupant",
      select: "name email phoneNumber studentId",
    });

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("roomVacated", {
      room,
      userId: targetUserId,
      bedNumber,
    });

    res.json({
      success: true,
      message: `Room vacated successfully. Bed ${bedNumber} is now available.`,
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

// @route   POST /api/rooms/bulk-create
// @desc    Create multiple rooms for a floor
// @access  Admin only
router.post("/bulk-create", auth, authorize("admin"), async (req, res) => {
  try {
    const {
      building,
      floor,
      startRoomNumber,
      endRoomNumber,
      capacity,
      roomType,
      monthlyRent,
      securityDeposit,
      amenities,
      description,
    } = req.body;

    // Validation
    if (
      !building ||
      !floor ||
      !startRoomNumber ||
      !endRoomNumber ||
      !capacity ||
      !roomType ||
      !monthlyRent ||
      !securityDeposit
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (startRoomNumber > endRoomNumber) {
      return res.status(400).json({
        success: false,
        message: "Start room number cannot be greater than end room number",
      });
    }

    const rooms = [];
    const existingRooms = [];

    // Generate rooms for the range
    for (let roomNum = startRoomNumber; roomNum <= endRoomNumber; roomNum++) {
      const roomNumber = `${building}${floor}${roomNum
        .toString()
        .padStart(2, "0")}`;

      // Check if room already exists
      const existingRoom = await Room.findOne({ roomNumber });
      if (existingRoom) {
        existingRooms.push(roomNumber);
        continue;
      }

      const roomData = {
        roomNumber,
        floor,
        building,
        capacity,
        roomType,
        monthlyRent,
        securityDeposit,
        amenities: amenities || [],
        description: description || `${roomType} room on floor ${floor}`,
        status: "available",
      };

      rooms.push(roomData);
    }

    if (rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No new rooms to create. All room numbers already exist.",
        existingRooms,
      });
    }

    // Insert all rooms
    const createdRooms = await Room.insertMany(rooms);

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("bulkRoomsCreated", {
      count: createdRooms.length,
      floor,
      building,
    });

    res.status(201).json({
      success: true,
      message: `${createdRooms.length} rooms created successfully`,
      createdRooms: createdRooms.length,
      existingRooms: existingRooms.length > 0 ? existingRooms : undefined,
      rooms: createdRooms,
    });
  } catch (error) {
    console.error("Bulk create rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/rooms/:id/allocate-bed
// @desc    Allocate a specific bed to a student
// @access  Admin/Warden
router.post(
  "/:id/allocate-bed",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { studentId, bedNumber } = req.body;

      if (!studentId || !bedNumber) {
        return res.status(400).json({
          success: false,
          message: "Student ID and bed number are required",
        });
      }

      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // Find the student
      const student = await User.findById(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      // Check if student already has a room
      if (student.room) {
        return res.status(400).json({
          success: false,
          message: "Student already has a room allocated",
        });
      }

      // Find the specific bed
      const bedIndex = room.beds.findIndex(
        (bed) => bed.bedNumber === bedNumber
      );
      if (bedIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Bed not found",
        });
      }

      if (room.beds[bedIndex].isOccupied) {
        return res.status(400).json({
          success: false,
          message: "Bed is already occupied",
        });
      }

      // Allocate the bed
      room.beds[bedIndex].isOccupied = true;
      room.beds[bedIndex].occupant = studentId;
      room.beds[bedIndex].allocationDate = new Date();

      await room.save();

      // Update student's room
      student.room = room._id;
      await student.save();

      // Populate the room data for response
      await room.populate({
        path: "beds.occupant",
        select: "name email phoneNumber studentId",
      });

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("bedAllocated", {
        roomId: room._id,
        studentId,
        bedNumber,
        roomNumber: room.roomNumber,
      });

      res.json({
        success: true,
        message: "Bed allocated successfully",
        room,
        allocatedBed: {
          bedNumber,
          student: {
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
          },
        },
      });
    } catch (error) {
      console.error("Allocate bed error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/rooms/:id/deallocate-bed
// @desc    Deallocate a specific bed
// @access  Admin/Warden
router.post(
  "/:id/deallocate-bed",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { bedNumber } = req.body;

      if (!bedNumber) {
        return res.status(400).json({
          success: false,
          message: "Bed number is required",
        });
      }

      const room = await Room.findById(req.params.id).populate({
        path: "beds.occupant",
        select: "name email studentId",
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // Find the specific bed
      const bedIndex = room.beds.findIndex(
        (bed) => bed.bedNumber === bedNumber
      );
      if (bedIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Bed not found",
        });
      }

      if (!room.beds[bedIndex].isOccupied) {
        return res.status(400).json({
          success: false,
          message: "Bed is not currently occupied",
        });
      }

      const studentId = room.beds[bedIndex].occupant;

      // Deallocate the bed
      room.beds[bedIndex].isOccupied = false;
      room.beds[bedIndex].occupant = null;
      room.beds[bedIndex].allocationDate = null;

      await room.save();

      // Update student's room
      if (studentId) {
        await User.findByIdAndUpdate(studentId, { room: null });
      }

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("bedDeallocated", {
        roomId: room._id,
        studentId,
        bedNumber,
        roomNumber: room.roomNumber,
      });

      res.json({
        success: true,
        message: "Bed deallocated successfully",
        room,
      });
    } catch (error) {
      console.error("Deallocate bed error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/rooms/floor/:floor
// @desc    Get all rooms on a specific floor
// @access  Admin/Warden
router.get(
  "/floor/:floor",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const floor = parseInt(req.params.floor);
      const { building } = req.query;

      const filter = { floor };
      if (building) filter.building = building;

      const rooms = await Room.find(filter)
        .populate({
          path: "beds.occupant",
          select: "name email phoneNumber studentId course year",
        })
        .sort({ roomNumber: 1 });

      // Calculate floor statistics
      const floorStats = {
        totalRooms: rooms.length,
        totalBeds: rooms.reduce((sum, room) => sum + room.capacity, 0),
        occupiedBeds: rooms.reduce(
          (sum, room) => sum + room.beds.filter((bed) => bed.isOccupied).length,
          0
        ),
        availableBeds: rooms.reduce(
          (sum, room) =>
            sum + room.beds.filter((bed) => !bed.isOccupied).length,
          0
        ),
        occupancyRate: 0,
      };

      if (floorStats.totalBeds > 0) {
        floorStats.occupancyRate = (
          (floorStats.occupiedBeds / floorStats.totalBeds) *
          100
        ).toFixed(2);
      }

      res.json({
        success: true,
        floor,
        building: building || "All",
        stats: floorStats,
        rooms,
      });
    } catch (error) {
      console.error("Get floor rooms error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/rooms/stats/occupancy
// @desc    Get room occupancy statistics (Updated for bed-based system)
// @access  Admin/Warden
router.get(
  "/stats/occupancy",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const stats = await Room.aggregate([
        {
          $addFields: {
            occupiedBeds: {
              $size: {
                $filter: {
                  input: "$beds",
                  cond: { $eq: ["$$this.isOccupied", true] },
                },
              },
            },
            availableBeds: {
              $size: {
                $filter: {
                  input: "$beds",
                  cond: { $eq: ["$$this.isOccupied", false] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            totalBeds: { $sum: "$capacity" },
            totalOccupiedBeds: { $sum: "$occupiedBeds" },
            totalAvailableBeds: { $sum: "$availableBeds" },
            availableRooms: {
              $sum: {
                $cond: [{ $gt: ["$availableBeds", 0] }, 1, 0],
              },
            },
            fullyOccupiedRooms: {
              $sum: {
                $cond: [{ $eq: ["$availableBeds", 0] }, 1, 0],
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
        totalBeds: 0,
        totalOccupiedBeds: 0,
        totalAvailableBeds: 0,
        availableRooms: 0,
        fullyOccupiedRooms: 0,
        maintenanceRooms: 0,
      };

      occupancyStats.occupancyRate =
        occupancyStats.totalBeds > 0
          ? (
              (occupancyStats.totalOccupiedBeds / occupancyStats.totalBeds) *
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
