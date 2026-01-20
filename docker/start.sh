#!/bin/bash

cd "$(dirname "$0")"

echo "Starting Instagram Automation Platform - Docker Development Environment"
echo "======================================================================"

if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
    exit 1
fi

echo "Starting Docker containers..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "Services started successfully!"
echo ""
echo "Access URLs:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Backend API: http://localhost:8000"
echo ""
echo "Use 'docker-compose logs -f' to view logs"
echo "Use 'docker-compose down' to stop services"
echo "Use 'docker-compose down -v' to stop and remove volumes"
