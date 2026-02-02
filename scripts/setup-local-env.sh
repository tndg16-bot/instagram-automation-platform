#!/bin/bash

# InstaFlow AI - Local Development Setup Script
# This script sets up the local development environment

set -e

echo "🚀 InstaFlow AI - Local Development Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Check if .env files exist
echo ""
echo "🔧 Checking environment files..."

if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from template...${NC}"
    cat > backend/.env << 'ENVFILE'
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=instaflow
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Instagram API
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

# OpenAI (Optional - Mock mode works without this)
OPENAI_API_KEY=sk-your-api-key

# Server
PORT=8000
NODE_ENV=development
MOCK_MODE=true
ENVFILE
    echo -e "${GREEN}✅ Created backend/.env${NC}"
else
    echo -e "${GREEN}✅ backend/.env exists${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local not found. Creating from template...${NC}"
    cat > frontend/.env.local << 'ENVFILE'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_INSTAGRAM_APP_ID=your-app-id
ENVFILE
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
else
    echo -e "${GREEN}✅ frontend/.env.local exists${NC}"
fi

# Run database migrations (if in mock mode, this is optional)
echo ""
echo "🗄️  Database Setup"
echo "Note: Make sure PostgreSQL is running locally or use MOCK_MODE=true"

# TypeScript compilation check
echo ""
echo "🔍 Running TypeScript compilation check..."
cd backend
npx tsc --noEmit && echo -e "${GREEN}✅ Backend TypeScript compilation successful${NC}" || echo -e "${YELLOW}⚠️  Backend TypeScript compilation failed (check errors above)${NC}"
cd ..

cd frontend
npx tsc --noEmit && echo -e "${GREEN}✅ Frontend TypeScript compilation successful${NC}" || echo -e "${YELLOW}⚠️  Frontend TypeScript compilation failed (check errors above)${NC}"
cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update the environment variables in:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Start the development servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation:"
echo "   - API Docs: http://localhost:8000/api-docs (after starting backend)"
echo "   - Project Handover: PROJECT_HANDOVER.md"
echo ""
