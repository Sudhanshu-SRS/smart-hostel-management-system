const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authmiddleware");
const geminiService = require("../services/geminiService");

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot and get a response
 */
router.post("/message", auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Validate message
    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const userId = req.user.id;

    // Get response from Gemini
    const response = await geminiService.chat(userId, message);

    res.status(200).json({
      success: true,
      message: message,
      response: response,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({
      success: false,
      message: "Error communicating with chatbot",
      error: error.message,
    });
  }
});

/**
 * GET /api/chatbot/history
 * Get conversation history for the user
 */
router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = geminiService.getHistory(userId);

    res.status(200).json({
      success: true,
      history: history,
    });
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving history",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/chatbot/history
 * Clear conversation history for the user
 */
router.delete("/history", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    geminiService.clearHistory(userId);

    res.status(200).json({
      success: true,
      message: "Conversation history cleared",
    });
  } catch (error) {
    console.error("Clear History Error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing history",
      error: error.message,
    });
  }
});

module.exports = router;
