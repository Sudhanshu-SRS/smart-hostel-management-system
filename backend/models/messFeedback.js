const mongoose = require("mongoose");

const messFeedbackSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    foodQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    overallSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "all"],
      required: true,
    },
    suggestions: {
      type: String,
      maxlength: 500,
    },
    complaints: {
      type: String,
      maxlength: 500,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one feedback per student per day for daily feedback
messFeedbackSchema.index(
  {
    student: 1,
    feedbackType: 1,
    date: 1,
  },
  {
    unique: true,
    partialFilterExpression: { feedbackType: "daily" },
  }
);

module.exports = mongoose.model("MessFeedback", messFeedbackSchema);
