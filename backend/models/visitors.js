const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    idType: {
      type: String,
      enum: ["aadhar", "passport", "driving_license", "voter_id", "pan_card"],
      required: [true, "ID type is required"],
    },
    idNumber: {
      type: String,
      required: [true, "ID number is required"],
      trim: true,
    },
    photo: {
      public_id: String,
      url: String,
    },
    visitingStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Visiting student is required"],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
    },
    purpose: {
      type: String,
      required: [true, "Purpose of visit is required"],
      maxlength: [200, "Purpose cannot exceed 200 characters"],
    },
    relationship: {
      type: String,
      enum: ["parent", "sibling", "friend", "relative", "other"],
      required: [true, "Relationship is required"],
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    expectedCheckOutTime: {
      type: Date,
      required: [true, "Expected checkout time is required"],
    },
    actualCheckOutTime: Date,
    status: {
      type: String,
      enum: [
        "waiting_approval",
        "checked_in",
        "checked_out",
        "overstayed",
        "rejected",
      ],
      default: "waiting_approval",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalTime: Date,
    rejectionReason: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    vehicleDetails: {
      type: String,
      number: String,
    },
    baggage: {
      type: String,
      maxlength: [100, "Baggage description cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
visitorSchema.index({ visitingStudent: 1 });
visitorSchema.index({ status: 1 });
visitorSchema.index({ checkInTime: 1 });
visitorSchema.index({ room: 1 });

// Check for overstay
visitorSchema.methods.checkOverstay = function () {
  if (this.status === "checked_in" && new Date() > this.expectedCheckOutTime) {
    this.status = "overstayed";
    return true;
  }
  return false;
};

// Auto-update status on save
visitorSchema.pre("save", function (next) {
  if (this.status === "checked_in") {
    this.checkOverstay();
  }
  next();
});

module.exports = mongoose.model("Visitor", visitorSchema);
