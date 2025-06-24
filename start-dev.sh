#!/bin/bash

echo "🎵 Starting YouTube DJ Development Environment..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting development servers..."
echo ""

# Start Socket.IO server in background
echo "🔌 Starting Socket.IO server on port 3001..."
npm run dev:socket &
SOCKET_PID=$!

# Wait a moment for socket server to start
sleep 2

# Start Next.js development server
echo "🌐 Starting Next.js server on port 3000..."
npm run dev &
NEXT_PID=$!

echo ""
echo "✨ Servers are starting up..."
echo "   - Web App: http://localhost:3000"
echo "   - Socket Server: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SOCKET_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
