#!/bin/bash

# InstaFlow AI - Test Runner Script
# Runs all tests with coverage reports

set -e

echo "🧪 InstaFlow AI - Running All Tests"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test backend
echo ""
echo "📦 Testing Backend..."
cd backend
npm run test:coverage
BACKEND_EXIT=$?
cd ..

# Test frontend
echo ""
echo "📦 Testing Frontend..."
cd frontend
npm test -- --coverage --passWithNoTests
FRONTEND_EXIT=$?
cd ..

# Summary
echo ""
echo "===================================="
if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    [ $BACKEND_EXIT -ne 0 ] && echo -e "${RED}   - Backend tests failed${NC}"
    [ $FRONTEND_EXIT -ne 0 ] && echo -e "${RED}   - Frontend tests failed${NC}"
    exit 1
fi
