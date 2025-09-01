#!/bin/bash

# Build script for THETA EuroCon NFT Registration
# This script builds both the backend and frontend for production

echo "🏗️  Building THETA EuroCon NFT Registration for Production"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Build backend
echo "🔨 Building backend..."
cd packages/backend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ../..

# Build frontend
echo "🔨 Building frontend..."
cd packages/frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ../..

echo ""
echo "✅ Build completed successfully!"
echo "   Backend build: packages/backend/dist/"
echo "   Frontend build: packages/frontend/.next/"
echo ""
echo "To start production servers, run: npm run start"
