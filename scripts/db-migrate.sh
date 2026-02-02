#!/bin/bash

# InstaFlow AI - Database Migration Script
# Runs database migrations

set -e

echo "🗄️  InstaFlow AI - Database Migration"
echo "======================================"

# Check if running in backend directory
if [ ! -f "package.json" ] || ! grep -q "instagram-automation-backend" package.json 2>/dev/null; then
    echo "📂 Changing to backend directory..."
    cd backend
fi

echo ""
echo "Running migrations..."
npm run migrate

echo ""
echo "======================================"
echo "✅ Database migration complete!"
