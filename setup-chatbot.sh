#!/bin/bash

echo "================================================"
echo "Hostel Management System - Chatbot Setup"
echo "================================================"
echo ""

# Check if backend exists
if [ ! -d "backend" ]; then
    echo "❌ Backend folder not found!"
    exit 1
fi

# Check if frontend exists
if [ ! -d "frontend" ]; then
    echo "❌ Frontend folder not found!"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend

if npm list @google/generative-ai > /dev/null 2>&1; then
    echo "✅ @google/generative-ai is already installed"
else
    echo "Installing @google/generative-ai..."
    npm install @google/generative-ai
fi

if npm install; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend

if npm install; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Get your Google Gemini API key from:"
echo "   https://makersuite.google.com/app/apikey"
echo ""
echo "2. Create a .env file in the backend folder"
echo "   and add: GEMINI_API_KEY=your_key_here"
echo ""
echo "3. You can use backend/.env.example as template"
echo ""
echo "4. Start the backend: cd backend && npm run dev"
echo "5. Start the frontend: cd frontend && npm run dev"
echo ""
echo "For detailed instructions, see CHATBOT_SETUP.md"
echo "================================================"
