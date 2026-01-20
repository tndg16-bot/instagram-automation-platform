# InstaFlow AI - Instagram Automation Platform

Instagram automation SaaS platform for business growth acceleration

## Project Structure

```
instagram-automation-platform/
- frontend/       # Frontend (Next.js + TypeScript)
- backend/        # Backend (Node.js/Python)
- infrastructure/   # Infrastructure (Terraform, Docker)
- analytics/       # Analytics (Dashboard, Reports)
- docs/           # Documentation
```

## Team Roles

| Agent | Role | Terminal |
|-----------|--------|----------|
| AI Agent 1 | Frontend Development | Terminal 1 |
| AI Agent 2 | Backend Development | Terminal 2 |
| AI Agent 3 | Infrastructure & DevOps | Terminal 3 |
| GLM-4.7 | Analytics & Testing | - |
| Self | Project Management & Coordination | - |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- Git 2.30+

### Initial Setup

\`\`\`bash
# 1. Clone repository
git clone <repository-url>
cd instagram-automation-platform

# 2. Set environment variables
cp .env.example .env
# Edit .env to add necessary configurations

# 3. Start frontend (Terminal 1)
cd frontend
npm install
npm run dev

# 4. Start backend (Terminal 2)
cd backend
npm install
npm run dev

# 5. Start infrastructure (Terminal 3)
docker-compose up -d
\`\`\`

## Issue Management

### Branch Strategy
- \`feature/frontend-*\`: Frontend features
- \`feature/backend-*\`: Backend features
- \`feature/infra-*\`: Infrastructure changes
- \`feature/analytics-*\`: Analytics features

### Issue Tags
- \`frontend\`: Frontend related
- \`backend\`: Backend related
- \`infrastructure\`: Infrastructure related
- \`analytics\`: Analytics related
- \`Phase 1\`-\`Phase 5\`: Phase classification

## Documentation

- [Business Plan](./business-plan.md)
- [Requirements Definition](./requirements-definition.md)
- [Development Phases](./development-phases.md)

## CI/CD

- GitHub Actions for automated testing and deployment
- Branch protection rules configured

## Communication

Daily progress sync at 18:00 JST.

---

License: MIT
