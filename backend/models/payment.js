const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentType: {
      type: String,
      enum: [
        "monthly_rent",
        "security_deposit",
        "maintenance",
        "fine",
        "laundry",
        "mess_fee",
      ],
      required: [true, "Payment type is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cash", "bank_transfer", "upi"],
      default: "razorpay",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    paidDate: Date,
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    receipt: {
      public_id: String,
      url: String,
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    lateFee: {
      type: Number,
      default: 0,
      min: [0, "Late fee cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentType: 1 });
paymentSchema.index({ dueDate: 1 });

// Calculate final amount before saving
paymentSchema.pre("save", function (next) {
  this.finalAmount = this.amount + this.lateFee - this.discount;
  next();
});

// Generate transaction ID
paymentSchema.pre("save", function (next) {
  if (!this.transactionId && this.status === "completed") {
    this.transactionId =
      "TXN" +
      Date.now() +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
