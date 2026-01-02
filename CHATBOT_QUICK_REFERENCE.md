# Gemini Chatbot - Quick Reference Guide

## 🚀 Quick Start (5 minutes)

### 1️⃣ Get API Key

Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create a new API key

### 2️⃣ Install Package

```bash
cd backend
npm install @google/generative-ai
```

### 3️⃣ Add to .env

```env
GEMINI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxx
```

### 4️⃣ Run Your App

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 5️⃣ Test It

- Open http://localhost:3000
- Look for the chatbot button in bottom-right corner
- Click and start chatting!

---

## 📁 Files Created/Modified

### Backend

- `services/geminiService.js` - Gemini API integration
- `routes/chatbotR.js` - Chatbot API endpoints
- `server.js` - Updated with chatbot routes
- `.env.example` - Environment template

### Frontend

- `components/Chatbot/ChatbotWidget.jsx` - Chat UI component
- `components/Chatbot/ChatbotWidget.css` - Styling
- `App.jsx` - Integrated chatbot widget

### Documentation

- `CHATBOT_SETUP.md` - Detailed setup guide
- `setup-chatbot.bat` - Windows setup script
- `setup-chatbot.sh` - Linux/Mac setup script

---

## 🔧 Configuration

### Backend (.env)

```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
MONGO_URI=your_mongo_uri
```

### Frontend (.env or .env.local)

```env
VITE_API_URL=http://localhost:5000
```

---

## 📡 API Endpoints

### Send Message

```
POST /api/chatbot/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What are the hostel rules?"
}
```

### Get History

```
GET /api/chatbot/history
Authorization: Bearer {token}
```

### Clear History

```
DELETE /api/chatbot/history
Authorization: Bearer {token}
```

---

## 🎨 UI Features

✅ **Floating Button** - Appears in bottom-right corner
✅ **Expandable Chat Window** - 380px wide, responsive
✅ **Message Timestamps** - Shows when each message was sent
✅ **Loading Indicator** - Animated typing dots while waiting
✅ **Clear History** - One-click history clearing
✅ **Error Handling** - User-friendly error messages
✅ **Mobile Responsive** - Works on phones and tablets

---

## 💬 Example Conversations

### Student Asking About Rooms

```
Student: "How do I get a different room?"
Bot: "To change your room assignment, you can:
1. Contact the hostel administration office
2. Fill out a room change form if available
3. Specify your preferences and reasons
...
```

### About Payments

```
Student: "When is the next payment due?"
Bot: "For payment information, please:
1. Check your student portal
2. Contact the finance office
3. Submit your payment through the app's payment section
...
```

---

## 🐛 Troubleshooting

| Problem                  | Solution                                       |
| ------------------------ | ---------------------------------------------- |
| Chatbot not showing      | Make sure ChatbotWidget is imported in App.jsx |
| "API Key not configured" | Add GEMINI_API_KEY to backend/.env             |
| Slow responses           | Check internet, verify API quota               |
| Authentication error     | Ensure you're logged in and token is valid     |
| CORS errors              | Check backend CORS configuration               |

---

## 🔒 Security

✅ API key stored securely in backend .env
✅ Never exposed to frontend
✅ All requests require JWT authentication
✅ Input validation on all messages
✅ Rate limiting to prevent abuse
✅ Conversation history cleaned automatically

---

## 🎓 Customization Tips

### Change Chatbot Behavior

Edit `HOSTEL_SYSTEM_PROMPT` in `geminiService.js` to train it about your hostel

### Change UI Colors

Update gradient colors in `ChatbotWidget.css`:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adjust Position

Modify bottom/right values in `.chatbot-widget` CSS:

```css
bottom: 20px; /* Distance from bottom */
right: 20px; /* Distance from right */
```

---

## 📊 Usage Statistics

The chatbot automatically:

- Tracks conversation messages
- Maintains per-user history
- Cleans up old messages (keeps last 20)
- Logs API interactions (in development mode)

---

## 🌐 Deployment Checklist

- [ ] Google Gemini API key obtained
- [ ] GEMINI_API_KEY added to backend .env
- [ ] Backend updated with chatbot routes
- [ ] Frontend has ChatbotWidget imported
- [ ] VITE_API_URL configured correctly
- [ ] Dependencies installed (`npm install`)
- [ ] Both backend and frontend running
- [ ] Chatbot widget visible on page
- [ ] Test sending a message
- [ ] Test clearing history

---

## 📞 Support Resources

- **Google AI Documentation**: https://ai.google.dev/
- **Gemini API**: https://ai.google.dev/docs/gemini_api_overview
- **Express Documentation**: https://expressjs.com/
- **React Documentation**: https://react.dev/

---

## ✨ What's Next?

1. **Advanced Features**:

   - Add database storage for chat history
   - Implement conversation export
   - Add sentiment analysis
   - Create admin dashboard for analytics

2. **Improvements**:

   - Custom system prompts per hostel
   - Integration with hostel database
   - File upload support
   - Multi-language support

3. **Integration**:
   - Connect to room booking system
   - Link to payment processing
   - Integrate with complaint system
   - Connect to visitor management

---

**Happy Chatting! 🤖💬**
