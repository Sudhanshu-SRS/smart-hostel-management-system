const express = require("express");
const { auth, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

// Get all mess feedback
router.get("/", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Mess feedback retrieved successfully",
      feedback: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Submit mess feedback
router.post("/", auth, async (req, res) => {
  try {
    const { rating, comments, category } = req.body;

    // Add your feedback submission logic here

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: {
        id: Date.now(), // temporary ID
        userId: req.user.id,
        rating,
        comments,
        category,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
