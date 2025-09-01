#!/bin/bash

# Development script for THETA EuroCon NFT Registration
# This script starts both the backend and frontend in development mode

echo "🚀 Starting THETA EuroCon NFT Registration Development Environment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Install backend dependencies
if [ ! -d "packages/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd packages/backend
    npm install
    cd ../..
fi

# Install frontend dependencies
if [ ! -d "packages/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd packages/frontend
    npm install
    cd ../..
fi

# Check if environment files exist
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please copy .env.example and configure it."
    echo "   cp .env.example .env"
fi

if [ ! -f "packages/backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Please copy env.example and configure it."
    echo "   cp packages/backend/env.example packages/backend/.env"
fi

if [ ! -f "packages/frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local file not found. Please copy env.local.example and configure it."
    echo "   cp packages/frontend/env.local.example packages/frontend/.env.local"
fi

echo ""
echo "🌐 Starting development servers..."
echo "   Backend:  http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo "   Health:   http://localhost:4000/healthz"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers using npm workspaces
npm run dev
