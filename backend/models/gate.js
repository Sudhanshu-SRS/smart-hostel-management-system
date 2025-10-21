// backend/models/Gate.js
const mongoose = require("mongoose");

const gateSchema = new mongoose.Schema(
  {
    gateId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `GATE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    },
    gateName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    wardenInCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    qrCodeData: {
      type: String,
      required: true,
      unique: true,
    },
    qrCodeImage: {
      type: String, // Base64 encoded QR code image
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    workingHours: {
      start: {
        type: String,
        default: "06:00",
      },
      end: {
        type: String,
        default: "22:00",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gate", gateSchema);
