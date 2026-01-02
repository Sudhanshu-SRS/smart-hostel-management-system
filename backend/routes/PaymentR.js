const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");
const User = require("../models/db");
const Room = require("../models/room");
const { auth, authorize } = require("../middleware/authmiddleware");
const paymentNotificationService = require("../services/paymentNotificationService");
const paymentScheduler = require("../services/paymentScheduler");
const emailService = require("../services/emailService");

const router = express.Router();

// Initialize Razorpay with validation
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠️ Razorpay credentials not configured - using demo mode");
  }
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "test_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret",
  });
} catch (error) {
  console.error("❌ Failed to initialize Razorpay:", error.message);
}

// ======= SPECIFIC ROUTES MUST COME FIRST (before generic / and /:id routes) =======
// Order: Specific named routes first (/create-order, /verify, /webhook, /user/:userId, /stats/*, /overdue, /analytics, /manual, etc.)
// Then: Generic routes (POST /, PUT /:id, GET /:id, GET /)

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, paymentType, description, roomId } = req.body;

    // Validate required fields
    if (!amount || !paymentType) {
      return res.status(400).json({
        success: false,
        message: "Amount and payment type are required",
      });
    }

    // Create payment record with pending status
    const paymentData = {
      user: req.user._id,
      amount: parseFloat(amount),
      paymentType,
      description: description || `${paymentType.replace("_", " ")} payment`,
      status: "pending",
      dueDate: new Date(),
      lateFee: 0,
      discount: 0,
      finalAmount: parseFloat(amount), // Set finalAmount equal to amount initially
    };

    if (roomId) {
      paymentData.room = roomId;
    }

    const payment = new Payment(paymentData);
    await payment.save();

    // Create Razorpay order
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Convert to paise
      currency: "INR",
      receipt: `rcpt_${payment._id}`,
      notes: {
        paymentId: payment._id.toString(),
        userId: req.user._id.toString(),
        paymentType: paymentType,
      },
    };

    console.log("🔑 Razorpay Credentials Check:", {
      keyIdPresent: !!process.env.RAZORPAY_KEY_ID,
      keySecretPresent: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdStartsWith: process.env.RAZORPAY_KEY_ID?.substring(0, 10),
    });

    const razorpayOrder = await razorpay.orders.create(options);

    // Update payment with Razorpay order ID
    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();

    res.json({
      success: true,
      order: razorpayOrder,
      payment: payment,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
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

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !paymentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification data",
      });
    }

    // Find the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Payment successful - update payment record
    payment.status = "completed";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidDate = new Date();
    payment.paymentMethod = "razorpay";

    await payment.save();

    // Populate user data for email
    await payment.populate("user", "name email studentId phoneNumber");

    // Send payment confirmation email
    await paymentNotificationService.sendPaymentConfirmation(payment._id);

    // Send payment acknowledgment email
    await emailService
      .sendPaymentAcknowledgmentEmail(payment.user, payment)
      .then((result) => {
        if (result.success) {
          console.log(
            `📧 Payment acknowledgment email sent to ${payment.user.email}`
          );
        } else {
          console.error(
            `❌ Failed to send payment acknowledgment email:`,
            result.error
          );
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending payment acknowledgment email:`, error);
      });

    // Populate room data for response
    await payment.populate("room", "roomNumber building floor");

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment: payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay webhooks
// @access  Public (but verified)
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const { event, payload } = req.body;

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload.payment.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity);
        break;
      case "refund.created":
        await handleRefundCreated(payload.refund.entity);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
});

// Helper function to handle payment captured
async function handlePaymentCaptured(paymentEntity) {
  try {
    const payment = await Payment.findOne({
      razorpayOrderId: paymentEntity.order_id,
    });

    if (payment && payment.status === "pending") {
      payment.status = "completed";
      payment.razorpayPaymentId = paymentEntity.id;
      payment.paidDate = new Date();
      await payment.save();

      console.log(`Payment captured for order: ${paymentEntity.order_id}`);
    }
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

// Helper function to handle payment failed
async function handlePaymentFailed(paymentEntity) {
  try {
    const payment = await Payment.findOne({
      razorpayOrderId: paymentEntity.order_id,
    });

    if (payment) {
      payment.status = "failed";
      await payment.save();

      console.log(`Payment failed for order: ${paymentEntity.order_id}`);
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

// Helper function to handle refund created
async function handleRefundCreated(refundEntity) {
  try {
    const payment = await Payment.findOne({
      razorpayPaymentId: refundEntity.payment_id,
    });

    if (payment) {
      payment.status = "refunded";
      await payment.save();

      console.log(`Refund created for payment: ${refundEntity.payment_id}`);
    }
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}

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
      finalAmount: parseFloat(amount),
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

// @route   GET /api/payments/stats/my-summary
// @desc    Get user's own payment statistics
// @access  Private (students can access their own stats)
router.get("/stats/my-summary", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Payment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          completedPayments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          completedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
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
      failedPayments: 0,
      completedAmount: 0,
      pendingAmount: 0,
    };

    res.json({
      success: true,
      stats: paymentStats,
    });
  } catch (error) {
    console.error("Get user payment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/manual
// @desc    Create manual payment (admin only)
// @access  Admin/Warden
router.post("/manual", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const { userId, amount, paymentType, paymentMethod, description, roomId } =
      req.body;

    // Validate required fields
    if (!userId || !amount || !paymentType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, amount, payment type, and payment method are required",
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create payment record
    const paymentData = {
      user: userId,
      amount: parseFloat(amount),
      paymentType,
      paymentMethod,
      description:
        description || `Manual ${paymentType.replace("_", " ")} payment`,
      status: "completed",
      dueDate: new Date(),
      paidDate: new Date(),
      finalAmount: parseFloat(amount),
    };

    if (roomId) {
      paymentData.room = roomId;
    }

    const payment = new Payment(paymentData);
    await payment.save();

    // Populate user and room data
    await payment.populate("user", "name email studentId phoneNumber");
    await payment.populate("room", "roomNumber building floor");

    res.json({
      success: true,
      message: "Manual payment created successfully",
      payment: payment,
    });
  } catch (error) {
    console.error("Create manual payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Process refund (admin only)
// @access  Admin/Warden
router.post(
  "/:id/refund",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { amount: refundAmount, reason } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      if (payment.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Can only refund completed payments",
        });
      }

      let refundAmountToProcess = refundAmount || payment.finalAmount;

      // Process refund through Razorpay if it was a Razorpay payment
      if (payment.paymentMethod === "razorpay" && payment.razorpayPaymentId) {
        try {
          const refund = await razorpay.payments.refund(
            payment.razorpayPaymentId,
            {
              amount: Math.round(refundAmountToProcess * 100), // Convert to paise
              notes: {
                reason: reason || "Refund processed by admin",
                refundedBy: req.user._id.toString(),
              },
            }
          );

          payment.status = "refunded";
          payment.description = `${payment.description} - Refunded: ₹${refundAmountToProcess}`;
          await payment.save();

          res.json({
            success: true,
            message: "Refund processed successfully",
            refund: refund,
            payment: payment,
          });
        } catch (razorpayError) {
          console.error("Razorpay refund error:", razorpayError);
          res.status(500).json({
            success: false,
            message: "Failed to process refund through Razorpay",
            error: razorpayError.message,
          });
        }
      } else {
        // Manual refund for non-Razorpay payments
        payment.status = "refunded";
        payment.description = `${payment.description} - Manual Refund: ₹${refundAmountToProcess}`;
        await payment.save();

        res.json({
          success: true,
          message: "Manual refund processed successfully",
          payment: payment,
        });
      }
    } catch (error) {
      console.error("Process refund error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process refund",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/payments/overdue
// @desc    Get overdue payments
// @access  Admin/Warden
router.get("/overdue", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    console.log("📊 Fetching overdue payments...");
    const overduePayments = await Payment.find({
      status: "pending",
      dueDate: { $lt: new Date() },
    })
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .sort({ dueDate: 1 });

    console.log("✅ Found overdue payments:", overduePayments.length);
    res.json({
      success: true,
      count: overduePayments.length,
      payments: overduePayments,
    });
  } catch (error) {
    console.error("❌ Get overdue payments error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/analytics
// @desc    Get payment analytics
// @access  Admin/Warden
router.get(
  "/analytics",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      console.log("📊 Fetching payment analytics...");
      const { startDate, endDate } = req.query;
      const filter = {};

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      console.log("📋 Using filter:", filter);

      // Get analytics data
      const [
        totalRevenue,
        pendingPayments,
        completedPayments,
        overduePayments,
        paymentsByType,
        monthlyRevenue,
      ] = await Promise.all([
        Payment.aggregate([
          { $match: { ...filter, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$finalAmount" } } },
        ]),
        Payment.countDocuments({ ...filter, status: "pending" }),
        Payment.countDocuments({ ...filter, status: "completed" }),
        Payment.countDocuments({
          ...filter,
          status: "pending",
          dueDate: { $lt: new Date() },
        }),
        Payment.aggregate([
          { $match: { ...filter, status: "completed" } },
          {
            $group: {
              _id: "$paymentType",
              total: { $sum: "$finalAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
        Payment.aggregate([
          { $match: { ...filter, status: "completed" } },
          {
            $group: {
              _id: {
                year: { $year: "$paidDate" },
                month: { $month: "$paidDate" },
              },
              revenue: { $sum: "$finalAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

      const analytics = {
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        completedPayments,
        overduePayments,
        paymentsByType,
        monthlyRevenue,
        totalPayments: pendingPayments + completedPayments,
      };

      console.log("✅ Analytics data ready");
      res.json({
        success: true,
        analytics,
      });
    } catch (error) {
      console.error("❌ Get payment analytics error:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment analytics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/payments/send-reminders
// @desc    Send payment reminders manually
// @access  Admin/Warden
router.post(
  "/send-reminders",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const result = await paymentScheduler.sendManualReminders();
      res.json(result);
    } catch (error) {
      console.error("Send reminders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send payment reminders",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/payments/send-overdue-alerts
// @desc    Send overdue alerts to admins manually
// @access  Admin/Warden
router.post(
  "/send-overdue-alerts",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const result = await paymentScheduler.sendManualOverdueAlerts();
      res.json(result);
    } catch (error) {
      console.error("Send overdue alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send overdue alerts",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ======= GENERIC ROUTES (at the end, after all specific routes) =======

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

module.exports = router;
