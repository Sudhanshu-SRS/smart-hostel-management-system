const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      enum: [
        "maintenance",
        "electrical",
        "plumbing",
        "cleaning",
        "security",
        "wifi",
        "noise",
        "other",
      ],
      required: [true, "Category is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed", "rejected"],
      default: "open",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    location: {
      type: String,
      trim: true,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        comment: {
          type: String,
          required: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isInternal: {
          type: Boolean,
          default: false,
        },
      },
    ],
    expectedResolutionDate: Date,
    actualResolutionDate: Date,
    resolutionNotes: {
      type: String,
      maxlength: [500, "Resolution notes cannot exceed 500 characters"],
    },
    cost: {
      type: Number,
      min: [0, "Cost cannot be negative"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    feedback: {
      type: String,
      maxlength: [300, "Feedback cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
complaintSchema.index({ user: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ assignedTo: 1 });

// Auto-assign priority based on category
complaintSchema.pre("save", function (next) {
  if (this.isNew) {
    const urgentCategories = ["electrical", "plumbing", "security"];
    const highCategories = ["maintenance", "wifi"];

    if (urgentCategories.includes(this.category)) {
      this.priority = "urgent";
    } else if (highCategories.includes(this.category)) {
      this.priority = "high";
    }
  }
  next();
});

module.exports = mongoose.model("Complaint", complaintSchema);
