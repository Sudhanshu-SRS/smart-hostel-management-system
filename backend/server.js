const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Load environment variables
dotenv.config();

// Import routes - Fix the import paths to match your file structure
const authRoutes = require("./routes/AuthR");
const userRoutes = require("./routes/UserR");
const roomRoutes = require("./routes/Room");
const paymentRoutes = require("./routes/PaymentR");
const complaintRoutes = require("./routes/ComplaintR");
const visitorRoutes = require("./routes/VisitorR");
const dashboardRoutes = require("./routes/DashboardR");
const gateRoutes = require("./routes/gateRoutes");
const messFeedbackRoutes = require("./routes/messFeedbackRoutes");
const reportRoutes = require("./routes/ReportR");
const vacationRequestRoutes = require("./routes/vacationRequestRoutes");
const chatbotRoutes = require("./routes/chatbotR");

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
      ];

      // In development, allow all localhost origins
      if (
        process.env.NODE_ENV === "development" &&
        origin &&
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// CORS configuration - MUST be FIRST middleware (before helmet, compression, rate limiting)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
      "https://smart-hostel-management-system-puce.vercel.app", // Deployed frontend
      "https://smart-hostel-management-system-git-c674f7-sudhanshus-projects-c71364be.vercel.app", // Optional other preview URL
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all 192.168.x.x and localhost origins
    if (process.env.NODE_ENV === "development") {
      if (
        origin.includes("localhost") ||
        origin.includes("192.168") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS Rejected origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Admin-Mode", // For hardcoded admin requests
  ],
  maxAge: 86400, // 24 hours
};

// Apply CORS BEFORE any other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options("*", cors(corsOptions));

// Security middleware (AFTER CORS)
app.use(helmet());
app.use(compression());

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 for development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for specific routes during development
    if (process.env.NODE_ENV === "development") {
      // Allow all GET requests to bypass rate limiting in dev
      if (req.method === "GET") {
        return true;
      }
    }
    return false;
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Debugging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  console.log(`🔑 Auth: ${req.headers.authorization ? "Present" : "Missing"}`);
  console.log(`👤 Admin Mode: ${req.headers["x-admin-mode"] || "Normal"}`);
  next();
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  // Join admin room for real-time updates
  socket.on("joinAdmin", (adminData) => {
    socket.join("admin");
    console.log(`👨‍💼 Admin ${adminData.name} joined admin room`);
  });

  // Join student room
  socket.on("joinStudent", (studentData) => {
    socket.join(`student_${studentData.id}`);
    console.log(`🎓 Student ${studentData.name} joined their room`);
  });

  // Real-time movement tracking
  socket.on("trackMovement", (data) => {
    // Broadcast to admin panel
    io.to("admin").emit("liveMovement", {
      type: "movement_update",
      student: data.student,
      gate: data.gate,
      action: data.action,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Import and connect database
const connectDB = require("./config/databaseC");
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/gates", gateRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/mess-feedback", messFeedbackRoutes);
app.use("/api/vacation-requests", vacationRequestRoutes);
app.use("/api/chatbot", chatbotRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Smart Hostel Management System API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Initialize payment scheduler
  const paymentScheduler = require("./services/paymentScheduler");
  paymentScheduler.init();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = app;
