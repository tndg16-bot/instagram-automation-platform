#!/bin/bash
# =============================================================================
# Terminal 2: Backend Development Environment Setup
# AI Agent 2 (Backend担当)
# =============================================================================

set -e
set -u

echo "Starting Terminal 2: Backend Development Environment Setup"
echo "============================================================"

# Configuration
PROJECT_DIR="C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram"
BACKEND_DIR="$PROJECT_DIR/backend"
AGENT_NAME="AI Agent 2 (Backend)"

# Color settings
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# Step 1: Verify/Create project directory
# =============================================================================
echo -e "\n${BLUE}[Step 1/10]${NC} Project directory verification"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${GREEN}Project directory exists${NC}"
else
    echo -e "${YELLOW}Project directory does not exist${NC}"
    echo "Run Terminal 1 (frontend_setup.sh) first"
    exit 1
fi

cd "$PROJECT_DIR"

# =============================================================================
# Step 2: Create backend directory
# =============================================================================
echo -e "\n${BLUE}[Step 2/10]${NC} Backend structure setup"

if [ ! -d "$BACKEND_DIR" ]; then
    mkdir -p "$BACKEND_DIR"

    echo "Creating Node.js + Express backend project..."
    cd "$BACKEND_DIR"

    # Initialize Node.js project
    npm init -y

    # Install required packages
    echo "Installing packages..."
    npm install --silent \
        express \
        cors \
        dotenv \
        axios \
        node-cron \
        winston \
        bcrypt \
        jsonwebtoken \
        helmet \
        express-rate-limit \
        express-validator

    # Install dev dependencies
    npm install --silent -D \
        @types/express \
        @types/node \
        @types/cors \
        @types/bcrypt \
        @types/jsonwebtoken \
        typescript \
        ts-node \
        nodemon \
        jest \
        @types/jest \
        ts-jest \
        supertest \
        eslint \
        @typescript-eslint/parser \
        @typescript-eslint/eslint-plugin

    echo -e "${GREEN}Node.js project created${NC}"
    echo -e "${GREEN}Packages installed${NC}"

    cd "$PROJECT_DIR"
else
    echo -e "${GREEN}Backend directory exists${NC}"
fi

# =============================================================================
# Step 3: Create TypeScript configuration
# =============================================================================
echo -e "\n${BLUE}[Step 3/10]${NC} TypeScript configuration"

cat > "$BACKEND_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

echo -e "${GREEN}TypeScript configuration created${NC}"

# =============================================================================
# Step 4: Create source directory structure
# =============================================================================
echo -e "\n${BLUE}[Step 4/10]${NC} Source directory structure"

cd "$BACKEND_DIR"

mkdir -p src/{api/{routes,controllers,middleware},services,models,config,utils,types} tests/{unit,integration}

# Create base app file
cat > src/app.ts << 'EOF'
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Route imports
import authRoutes from './api/routes/auth';
import dmRoutes from './api/routes/dm';
import commentRoutes from './api/routes/comment';
import workflowRoutes from './api/routes/workflow';

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 8000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/workflows', workflowRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
EOF

# Create server entry
cat > src/server.ts << 'EOF'
import app from './app';
import config from './config';

const PORT = config.app.port || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
EOF

echo -e "${GREEN}Source directory structure created${NC}"

# =============================================================================
# Step 5: Create Instagram Graph API client
# =============================================================================
echo -e "\n${BLUE}[Step 5/10]${NC} Instagram Graph API client"

cat > src/services/instagramClient.ts << 'EOF'
import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config';

interface InstagramConfig {
  accessToken: string;
  baseUrl: string;
}

class InstagramGraphClient {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: config.instagram.graphApiBaseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getComments(mediaId: string) {
    try {
      const response = await this.client.get(`/${config.instagram.apiVersion}/${mediaId}/comments`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getComments');
      throw error;
    }
  }

  async replyToComment(commentId: string, message: string) {
    try {
      await this.client.post(`/${config.instagram.apiVersion}/${commentId}/replies`, {
        message,
      });
    } catch (error) {
      this.handleError(error, 'replyToComment');
      throw error;
    }
  }

  async sendDM(recipientId: string, message: string, mediaUrl?: string) {
    try {
      const payload: any = {
        recipient: { id: recipientId },
        message: { text: message },
      };

      if (mediaUrl) {
        payload.message.attachment = {
          type: 'image',
          payload: { url: mediaUrl },
        };
      }

      await this.client.post(`/${config.instagram.apiVersion}/me/messages`, payload);
    } catch (error) {
      this.handleError(error, 'sendDM');
      throw error;
    }
  }

  async postMedia(imageUrl: string, caption: string) {
    try {
      const response = await this.client.post(`/${config.instagram.apiVersion}/me/media`, {
        image_url: imageUrl,
        caption,
      });
      return response.data.id;
    } catch (error) {
      this.handleError(error, 'postMedia');
      throw error;
    }
  }

  async likeMedia(mediaId: string) {
    try {
      await this.client.post(`/${config.instagram.apiVersion}/${mediaId}/likes`);
    } catch (error) {
      this.handleError(error, 'likeMedia');
      throw error;
    }
  }

  async followUser(userId: string) {
    try {
      await this.client.post(`/${config.instagram.apiVersion}/me/following`, {
        user_id: userId,
      });
    } catch (error) {
      this.handleError(error, 'followUser');
      throw error;
    }
  }

  private handleError(error: any, operation: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        console.error(`Instagram API Error [${operation}]:`, {
          status,
          data,
        });

        if (status === 429) {
          console.error('Rate limit exceeded. Please retry later.');
        }

        if (status === 401) {
          console.error('Authentication failed. Token may be expired.');
        }
      }
    } else {
      console.error(`Unexpected error [${operation}]:`, error);
    }
  }
}

export default InstagramGraphClient;
EOF

echo -e "${GREEN}Instagram Graph API client created${NC}"

# =============================================================================
# Step 6: Create database configuration
# =============================================================================
echo -e "\n${BLUE}[Step 6/10]${NC} Database configuration"

cat > src/config/database.ts << 'EOF'
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'instaflow',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

export default pool;

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
EOF

echo -e "${GREEN}Database configuration created${NC}"

# =============================================================================
# Step 7: Create routes and controllers
# =============================================================================
echo -e "\n${BLUE}[Step 7/10]${NC} Routes and controllers"

# Auth routes
cat > src/api/routes/auth.ts << 'EOF'
import express, { Router, Request, Response } from 'express';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // TODO: Implement auth logic
    // TODO: Issue JWT token

    res.json({
      success: true,
      message: 'Login endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/instagram', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    // TODO: Implement Instagram OAuth flow
    // TODO: Get and store access token

    res.json({
      success: true,
      message: 'Instagram auth endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
EOF

# DM routes
cat > src/api/routes/dm.ts << 'EOF'
import express, { Router, Request, Response } from 'express';

const router = Router();

router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { recipients, message, scheduledAt } = req.body;

    // TODO: Implement broadcast logic
    // TODO: Queue management
    // TODO: Scheduled execution

    res.json({
      success: true,
      message: 'DM broadcast endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    // TODO: Implement campaign history retrieval

    res.json({
      success: true,
      campaigns: [],
      message: 'DM campaigns endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
EOF

# Comment routes
cat > src/api/routes/comment.ts << 'EOF'
import express, { Router, Request, Response } from 'express';

const router = Router();

router.post('/reply', async (req: Request, res: Response) => {
  try {
    const { commentId, replyMessage } = req.body;

    // TODO: Implement comment reply logic
    // TODO: AI response generation

    res.json({
      success: true,
      message: 'Comment reply endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { mediaId } = req.query;

    // TODO: Implement comment retrieval logic

    res.json({
      success: true,
      comments: [],
      message: 'Comments list endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
EOF

# Workflow routes
cat > src/api/routes/workflow.ts << 'EOF'
import express, { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const workflow = req.body;

    // TODO: Implement workflow save logic
    // TODO: Validation

    res.json({
      success: true,
      message: 'Workflow creation endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { triggerData } = req.body;

    // TODO: Implement workflow execution logic
    // TODO: AI step processing

    res.json({
      success: true,
      message: 'Workflow execution endpoint - To be implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
EOF

echo -e "${GREEN}Routes and controllers created${NC}"

# =============================================================================
# Step 8: Create test configuration
# =============================================================================
echo -e "\n${BLUE}[Step 8/10]${NC} Test configuration"

cat > package.json << 'EOF'
{
  "name": "instagram-automation-backend",
  "version": "1.0.0",
  "description": "Backend API for Instagram Automation Platform",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "keywords": ["instagram", "automation", "api"],
  "author": "InstaFlow AI Team",
  "license": "MIT"
}
EOF

cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
EOF

echo -e "${GREEN}Test configuration created${NC}"

# =============================================================================
# Step 9: Create Docker Compose
# =============================================================================
echo -e "\n${BLUE}[Step 9/10]${NC} Docker Compose configuration"

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: instaflow-postgres
    environment:
      POSTGRES_USER: instaflow
      POSTGRES_PASSWORD: instaflow_password
      POSTGRES_DB: instaflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U instaflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: instaflow-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: instaflow-backend
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://instaflow:instaflow_password@postgres:5432/instaflow
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
EOF

cat > "$BACKEND_DIR/Dockerfile" << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "dev"]
EOF

echo -e "${GREEN}Docker Compose configuration created${NC}"

# =============================================================================
# Step 10: Initial commit
# =============================================================================
echo -e "\n${BLUE}[Step 10/10]${NC} Backend initial commit"

cd "$BACKEND_DIR"

git add .
git commit -m "feat(backend): initialize backend API structure

- Set up Express + TypeScript backend
- Create Instagram Graph API client
- Add basic route structure (auth, dm, comment, workflow)
- Configure PostgreSQL database connection
- Set up Docker Compose for local development
- Add Jest testing configuration

AI Agent 2 (Backend) - Setup complete"

echo -e "${GREEN}Backend initial commit created${NC}"

# =============================================================================
# Setup Complete
# =============================================================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Terminal 2: Backend Environment Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Run infrastructure setup (Terminal 3: bash infra_setup.sh)"
echo "2. Run analytics setup (GLM-4.7: bash analytics_setup.sh)"
echo "3. Start databases: docker-compose up -d"
echo "4. Start backend: npm run dev"
echo "5. Check health: http://localhost:8000/health"

echo -e "\n${YELLOW}Notes:${NC}"
echo "- Edit .env file to add Instagram API keys"
echo "- Ensure PostgreSQL and Redis are running"
echo "- Verify frontend can access backend API"

echo -e "\n${BLUE}Ready to code!${NC}"
