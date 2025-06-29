const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");
const User = require("../models/db");
const Room = require("../models/room");
const { auth, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   GET /api/payments
// @desc    Get all payments (with filters)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { status, paymentType, user: userId } = req.query;
    const filter = {};

    // Students can only see their own payments
    if (req.user.role === "student") {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    if (status) filter.status = status;
    if (paymentType) filter.paymentType = paymentType;

    const payments = await Payment.find(filter)
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Students can only view their own payments
    if (
      req.user.role === "student" &&
      payment.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, paymentType, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user._id,
        paymentType,
        description,
      },
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      user: req.user._id,
      room: req.user.room,
      amount,
      paymentType,
      description,
      razorpayOrderId: order.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "pending",
    });

    await payment.save();

    res.json({
      success: true,
      order,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "completed";
    payment.paidDate = new Date();
    await payment.save();

    // Emit real-time notification
    const io = req.app.get("io");
    io.emit("paymentCompleted", {
      paymentId: payment._id,
      userId: payment.user,
      amount: payment.amount,
      paymentType: payment.paymentType,
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments
// @desc    Create manual payment (Admin/Warden)
// @access  Admin/Warden
router.post("/", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const { userId, amount, paymentType, paymentMethod, description, dueDate } =
      req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const payment = new Payment({
      user: userId,
      room: user.room,
      amount,
      paymentType,
      paymentMethod,
      description,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: paymentMethod === "cash" ? "completed" : "pending",
      paidDate: paymentMethod === "cash" ? new Date() : undefined,
    });

    await payment.save();
    await payment.populate("user", "name email studentId phoneNumber");

    // Emit real-time notification
    const io = req.app.get("io");
    io.emit("paymentCreated", payment);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Admin/Warden
router.put("/:id", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "name email studentId phoneNumber");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("paymentUpdated", payment);

    res.json({
      success: true,
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/user/:userId
// @desc    Get payments for specific user
// @access  Admin/Warden/Own user
router.get("/user/:userId", auth, async (req, res) => {
  try {
    // Check authorization
    if (
      req.user.role === "student" &&
      req.user._id.toString() !== req.params.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const payments = await Payment.find({ user: req.params.userId })
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/stats/summary
// @desc    Get payment statistics
// @access  Admin/Warden
router.get(
  "/stats/summary",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const stats = await Payment.aggregate([
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: "$finalAmount" },
            completedPayments: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            pendingPayments: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            completedAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, "$finalAmount", 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, "$finalAmount", 0],
              },
            },
          },
        },
      ]);

      const paymentStats = stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        completedAmount: 0,
        pendingAmount: 0,
      };

      res.json({
        success: true,
        stats: paymentStats,
      });
    } catch (error) {
      console.error("Get payment stats error:", error);
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
