const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/db");
const Room = require("../models/room");
const Complaint = require("../models/complaint");
const Payment = require("../models/payment");
const EntryExit = require("../models/EntryExit");
const Gate = require("../models/gate");

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

// Seed Complaints
const seedComplaints = async () => {
  try {
    const existingComplaints = await Complaint.countDocuments();
    if (existingComplaints > 0) {
      console.log(
        `⏭️  Complaints already seeded (${existingComplaints} found), skipping...`
      );
      return;
    }

    const students = await User.find({ role: "student" }).limit(3);
    const staff = await User.find({ role: "staff" }).limit(2);

    if (students.length === 0) {
      console.log("⚠️  No students found. Skipping complaint seeding.");
      return;
    }

    const complaints = [
      {
        user: students[0]._id,
        category: "electrical",
        title: "AC is not working",
        description:
          "The air conditioner in my room has stopped working for 2 days.",
        priority: "high",
        status: "open",
        comments: [
          {
            user: staff[0]?._id || students[0]._id,
            comment: "Will check tomorrow morning",
            timestamp: new Date(),
          },
        ],
      },
      {
        user: students[1]._id,
        category: "cleaning",
        title: "Poor food quality",
        description:
          "The food quality in the mess has deteriorated. Please look into this.",
        priority: "medium",
        status: "in_progress",
        assignedTo: staff[0]?._id,
        comments: [
          {
            user: staff[0]?._id || students[1]._id,
            comment: "We will speak to the mess manager",
            timestamp: new Date(),
          },
        ],
      },
      {
        user: students[2]._id,
        category: "plumbing",
        title: "Water leakage in bathroom",
        description: "There's water leakage from the ceiling in the bathroom.",
        priority: "high",
        status: "open",
        comments: [],
      },
      {
        user: students[0]._id,
        category: "noise",
        title: "Excessive noise from adjacent room",
        description: "Neighbors are making too much noise late at night.",
        priority: "low",
        status: "resolved",
        comments: [
          {
            user: staff[1]?._id || students[0]._id,
            comment: "Spoke to the neighbors. Issue resolved.",
            timestamp: new Date(),
          },
        ],
      },
    ];

    await Complaint.insertMany(complaints);
    console.log(`✅ ${complaints.length} complaints seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding complaints:", error);
  }
};

// Seed Payments
const seedPayments = async () => {
  try {
    const existingPayments = await Payment.countDocuments();
    if (existingPayments > 0) {
      console.log(
        `⏭️  Payments already seeded (${existingPayments} found), skipping...`
      );
      return;
    }

    const students = await User.find({ role: "student" }).limit(5);

    if (students.length === 0) {
      console.log("⚠️  No students found. Skipping payment seeding.");
      return;
    }

    const payments = [
      {
        user: students[0]._id,
        amount: 5000,
        paymentType: "monthly_rent",
        paymentMethod: "razorpay",
        status: "completed",
        transactionId: "TXN123456",
        paidDate: new Date("2024-11-01"),
        dueDate: new Date("2024-11-10"),
        lateFee: 0,
        discount: 0,
        finalAmount: 5000,
      },
      {
        user: students[1]._id,
        amount: 6000,
        paymentType: "monthly_rent",
        paymentMethod: "razorpay",
        status: "pending",
        paidDate: null,
        dueDate: new Date("2024-11-10"),
        lateFee: 0,
        discount: 0,
        finalAmount: 6000,
      },
      {
        user: students[2]._id,
        amount: 4500,
        paymentType: "monthly_rent",
        paymentMethod: "razorpay",
        status: "completed",
        transactionId: "TXN123457",
        paidDate: new Date("2024-11-05"),
        dueDate: new Date("2024-11-10"),
        lateFee: 0,
        discount: 500,
        finalAmount: 4000,
      },
      {
        user: students[3]._id,
        amount: 5200,
        paymentType: "monthly_rent",
        paymentMethod: "razorpay",
        status: "completed",
        transactionId: "TXN123458",
        paidDate: new Date("2024-10-15"),
        dueDate: new Date("2024-10-10"),
        lateFee: 200,
        discount: 0,
        finalAmount: 5400,
      },
      {
        user: students[4]._id,
        amount: 5300,
        paymentType: "monthly_rent",
        paymentMethod: "razorpay",
        status: "completed",
        transactionId: "TXN123459",
        paidDate: new Date("2024-11-03"),
        dueDate: new Date("2024-11-10"),
        lateFee: 0,
        discount: 0,
        finalAmount: 5300,
      },
    ];

    await Payment.insertMany(payments);
    console.log(`✅ ${payments.length} payments seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding payments:", error);
  }
};

// Seed Entry-Exit Records
const seedEntryExit = async () => {
  try {
    const existingRecords = await EntryExit.countDocuments();
    if (existingRecords > 0) {
      console.log(
        `⏭️  Entry-Exit records already seeded (${existingRecords} found), skipping...`
      );
      return;
    }

    const students = await User.find({ role: "student" }).limit(5);
    const gates = await Gate.find().limit(2);
    const warden = await User.findOne({ role: "warden" });

    if (students.length === 0 || gates.length === 0 || !warden) {
      console.log(
        "⚠️  Not enough students, gates, or warden. Skipping entry-exit seeding."
      );
      return;
    }

    const records = [
      {
        student: students[0]._id,
        gate: gates[0]._id,
        actionType: "entry",
        approvedBy: warden._id,
        status: "approved",
        actualReturnTime: new Date("2024-11-19T08:00:00"),
      },
      {
        student: students[1]._id,
        gate: gates[1]._id,
        actionType: "exit",
        outingReason: "Going to library for studies",
        expectedReturnTime: new Date("2024-11-19T19:00:00"),
        approvedBy: warden._id,
        status: "approved",
      },
      {
        student: students[2]._id,
        gate: gates[0]._id,
        actionType: "entry",
        approvedBy: warden._id,
        status: "approved",
        actualReturnTime: new Date("2024-11-19T07:00:00"),
      },
      {
        student: students[3]._id,
        gate: gates[1]._id,
        actionType: "exit",
        outingReason: "Going home for weekend",
        expectedReturnTime: new Date("2024-11-21T18:00:00"),
        approvedBy: warden._id,
        status: "approved",
      },
      {
        student: students[4]._id,
        gate: gates[0]._id,
        actionType: "entry",
        approvedBy: warden._id,
        status: "approved",
        actualReturnTime: new Date("2024-11-18T20:00:00"),
      },
      {
        student: students[0]._id,
        gate: gates[1]._id,
        actionType: "exit",
        outingReason: "Going to hospital for checkup",
        expectedReturnTime: new Date("2024-11-19T17:00:00"),
        approvedBy: warden._id,
        status: "approved",
      },
    ];

    await EntryExit.insertMany(records);
    console.log(`✅ ${records.length} entry-exit records seeded successfully`);
  } catch (error) {
    console.error("❌ Error seeding entry-exit records:", error);
  }
};

// Main Seed Function
const seedAll = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting additional data seeding...\n");

    await seedComplaints();
    await seedPayments();
    await seedEntryExit();

    console.log("\n✅ Additional data seeding completed successfully!\n");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed
seedAll();
