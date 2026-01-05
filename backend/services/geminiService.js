const OpenAI = require("openai").default;

class GeminiService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.conversationHistories = new Map();
    this.lastRequestTime = new Map();
    this.rateLimitCooldown = new Map();
    this.MIN_REQUEST_INTERVAL = 500; // 500ms minimum between requests
    this.COOLDOWN_PERIOD = 60000; // 1 minute cooldown on rate limit
  }

  async chat(userId, message) {
    try {
      // Check rate limiting
      const now = Date.now();
      const lastRequest = this.lastRequestTime.get(userId) || 0;
      const cooldownUntil = this.rateLimitCooldown.get(userId) || 0;

      if (now < cooldownUntil) {
        return {
          success: false,
          response: this.getFallbackResponse(message),
          rateLimit: true,
        };
      }

      if (now - lastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.MIN_REQUEST_INTERVAL - (now - lastRequest))
        );
      }

      // Get or create conversation history
      let history = this.conversationHistories.get(userId) || [];

      // Add user message
      history.push({
        role: "user",
        content: message,
      });

      // Keep only last 10 messages to manage token usage
      if (history.length > 20) {
        history = history.slice(-20);
      }

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful hostel management assistant. Help students with:
- Room allocation and maintenance issues
- Mess/food related queries
- Entry/exit log problems
- Complaint registration
- Payment issues
- Visitor management
- Vacation requests
- General hostel rules and policies

Be concise, friendly, and helpful. If unsure, suggest contacting hostel management.`,
          },
          ...history,
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage =
        response.choices[0].message.content ||
        this.getFallbackResponse(message);

      // Add assistant response to history
      history.push({
        role: "assistant",
        content: assistantMessage,
      });

      // Update history
      this.conversationHistories.set(userId, history);
      this.lastRequestTime.set(userId, Date.now());

      return {
        success: true,
        response: assistantMessage,
      };
    } catch (error) {
      console.error("OpenAI API Error Details:", {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
      });

      // Check for various error types
      const status = error.status || 0;

      // Handle 429 (rate limit) or 429 in message
      if (status === 429 || error.message.includes("quota")) {
        console.warn(
          `Rate limit/Quota exceeded for user ${userId}. Using fallback response.`
        );
        this.rateLimitCooldown.set(userId, Date.now() + this.COOLDOWN_PERIOD);
        return {
          success: false,
          response: this.getFallbackResponse(message),
          rateLimit: true,
        };
      }

      // Handle auth errors (invalid key)
      if (status === 401 || error.message.includes("API key")) {
        console.error(
          "OpenAI API Key Error: Check your OPENAI_API_KEY in .env"
        );
        return {
          success: false,
          response: this.getFallbackResponse(message),
          error: "API configuration error - using fallback response",
        };
      }

      // For any other error, return fallback
      console.warn(`OpenAI API Error (${status}): Using fallback response`);
      return {
        success: false,
        response: this.getFallbackResponse(message),
        error: error.message,
      };
    }
  }

  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    const responses = {
      room: "For room-related issues, please visit the hostel office or contact your RA. You can also file a complaint through the system.",
      mess: "For mess/food issues, contact the mess manager or file a feedback through the feedback system.",
      payment:
        "For payment issues, log in to your account to check payment status. Contact the hostel office for assistance.",
      complaint:
        "You can file a complaint through the Complaints section. Our team will review and respond shortly.",
      visitor:
        "For visitor management, log in and go to Visitors section to manage your visitor requests.",
      entry:
        "Entry/Exit logs are automatically tracked. Check your dashboard for recent activity. Contact hostel office if there are discrepancies.",
      vacation:
        "Submit vacation requests through the Vacation Request section. Approval usually takes 24-48 hours.",
      rules:
        "Hostel rules are available in the System Documentation. Contact hostel office for clarification.",
      emergency:
        "For emergencies, contact the hostel warden immediately. Use the complaint system for urgent non-emergency issues.",
      gate: "Gate access information is managed by security. Contact the security office for access issues.",
      lost: "For lost and found items, contact the hostel office. File a complaint if needed for tracking.",
    };

    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }

    return "I'm here to help! You can ask me about room allocation, mess, payments, complaints, visitors, entry/exit, vacation requests, or hostel rules. What would you like help with?";
  }

  clearHistory(userId) {
    this.conversationHistories.delete(userId);
    this.lastRequestTime.delete(userId);
    this.rateLimitCooldown.delete(userId);
  }
}

module.exports = new GeminiService();
