#!/bin/bash

echo "🌍 Starting Universal Translator..."

# Start backend
echo "📡 Starting Backend Server..."
cd server && npm start &
SERVER_PID=$!

# Start frontend
echo "🎨 Starting Frontend Client..."
cd ../client && npm run dev &
CLIENT_PID=$!

# Handle cleanup
trap "echo 'Shutting down...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null" EXIT INT TERM

echo "✅ Application is running!"
echo "📱 Open http://localhost:5173 in your browser"
echo "🛑 Press Ctrl+C to stop"

wait

