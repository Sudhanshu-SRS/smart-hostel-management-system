const mongoose = require("mongoose");

const vacationRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason for vacation is required"],
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminApproval: {
      admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approved: {
        type: Boolean,
        default: false,
      },
      approvalDate: Date,
      comments: String,
    },
    wardenApproval: {
      warden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approved: {
        type: Boolean,
        default: false,
      },
      approvalDate: Date,
      comments: String,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    finalApprovalDate: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

// Index for faster queries
vacationRequestSchema.index({ student: 1, status: 1 });
vacationRequestSchema.index({ room: 1, status: 1 });
vacationRequestSchema.index({ status: 1 });
vacationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("VacationRequest", vacationRequestSchema);
