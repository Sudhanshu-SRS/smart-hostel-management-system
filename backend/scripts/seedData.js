const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

const User = require("../models/db");
const Room = require("../models/room");
const Gate = require("../models/gate");
const QRCode = require("qrcode");

const connectionString =
  process.env.MONGODB_URI ||
  "mongodb+srv://Sudhanshu:Sudhanshu0931@college-project.hxlkhvl.mongodb.net/SHMS";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(connectionString);
    console.log("✅ MongoDB connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seed Rooms
const seedRooms = async () => {
  try {
    // Check if rooms already exist
    const existingRooms = await Room.countDocuments();
    if (existingRooms > 0) {
      console.log(
        `⏭️  Rooms already seeded (${existingRooms} rooms found), skipping...`
      );
      return;
    }

    const rooms = [
      // Building A - Ground Floor
      {
        roomNumber: "A-101",
        floor: 0,
        building: "Building A",
        capacity: 2,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Study Table", "Wardrobe"],
        monthlyRent: 5000,
        securityDeposit: 10000,
        roomType: "double",
        status: "available",
      },
      {
        roomNumber: "A-102",
        floor: 0,
        building: "Building A",
        capacity: 3,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
          { bedNumber: 3, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Fan", "Study Table", "Wardrobe", "Balcony"],
        monthlyRent: 6000,
        securityDeposit: 12000,
        roomType: "triple",
        status: "available",
      },
      {
        roomNumber: "A-103",
        floor: 0,
        building: "Building A",
        capacity: 2,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Study Table", "Attached Bathroom"],
        monthlyRent: 5500,
        securityDeposit: 11000,
        roomType: "double",
        status: "available",
      },
      // Building A - First Floor
      {
        roomNumber: "A-201",
        floor: 1,
        building: "Building A",
        capacity: 4,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
          { bedNumber: 3, isOccupied: false },
          { bedNumber: 4, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Fan", "Study Table", "Wardrobe", "Balcony"],
        monthlyRent: 7000,
        securityDeposit: 14000,
        roomType: "quad",
        status: "available",
      },
      {
        roomNumber: "A-202",
        floor: 1,
        building: "Building A",
        capacity: 2,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Study Table", "Wardrobe"],
        monthlyRent: 5200,
        securityDeposit: 10400,
        roomType: "double",
        status: "available",
      },
      // Building B - Ground Floor
      {
        roomNumber: "B-101",
        floor: 0,
        building: "Building B",
        capacity: 3,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
          { bedNumber: 3, isOccupied: false },
        ],
        amenities: ["WiFi", "Fan", "Study Table", "Wardrobe"],
        monthlyRent: 4500,
        securityDeposit: 9000,
        roomType: "triple",
        status: "available",
      },
      {
        roomNumber: "B-102",
        floor: 0,
        building: "Building B",
        capacity: 2,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Study Table"],
        monthlyRent: 4800,
        securityDeposit: 9600,
        roomType: "double",
        status: "available",
      },
      // Building B - First Floor
      {
        roomNumber: "B-201",
        floor: 1,
        building: "Building B",
        capacity: 2,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
        ],
        amenities: ["WiFi", "AC", "Fan", "Study Table", "Balcony"],
        monthlyRent: 5300,
        securityDeposit: 10600,
        roomType: "double",
        status: "available",
      },
      {
        roomNumber: "B-202",
        floor: 1,
        building: "Building B",
        capacity: 3,
        beds: [
          { bedNumber: 1, isOccupied: false },
          { bedNumber: 2, isOccupied: false },
          { bedNumber: 3, isOccupied: false },
        ],
        amenities: [
          "WiFi",
          "AC",
          "Study Table",
          "Wardrobe",
          "Attached Bathroom",
        ],
        monthlyRent: 6200,
        securityDeposit: 12400,
        roomType: "triple",
        status: "available",
      },
    ];

    await Room.insertMany(rooms);
    console.log(`✅ ${rooms.length} rooms seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding rooms:", error);
  }
};

// Seed Gates with QR Codes
const seedGates = async () => {
  try {
    // Check if gates already exist
    const existingGates = await Gate.countDocuments();
    if (existingGates > 0) {
      console.log(
        `⏭️  Gates already seeded (${existingGates} gates found), skipping...`
      );
      return;
    }

    // Get first available warden (or create one)
    let warden = await User.findOne({ role: "warden" });

    if (!warden) {
      // Create a default warden if none exists
      const hashedPassword = await bcrypt.hash("Warden@123", 10);
      warden = await User.create({
        name: "Default Warden",
        email: "warden@hostel.com",
        password: hashedPassword,
        phoneNumber: "9876543200",
        role: "warden",
      });
      console.log("📝 Created default warden for gates");
    }

    const gateLocations = [
      { name: "Main Gate", location: "Main Entrance" },
      { name: "Back Gate", location: "Rear Entrance" },
      { name: "Side Gate", location: "Side Entrance" },
    ];

    const gates = [];

    for (const gateLocation of gateLocations) {
      const qrData = `GATE_${gateLocation.name}_${Date.now()}`;
      const qrImage = await QRCode.toDataURL(qrData);

      gates.push({
        gateName: gateLocation.name,
        location: gateLocation.location,
        wardenInCharge: warden._id,
        qrCodeData: qrData,
        qrCodeImage: qrImage,
        isActive: true,
        workingHours: {
          start: "06:00",
          end: "22:00",
        },
      });
    }

    await Gate.insertMany(gates);
    console.log(`✅ ${gates.length} gates seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding gates:", error);
  }
};

// Seed Sample Students
const seedStudents = async () => {
  try {
    // Check if students already exist
    const existingStudents = await User.countDocuments({
      role: "student",
      studentId: { $regex: "^SHMS" },
    });

    if (existingStudents > 0) {
      console.log(
        `⏭️  Sample students already seeded (${existingStudents} found), skipping...`
      );
      return;
    }

    const hashedPassword = await bcrypt.hash("Student@123", 10);

    const students = [
      {
        name: "Rahul Kumar",
        email: "rahul.kumar@student.com",
        password: hashedPassword,
        phoneNumber: "9876543221",
        role: "student",
        studentId: "SHMS001",
        address: {
          street: "123 Main Street",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          country: "India",
        },
        emergencyContact: {
          name: "Priya Kumar",
          phone: "9876543222",
          relation: "Sister",
        },
      },
      {
        name: "Priya Singh",
        email: "priya.singh@student.com",
        password: hashedPassword,
        phoneNumber: "9876543223",
        role: "student",
        studentId: "SHMS002",
        address: {
          street: "456 Oak Avenue",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          country: "India",
        },
        emergencyContact: {
          name: "Arjun Singh",
          phone: "9876543224",
          relation: "Brother",
        },
      },
      {
        name: "Amit Patel",
        email: "amit.patel@student.com",
        password: hashedPassword,
        phoneNumber: "9876543225",
        role: "student",
        studentId: "SHMS003",
        address: {
          street: "789 Elm Street",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
          country: "India",
        },
        emergencyContact: {
          name: "Neha Patel",
          phone: "9876543226",
          relation: "Sister",
        },
      },
      {
        name: "Neha Gupta",
        email: "neha.gupta@student.com",
        password: hashedPassword,
        phoneNumber: "9876543227",
        role: "student",
        studentId: "SHMS004",
        address: {
          street: "321 Pine Road",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500001",
          country: "India",
        },
        emergencyContact: {
          name: "Vikram Gupta",
          phone: "9876543228",
          relation: "Father",
        },
      },
      {
        name: "Arun Sharma",
        email: "arun.sharma@student.com",
        password: hashedPassword,
        phoneNumber: "9876543229",
        role: "student",
        studentId: "SHMS005",
        address: {
          street: "654 Maple Lane",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411001",
          country: "India",
        },
        emergencyContact: {
          name: "Anjali Sharma",
          phone: "9876543230",
          relation: "Mother",
        },
      },
    ];

    await User.insertMany(students);
    console.log(`✅ ${students.length} sample students seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding students:", error);
  }
};

// Main Seed Function
const seedAll = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting data seeding...\n");

    await seedRooms();
    await seedGates();
    await seedStudents();

    console.log("\n✅ Data seeding completed successfully!\n");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed
seedAll();
