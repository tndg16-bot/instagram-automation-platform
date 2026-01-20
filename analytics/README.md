# Analytics Dashboard

Analytics and reporting module for Instagram Automation Platform.

## Overview

This module provides:
- Real-time analytics dashboard
- User engagement metrics
- Campaign performance reports
- Growth analytics
- ROI tracking

## Setup

```bash
cd analytics
npm install
npm run dev
```

## API Endpoints

- `GET /api/analytics/overview` - Overview metrics
- `GET /api/analytics/growth` - Growth analytics
- `GET /api/analytics/campaigns/:id` - Campaign performance
- `GET /api/analytics/export` - Export reports

## Database Schema

- `analytics_events` - Raw event data
- `campaign_metrics` - Campaign performance
- `user_analytics` - User behavior data
- `daily_aggregates` - Pre-computed daily metrics

## Development

Start development server:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

## Tech Stack

- Node.js + Express
- PostgreSQL (data storage)
- Redis (caching)
- Jest (testing)
