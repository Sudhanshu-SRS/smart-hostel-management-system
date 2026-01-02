# Chatbot Testing Guide

## Pre-Testing Checklist

- [ ] Google Gemini API key obtained
- [ ] Backend `.env` file created with `GEMINI_API_KEY`
- [ ] `npm install @google/generative-ai` completed in backend
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000/5173
- [ ] User is logged in

---

## Step-by-Step Testing

### ✅ Test 1: Backend API Key Setup

**What to Test**: Verify the API key is configured correctly

**Steps**:

1. Open `backend/.env`
2. Check that `GEMINI_API_KEY=xxxx` exists
3. Make sure there are no spaces: `GEMINI_API_KEY = xxxx` ❌ (wrong)
4. Correct format: `GEMINI_API_KEY=xxxx` ✅

**Expected Result**: No errors in backend console

---

### ✅ Test 2: Backend Service Loads

**What to Test**: Verify the Gemini service initializes

**Steps**:

1. Look at backend console
2. Check for any errors related to "GeminiService"

**Expected Result**:

```
✅ No errors about Gemini or API key
```

---

### ✅ Test 3: Frontend Component Renders

**What to Test**: Verify the chatbot widget appears on page

**Steps**:

1. Open your frontend in browser
2. Scroll to bottom-right corner
3. Look for the chatbot button (purple gradient circle)

**Expected Result**:

```
✅ Floating chat button visible
✅ Button has an icon inside
✅ Button is clickable
```

---

### ✅ Test 4: Open Chat Widget

**What to Test**: Verify the chat window opens

**Steps**:

1. Click the floating chatbot button
2. Observe the chat window

**Expected Result**:

```
✅ Chat window slides up smoothly
✅ "Hostel Assistant" header visible
✅ Initial message shows
✅ Input field is visible
✅ Send button is visible
```

---

### ✅ Test 5: Send First Message

**What to Test**: Verify message sending works

**Steps**:

1. Type "Hi" in the message input
2. Click Send button or press Enter
3. Observe the response

**Expected Result**:

```
✅ Message appears in chat (right side, purple)
✅ Typing indicator shows (3 dots)
✅ Response appears within 2-5 seconds
✅ Response comes from bot (left side, white)
✅ Timestamp shows on message
```

---

### ✅ Test 6: Multi-turn Conversation

**What to Test**: Verify conversation context is maintained

**Steps**:

1. Send: "What can you help me with?"
2. Send: "Tell me about rooms"
3. Send: "How do I request a room change?"

**Expected Result**:

```
✅ Bot remembers previous messages
✅ Responses are contextual
✅ No authentication errors
✅ All messages show timestamps
```

---

### ✅ Test 7: Clear History

**What to Test**: Verify history clearing works

**Steps**:

1. Send a few messages
2. Click the trash icon (🗑️) in header
3. Confirm the dialog
4. Observe the chat

**Expected Result**:

```
✅ Confirmation dialog appears
✅ After confirmation, chat resets
✅ Only initial greeting message remains
✅ New messages work normally
```

---

### ✅ Test 8: Close and Reopen

**What to Test**: Verify widget state management

**Steps**:

1. Click the ✕ button to close chat
2. Verify button appears again
3. Click button to reopen
4. Send a new message

**Expected Result**:

```
✅ Chat window closes smoothly
✅ Button reappears in bottom-right
✅ Chat can be reopened
✅ Conversation history persists
```

---

### ✅ Test 9: Error Handling

**What to Test**: Verify graceful error handling

**Steps**:

1. Send a normal message first
2. Stop the backend server
3. Try to send another message
4. Observe error handling

**Expected Result**:

```
✅ Error message appears in chat (red background)
✅ Error is user-friendly
✅ User can still type messages
✅ Application doesn't crash
```

---

### ✅ Test 10: Mobile Responsiveness

**What to Test**: Verify mobile UI works

**Steps**:

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or mobile device
4. Test clicking and typing

**Expected Result**:

```
✅ Chat window fits on mobile screen
✅ Input field is accessible
✅ Send button is clickable
✅ Messages scroll properly
✅ No UI overflow
```

---

## Browser Console Testing

### Check for Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red errors

**Expected**:

- No errors about "ChatbotWidget"
- No CORS errors
- No authentication errors

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Send a chatbot message
4. Look for POST request to `/api/chatbot/message`

**Expected**:

- Request shows status: 200 (Success)
- Response has: `{"success": true, "response": "..."}`

---

## Common Test Failures & Fixes

### ❌ "Chatbot button not visible"

**Solutions**:

1. Check if ChatbotWidget is imported in App.jsx
2. Check if component is added inside JSX
3. Check if CSS file is imported correctly
4. Verify z-index isn't hidden by other elements

### ❌ "Button visible but won't open"

**Solutions**:

1. Check browser console for errors
2. Verify onClick handler is working
3. Check if React state is updating
4. Try clearing browser cache (Ctrl+Shift+Delete)

### ❌ "Error: API Key not configured"

**Solutions**:

1. Add GEMINI_API_KEY to backend/.env
2. Restart backend server
3. Ensure no typos in .env key name
4. Check that .env is in correct folder (backend root)

### ❌ "401 Authentication Error"

**Solutions**:

1. Make sure user is logged in
2. Check if token is valid
3. Verify JWT_SECRET is same in .env
4. Try logging out and logging back in

### ❌ "Cannot read property 'response' of undefined"

**Solutions**:

1. Verify backend is running
2. Check if API key is valid
3. Look at backend console for errors
4. Verify VITE_API_URL is correct in frontend

---

## Performance Testing

### Message Response Time

**Test**: How fast does the bot respond?

**Expected**:

- 2-5 seconds for normal responses
- Up to 10 seconds for complex responses

**Why**: Gemini API processing takes time + network latency

### Conversation Memory

**Test**: How many messages can be stored?

**Expected**:

- Last 20 user-bot pairs maintained
- Older messages automatically removed
- No memory leaks

---

## Load Testing (Optional)

### Test with Multiple Users

```javascript
// Open multiple browser tabs/windows
// Each logged in as different user
// Send messages simultaneously
```

**Expected**:

- Each user has separate conversation
- No cross-user data leakage
- Backend handles multiple requests

---

## Final Verification Checklist

- [ ] Test 1: API Key setup ✓
- [ ] Test 2: Service loads ✓
- [ ] Test 3: Widget renders ✓
- [ ] Test 4: Chat opens ✓
- [ ] Test 5: Message sends ✓
- [ ] Test 6: Conversation context works ✓
- [ ] Test 7: History clears ✓
- [ ] Test 8: Close/reopen works ✓
- [ ] Test 9: Error handling works ✓
- [ ] Test 10: Mobile responsive ✓
- [ ] No console errors ✓
- [ ] Network requests successful ✓

**If all ✓, your chatbot is fully functional! 🎉**

---

## Reporting Issues

If something doesn't work:

1. **Check console errors** (F12 → Console)
2. **Check network tab** (F12 → Network)
3. **Verify environment setup** (check .env)
4. **Restart backend** (Ctrl+C and run again)
5. **Clear cache** (Ctrl+Shift+Delete)
6. **Try incognito mode** (Ctrl+Shift+N)

---

## Support Requests

When asking for help, provide:

1. Screenshot of the issue
2. Browser console errors (if any)
3. Network tab details
4. Backend console output
5. Your .env configuration (mask API key)

---

**Happy Testing! ✨**
