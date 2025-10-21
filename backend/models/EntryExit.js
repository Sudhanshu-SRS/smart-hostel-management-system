// backend/models/EntryExit.js
const mongoose = require("mongoose");

const entryExitLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gate",
      required: true,
    },
    actionType: {
      type: String,
      enum: ["exit", "entry"],
      required: true,
    },
    outingReason: {
      type: String,
      required: function () {
        return this.actionType === "exit";
      },
      maxlength: 200,
    },
    expectedReturnTime: {
      type: Date,
      required: function () {
        return this.actionType === "exit";
      },
    },
    actualReturnTime: {
      type: Date,
      default: function () {
        return this.actionType === "entry" ? new Date() : null;
      },
    },
    isLateReturn: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
    notificationsSent: {
      parentEmail: { type: Boolean, default: false },
      wardenEmail: { type: Boolean, default: false },
      lateReturnAlert: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
entryExitLogSchema.index({ student: 1, createdAt: -1 });
entryExitLogSchema.index({ gate: 1, createdAt: -1 });
entryExitLogSchema.index({ actionType: 1, createdAt: -1 });

// Check for late return
entryExitLogSchema.methods.checkLateReturn = function () {
  if (this.actionType === "entry" && this.expectedReturnTime) {
    this.isLateReturn = new Date() > this.expectedReturnTime;
    return this.isLateReturn;
  }
  return false;
};

module.exports = mongoose.model("EntryExitLog", entryExitLogSchema);
