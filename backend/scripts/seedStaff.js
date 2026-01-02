const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/db");

const defaultStaff = [
  {
    name: "Raj Kumar - Electrician",
    email: "electrician@smarthostel.com",
    password: "Staff@123",
    role: "staff",
    phoneNumber: "9876543210",
    specialization: "electrical",
    isActive: true,
  },
  {
    name: "Mohan Singh - Plumber",
    email: "plumber@smarthostel.com",
    password: "Staff@123",
    role: "staff",
    phoneNumber: "9876543211",
    specialization: "plumbing",
    isActive: true,
  },
  {
    name: "Ramesh Yadav - Maintenance",
    email: "maintenance@smarthostel.com",
    password: "Staff@123",
    role: "staff",
    phoneNumber: "9876543212",
    specialization: "maintenance",
    isActive: true,
  },
  {
    name: "Priya Sharma - Cleaning",
    email: "cleaning@smarthostel.com",
    password: "Staff@123",
    role: "staff",
    phoneNumber: "9876543213",
    specialization: "cleaning",
    isActive: true,
  },
  {
    name: "Arun Patel - Security",
    email: "security@smarthostel.com",
    password: "Staff@123",
    role: "staff",
    phoneNumber: "9876543214",
    specialization: "security",
    isActive: true,
  },
  {
    name: "Vikram Singh - WiFi/Network",
    email: "wifi@smarthostel.com",
    password: "Staff@123",
    role: "staff",
    phoneNumber: "9876543215",
    specialization: "wifi",
    isActive: true,
  },
];

async function seedStaff() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if staff already exists
    const existingStaff = await User.find({ role: "staff" });
    if (existingStaff.length > 0) {
      console.log(
        `⚠️  ${existingStaff.length} staff members already exist. Skipping seed.`
      );
      console.log("To reset, delete existing staff members first.");
      process.exit(0);
    }

    // Create staff members
    const createdStaff = [];
    for (const staff of defaultStaff) {
      // Hash password
      const hashedPassword = await bcrypt.hash(staff.password, 10);

      const newStaff = new User({
        ...staff,
        password: hashedPassword,
      });

      const saved = await newStaff.save();
      createdStaff.push(saved);
      console.log(`✅ Created staff: ${staff.name} (${staff.email})`);
    }

    console.log(
      `\n🎉 Successfully seeded ${createdStaff.length} staff members!`
    );
    console.log("\nStaff Login Credentials:");
    console.log("Password for all: Staff@123\n");

    defaultStaff.forEach((staff) => {
      console.log(`📧 ${staff.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding staff:", error.message);
    process.exit(1);
  }
}

seedStaff();
