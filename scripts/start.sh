#!/bin/bash

# Start script for THETA EuroCon NFT Registration
# This script starts both the backend and frontend in production mode

echo "🚀 Starting THETA EuroCon NFT Registration Production Servers"

# Check if builds exist
if [ ! -d "packages/backend/dist" ]; then
    echo "❌ Backend build not found. Please run build first: ./scripts/build.sh"
    exit 1
fi

if [ ! -d "packages/frontend/.next" ]; then
    echo "❌ Frontend build not found. Please run build first: ./scripts/build.sh"
    exit 1
fi

echo "✅ Builds found, starting production servers..."

# Start backend
echo "🔧 Starting backend server..."
cd packages/backend
npm start &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
cd packages/frontend
npm start &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Production servers started!"
echo "   Backend:  http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo "   Health:   http://localhost:4000/healthz"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
