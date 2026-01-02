const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for the hostel management chatbot
const HOSTEL_SYSTEM_PROMPT = `You are a helpful and friendly chatbot assistant for a Hostel Management System. 
Your role is to help hostel residents and staff with:
- Room assignments and inquiries
- Hostel rules and regulations
- Visitor management
- Payment and billing questions
- Complaint lodging and tracking
- Leave and vacation requests
- Entry/exit procedures
- Mess feedback and meal-related queries
- General hostel information
- Account management

Always be polite, professional, and helpful. If you don't know something about the hostel system, 
ask the user to contact the hostel management office. Provide concise and clear answers.`;

class GeminiService {
  constructor() {
    this.conversationHistory = new Map();
  }

  /**
   * Chat with Gemini AI
   * @param {string} userId - Unique user identifier
   * @param {string} userMessage - User's message
   * @returns {Promise<string>} - AI response
   */
  async chat(userId, userMessage) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Initialize conversation for this user if not exists
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const history = this.conversationHistory.get(userId);

      // Build conversation history
      const messages = [
        {
          role: "user",
          parts: [{ text: HOSTEL_SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'm a hostel management assistant. How can I help you?",
            },
          ],
        },
        ...history,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ];

      // Start chat session
      const chat = model.startChat({
        history: messages.slice(0, -1), // All except the current message
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const responseText = response.text();

      // Store in history
      history.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
      history.push({
        role: "model",
        parts: [{ text: responseText }],
      });

      // Keep only last 20 messages to avoid memory issues
      if (history.length > 40) {
        history.splice(0, 20);
      }

      return responseText;
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  /**
   * Clear conversation history for a user
   * @param {string} userId - User identifier
   */
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get conversation summary
   * @param {string} userId - User identifier
   * @returns {Array} - Conversation history
   */
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }
}

module.exports = new GeminiService();
