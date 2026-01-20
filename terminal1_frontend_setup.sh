#!/bin/bash
# =============================================================================
# Terminal 1: Frontend Development Environment Setup
# AI Agent 1 (Frontend担当)
# =============================================================================

set -e
set -u

echo "Starting Terminal 1: Frontend Development Environment Setup"
echo "============================================================"

# Configuration
PROJECT_DIR="C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram"
FRONTEND_DIR="$PROJECT_DIR/frontend"
REPO_URL="git@github.com:your-org/instagram-automation-platform.git"
AGENT_NAME="AI Agent 1 (Frontend)"

# Color settings
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# Step 1: Verify/Create project directory
# =============================================================================
echo -e "\n${BLUE}[Step 1/10]${NC} Project directory configuration"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Project directory does not exist${NC}"
    echo "Create it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        mkdir -p "$PROJECT_DIR"
        echo -e "${GREEN}Directory created${NC}"
    else
        echo "Aborting setup"
        exit 1
    fi
else
    echo -e "${GREEN}Project directory exists${NC}"
fi

cd "$PROJECT_DIR"

# =============================================================================
# Step 2: Initialize GitHub repository (if not exists)
# =============================================================================
echo -e "\n${BLUE}[Step 2/10]${NC} GitHub repository configuration"

if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git remote add origin "$REPO_URL"

    echo -e "${GREEN}Git repository initialized${NC}"
    echo -e "${YELLOW}Remote URL is dummy${NC}"
    echo "   Update with actual URL: git remote set-url origin <actual-url>"
else
    echo -e "${GREEN}Git repository exists${NC}"
fi

# =============================================================================
# Step 3: Create frontend directory
# =============================================================================
echo -e "\n${BLUE}[Step 3/10]${NC} Frontend structure setup"

if [ ! -d "$FRONTEND_DIR" ]; then
    mkdir -p "$FRONTEND_DIR"

    echo "Creating Next.js + TypeScript project..."
    cd "$FRONTEND_DIR"

    # Create Next.js project (non-interactive)
    npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

    echo -e "${GREEN}Next.js project created${NC}"

    # Install additional packages
    npm install --silent axios react-hook-form @tanstack/react-query zustand zustand-devtools

    echo -e "${GREEN}Additional packages installed${NC}"

    cd "$PROJECT_DIR"
else
    echo -e "${GREEN}Frontend directory exists${NC}"
fi

# =============================================================================
# Step 4: Create directory structure
# =============================================================================
echo -e "\n${BLUE}[Step 4/10]${NC} Directory structure creation"

# Common directories
mkdir -p "$PROJECT_DIR"/{backend,infrastructure,analytics,docs/{api,architecture,user-guide}}

echo -e "${GREEN}Common directory structure created${NC}"

# =============================================================================
# Step 5: Create GitHub workflow configuration
# =============================================================================
echo -e "\n${BLUE}[Step 5/10]${NC} GitHub workflow configuration"

mkdir -p "$PROJECT_DIR/.github/workflows"

# Labeler configuration
cat > "$PROJECT_DIR/.github/labeler.yml" << 'EOF'
frontend:
  - changed-files:
      - frontend/**/*
      - "frontend/**/*"

backend:
  - changed-files:
      - backend/**/*
      - "backend/**/*"

infrastructure:
  - changed-files:
      - infrastructure/**/*
      - "infrastructure/**/*"

analytics:
  - changed-files:
      - analytics/**/*
      - "analytics/**/*"
EOF

echo -e "${GREEN}GitHub labeler configuration created${NC}"

# =============================================================================
# Step 6: Create PR template
# =============================================================================
echo -e "\n${BLUE}[Step 6/10]${NC} PR template creation"

mkdir -p "$PROJECT_DIR/.github"

cat > "$PROJECT_DIR/.github/PULL_REQUEST_TEMPLATE.md" << 'EOF'
## Pull Request Overview

**Agent**: [AI Agent 1 / AI Agent 2 / AI Agent 3 / GLM-4.7 / Self]
**Related Issue**: #number
**Type**: [feature / bug / refactor / docs]
**Phase**: [Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5]

## Changes Description
<!-- Brief description of changes -->

## Main Changes
- [ ] Frontend changes
- [ ] Backend changes
- [ ] Infrastructure changes
- [ ] Analytics changes
- [ ] Documentation changes

## Test Status
- [ ] Unit tests: Pass/Fail (success rate: __%)
- [ ] Integration tests: Pass/Fail
- [ ] E2E tests: Pass/Fail

## Review Checklist
- [ ] Feature spec compliant
- [ ] Code quality (Lint, types)
- [ ] Performance
- [ ] Security
- [ ] Accessibility

## Related Issues
Closes #number

## Screenshots
<!-- Add screenshots if UI changes -->
EOF

echo -e "${GREEN}PR template created${NC}"

# =============================================================================
# Step 7: Create ISSUE templates
# =============================================================================
echo -e "\n${BLUE}[Step 7/10]${NC} Issue template creation"

mkdir -p "$PROJECT_DIR/.github/ISSUE_TEMPLATE"

cat > "$PROJECT_DIR/.github/ISSUE_TEMPLATE/frontend_issue.md" << 'EOF'
---
name: Frontend Related Issue
about: Frontend feature or bug fix
title: "[Frontend] "
labels: ["frontend"]
assignees: ["agent-1"]

---

## Description
<!-- Brief description -->

## Tasks
- [ ] Implement
- [ ] Test
- [ ] Documentation update

## Related Files
<!-- List of changed files -->

## Reproduction Steps
1.
2.
3.

## Expected Behavior

## Actual Behavior

## Environment
- OS:
- Browser:
EOF

cat > "$PROJECT_DIR/.github/ISSUE_TEMPLATE/backend_issue.md" << 'EOF'
---
name: Backend Related Issue
about: Backend feature or bug fix
title: "[Backend] "
labels: ["backend"]
assignees: ["agent-2"]

---

## Description
<!-- Brief description -->

## Tasks
- [ ] Implement
- [ ] Test
- [ ] Documentation update

## API Endpoints
<!-- Changed or added API endpoints -->

## Related Models
<!-- Related data models -->

## Reproduction Steps
1.
2.
3.

## Expected Behavior

## Actual Behavior
## Logs
<!-- Add error logs if any -->

## Environment
- Node.js:
- Database:
EOF

cat > "$PROJECT_DIR/.github/ISSUE_TEMPLATE/infrastructure_issue.md" << 'EOF'
---
name: Infrastructure Related Issue
about: Infrastructure or DevOps configuration or troubleshooting
title: "[Infra] "
labels: ["infrastructure"]
assignees: ["agent-3"]

---

## Description
<!-- Brief description -->

## Tasks
- [ ] Implement
- [ ] Test
- [ ] Documentation update

## Affected Components
<!-- Affected infrastructure components -->

## Reproduction Steps
1.
2.
3.

## Expected Behavior

## Actual Behavior
## Logs
<!-- Add error logs if any -->

## Environment
- Cloud Provider:
- Service:
EOF

echo -e "${GREEN}Issue templates created${NC}"

# =============================================================================
# Step 8: Create environment variables file
# =============================================================================
echo -e "\n${BLUE}[Step 8/10]${NC} Environment variables configuration"

cat > "$PROJECT_DIR/.env.example" << 'EOF'
# Application settings
APP_NAME=InstaFlow AI
APP_ENV=development
APP_PORT=3000

# API settings
API_BASE_URL=http://localhost:8000
API_TIMEOUT=30000

# Instagram Graph API
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/callback

# AI API
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/instaflow
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_here_change_in_production
SESSION_SECRET=your_session_secret_here_change_in_production
EOF

echo -e "${GREEN}Environment variables file created${NC}"

# =============================================================================
# Step 9: Create README
# =============================================================================
echo -e "\n${BLUE}[Step 9/10]${NC} README creation"

cat > "$PROJECT_DIR/README.md" << 'EOF'
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
EOF

echo -e "${GREEN}README created${NC}"

# =============================================================================
# Step 10: Create initial commit
# =============================================================================
echo -e "\n${BLUE}[Step 10/10]${NC} Initial commit creation"

# .gitignore
cat > "$PROJECT_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.pyc

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
.next/
out/

# Tests
coverage/

# Docker
.dockerignore
EOF

echo -e "${GREEN}.gitignore created${NC}"

# Initial commit
git add .
git commit -m "chore: initial project setup for multi-AI collaboration

- Set up Next.js frontend structure
- Create GitHub workflow templates (PR, Issue, Labeler)
- Add environment configuration
- Initialize project documentation

Agents setup:
- AI Agent 1: Frontend (Terminal 1)
- AI Agent 2: Backend (Terminal 2) - To be initialized
- AI Agent 3: Infrastructure (Terminal 3) - To be initialized
- GLM-4.7: Analytics - To be initialized
"

echo -e "${GREEN}Initial commit created${NC}"

# =============================================================================
# Setup Complete
# =============================================================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Terminal 1: Frontend Environment Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Run backend setup (Terminal 2: bash backend_setup.sh)"
echo "2. Run infrastructure setup (Terminal 3: bash infra_setup.sh)"
echo "3. Run analytics setup (GLM-4.7: bash analytics_setup.sh)"
echo "4. Create GitHub repository and set remote URL"
echo "5. Start development!"

echo -e "\n${YELLOW}Notes:${NC}"
echo "- Create actual GitHub repository"
echo "- Set remote URL: git remote set-url origin <your-repo-url>"
echo "- Edit .env file to add necessary API keys"
echo "- Start development in other terminals"

echo -e "\n${BLUE}Ready to code!${NC}"
