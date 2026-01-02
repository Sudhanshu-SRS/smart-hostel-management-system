# Google Gemini Chatbot Implementation Guide

## Step 1: Install Required Packages

### Backend

```bash
cd backend
npm install @google/generative-ai
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Step 2: Set Up Google Gemini API Key

1. **Get API Key from Google**:

   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Add to Environment Variables**:
   - Create or update `.env` file in the `backend` folder
   - Add the following:

```env
GEMINI_API_KEY=your_api_key_here
```

3. **Set up Frontend Environment**:
   - Ensure your frontend has the API URL configured in `.env` or `.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

## Step 3: Backend Setup

### 1. Gemini Service (`backend/services/geminiService.js`)

- Handles all Gemini API interactions
- Manages conversation history per user
- Includes hostel-specific system prompt
- Automatic history cleanup to prevent memory issues

### 2. Chatbot Routes (`backend/routes/chatbotR.js`)

Available endpoints:

- `POST /api/chatbot/message` - Send a message and get AI response
- `GET /api/chatbot/history` - Retrieve conversation history
- `DELETE /api/chatbot/history` - Clear conversation history

### 3. Server Configuration (`backend/server.js`)

- Already updated to include chatbot routes
- Routes are protected with `authMiddleware`

## Step 4: Frontend Setup

### 1. Chatbot Component (`frontend/src/components/Chatbot/ChatbotWidget.jsx`)

Features:

- Floating chat widget (bottom-right corner)
- Real-time messaging
- Message history
- Clear history button
- Loading state with typing animation
- Error handling
- Responsive design

### 2. Styling (`frontend/src/components/Chatbot/ChatbotWidget.css`)

- Modern gradient design
- Smooth animations
- Mobile responsive
- Custom scrollbar styling

### 3. Integrate in App

Add the chatbot component to your frontend `App.jsx`:

```jsx
import ChatbotWidget from "./components/Chatbot/ChatbotWidget";

// Inside your main layout or app component, add:
<ChatbotWidget />;
```

## Step 5: Usage

### For Users:

1. Click the floating chatbot button (bottom-right)
2. Type your question about the hostel
3. Get instant AI-powered responses

### Example Questions:

- "What are the hostel rules?"
- "How do I register a complaint?"
- "Tell me about room availability"
- "How do I submit a visitor request?"
- "What are the payment procedures?"

## Step 6: Running the Application

### Terminal 1 - Backend:

```bash
cd backend
npm install @google/generative-ai
npm run dev
```

### Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

## API Endpoints

### POST /api/chatbot/message

Send a message to the chatbot

**Request:**

```json
{
  "message": "What are the hostel rules?"
}
```

**Response:**

```json
{
  "success": true,
  "message": "What are the hostel rules?",
  "response": "The hostel follows these rules...",
  "timestamp": "2024-01-02T10:30:00.000Z"
}
```

### GET /api/chatbot/history

Get conversation history (requires authentication)

**Response:**

```json
{
  "success": true,
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Hi" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Hello! How can I help?" }]
    }
  ]
}
```

### DELETE /api/chatbot/history

Clear conversation history (requires authentication)

**Response:**

```json
{
  "success": true,
  "message": "Conversation history cleared"
}
```

## Features Implemented

✅ **Multi-turn Conversations** - Maintains context across messages
✅ **User-specific History** - Each user has isolated conversation history
✅ **Hostel-specific Responses** - Trained with hostel management context
✅ **Real-time Updates** - Instant responses from Gemini API
✅ **Error Handling** - Graceful error messages
✅ **Session Management** - Automatic history cleanup
✅ **Authentication** - Protected routes with JWT
✅ **Responsive Design** - Works on mobile and desktop
✅ **Message Timestamps** - Track conversation timeline
✅ **Loading States** - Visual feedback during API calls

## Customization Options

### 1. Modify System Prompt

Edit the `HOSTEL_SYSTEM_PROMPT` in `backend/services/geminiService.js` to add more hostel-specific information.

### 2. Change UI Theme

Update the gradient colors in `frontend/src/components/Chatbot/ChatbotWidget.css`:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 3. Adjust History Limit

Modify the conversation history limit in `geminiService.js`:

```javascript
if (history.length > 40) {
  // Keep only last 20 messages
  history.splice(0, 20);
}
```

## Troubleshooting

### Issue: "GEMINI_API_KEY is not configured"

**Solution:** Make sure you've added the API key to `.env` file in backend folder

### Issue: Chatbot not appearing

**Solution:**

1. Make sure `<ChatbotWidget />` is imported and added to your App.jsx
2. Check browser console for errors
3. Verify authentication token is valid

### Issue: "Error communicating with chatbot"

**Solution:**

1. Check if backend is running
2. Verify GEMINI_API_KEY is valid
3. Check browser console for detailed error message
4. Ensure API quota is not exceeded

### Issue: Slow responses

**Solution:**

1. Google Gemini API calls take 1-3 seconds typically
2. Ensure internet connection is stable
3. Check Google API quota and rate limits

## Security Considerations

1. **API Key Protection**: Never expose GEMINI_API_KEY in client-side code
2. **Authentication**: All endpoints require valid JWT token
3. **Input Validation**: All user messages are validated on backend
4. **Rate Limiting**: Express rate limiting is applied to prevent abuse
5. **History Cleanup**: Conversations are auto-cleaned to save memory

## Next Steps

1. ✅ Install packages
2. ✅ Get Google Gemini API key
3. ✅ Set up environment variables
4. ✅ Update backend server.js
5. ✅ Add chatbot component to frontend
6. ✅ Test the chatbot
7. ✅ Deploy to production

## Support

For issues or questions:

1. Check Google AI Studio documentation: https://ai.google.dev/
2. Review Gemini API documentation: https://ai.google.dev/docs/gemini_api_overview
3. Check browser console for detailed error messages
