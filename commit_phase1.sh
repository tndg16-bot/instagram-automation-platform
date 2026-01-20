#!/bin/bash
git status
git add -A
git commit -m "feat(phase1): implement core authentication and basic dashboard

Backend:
- Add JWT authentication utilities
- Implement user registration and login endpoints
- Create refresh token management
- Implement Instagram OAuth integration
- Add Instagram Graph API client
- Add Instagram accounts service
- Add Instagram accounts API endpoints
- Create database schema for users and Instagram accounts

Frontend:
- Build login page
- Build registration page
- Create dashboard with user profile
- Implement connected Instagram accounts overview
- Add basic statistics display
- Create Instagram OAuth callback handler
- Add authentication redirects

Configuration:
- Add backend environment configuration
- Add frontend environment configuration
- Fix TypeScript errors (@types/pg)

All Phase 1 core features implemented and ready for testing"
