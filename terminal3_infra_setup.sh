#!/bin/bash
# =============================================================================
# Terminal 3: Infrastructure & DevOps Development Environment Setup
# AI Agent 3 (Infrastructure担当)
# =============================================================================

set -e
set -u

echo "Starting Terminal 3: Infrastructure & DevOps Development Environment Setup"
echo "============================================================"

# Configuration
PROJECT_DIR="C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram"
INFRA_DIR="$PROJECT_DIR/infrastructure"
AGENT_NAME="AI Agent 3 (Infrastructure)"

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
# Step 2: Create infrastructure directory structure
# =============================================================================
echo -e "\n${BLUE}[Step 2/10]${NC} Infrastructure directory structure setup"

mkdir -p "$INFRA_DIR"/{terraform,k8s,docker,scripts,monitoring}

echo -e "${GREEN}Infrastructure directory structure created${NC}"

# =============================================================================
# Step 3: Create Terraform configuration
# =============================================================================
echo -e "\n${BLUE}[Step 3/10]${NC} Terraform configuration creation"

# Terraform configuration
cat > "$INFRA_DIR/terraform/terraform.tf" << 'EOF'
# Terraform configuration - AWS infrastructure
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "instaflow-terraform-state"
    key            = "instagram-automation/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
  }
}

provider "aws" {
  region  = "ap-northeast-1"
  default_tags {
    Project     = "InstaFlow AI"
    Environment = var.environment
    ManagedBy   = "AI Agent 3"
  }
}

# =============================================================================
# Local variables definition
# =============================================================================

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "instaflow.example.com"
}

variable "ssl_certificate_arn" {
  description = "SSL certificate ARN"
  type        = string
  default     = ""
}

# =============================================================================
# VPC creation
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-instaflow-vpc"
  }
}

# =============================================================================
# Subnet networks
# =============================================================================

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.environment}-private-subnet"
  }
}

# =============================================================================
# Security groups
# =============================================================================

resource "aws_security_group" "alb" {
  name        = "${var.environment}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-alb-sg"
  }
}

resource "aws_security_group" "backend" {
  name        = "${var.environment}-backend-sg"
  description = "Security group for backend"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-backend-sg"
  }
}

resource "aws_security_group" "database" {
  name        = "${var.environment}-database-sg"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-database-sg"
  }
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "main" {
  name               = "${var.environment}-instaflow-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = [aws_subnet.public.id]

  enable_deletion_protection = true

  tags = {
    Name = "${var.environment}-instaflow-alb"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.environment}-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-299"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.environment}-backend-tg"
  }
}

# =============================================================================
# ECS cluster
# =============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-instaflow-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.environment}-instaflow-cluster"
  }
}

# =============================================================================
# RDS PostgreSQL
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-instaflow-db-subnet-group"
  subnet_ids = [aws_subnet.private.id]

  tags = {
    Name = "${var.environment}-instaflow-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  allocated_storage      = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.micro"
  db_name             = "instaflow"
  username            = "instaflow_admin"
  password            = var.db_password
  parameter_group_name = "default.postgres15"

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true

  multi_az               = false
  publicly_accessible    = false
  deletion_protection  = true

  tags = {
    Name = "${var.environment}-instaflow-postgres"
  }
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# =============================================================================
# ElastiCache Redis
# =============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-instaflow-cache-subnet-group"
  subnet_ids = [aws_subnet.private.id]

  tags = {
    Name = "${var.environment}-instaflow-cache-subnet-group"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.environment}-instaflow-redis"
  description                 = "Redis cache"
  node_type                   = "cache.t3.micro"
  engine                      = "redis"
  engine_version              = "7.0"
  number_cache_clusters       = 1
  port                        = 6379
  automatic_failover_enabled = true
  multi_az_enabled            = true
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.backend.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled    = true

  tags = {
    Name = "${var.environment}-instaflow-redis"
  }
}

# =============================================================================
# S3 bucket
# =============================================================================

resource "aws_s3_bucket" "media" {
  bucket = "instaflow-${var.environment}-media"
  acl    = "private"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    enabled = true

    noncurrent_version_transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }

  tags = {
    Name = "${var.environment}-media-bucket"
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "backend_url" {
  description = "Backend URL"
  value       = "http://${aws_lb.main.dns_name}"
}
EOF

# Terraform variables file
cat > "$INFRA_DIR/terraform/terraform.tfvars" << 'EOF'
environment   = "development"
aws_region   = "ap-northeast-1"
domain_name  = "instaflow.local"
EOF

echo -e "${GREEN}Terraform configuration created${NC}"

# =============================================================================
# Step 4: Create Kubernetes manifests
# =============================================================================
echo -e "\n${BLUE}[Step 4/10]${NC} Kubernetes manifests creation"

mkdir -p "$INFRA_DIR/k8s"/{backend,database,redis,config}

# Backend Deployment
cat > "$INFRA_DIR/k8s/backend/deployment.yaml" << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: instaflow-backend
  namespace: instaflow
spec:
  replicas: 2
  selector:
    matchLabels:
      app: instaflow-backend
  template:
    metadata:
      labels:
        app: instaflow-backend
    spec:
      containers:
      - name: backend
        image: instaflow/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: NODE_ENV
          value: "development"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
EOF

# Backend Service
cat > "$INFRA_DIR/k8s/backend/service.yaml" << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: instaflow-backend
  namespace: instaflow
spec:
  type: LoadBalancer
  selector:
    app: instaflow-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  sessionAffinity: ClientIP
EOF

# ConfigMap
cat > "$INFRA_DIR/k8s/config/configmap.yaml" << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: instaflow
data:
  url: "redis://redis:6379"
EOF

# Secret
cat > "$INFRA_DIR/k8s/config/secret.yaml" << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
  namespace: instaflow
type: Opaque
stringData:
  url: postgresql://instaflow:change_this_password@postgres:5432/instaflow
EOF

echo -e "${GREEN}Kubernetes manifests created${NC}"

# =============================================================================
# Step 5: Create Docker Compose monitoring
# =============================================================================
echo -e "\n${BLUE}[Step 5/10]${NC} Docker Compose monitoring configuration"

cat > "$INFRA_DIR/docker/docker-compose.monitoring.yml" << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: instaflow-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: instaflow-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - monitoring

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: instaflow-jaeger
    ports:
      - "5775:5775"
      - "16686:16686"
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=9411
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
EOF

# Prometheus configuration
mkdir -p "$INFRA_DIR/docker/prometheus"

cat > "$INFRA_DIR/docker/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'instaflow'
    static_configs:
      - targets: ['backend:8000', 'frontend:3000']
    metrics_path: '/metrics'
EOF

echo -e "${GREEN}Docker Compose monitoring configuration created${NC}"

# =============================================================================
# Step 6: Create CI/CD workflow
# =============================================================================
echo -e "\n${BLUE}[Step 6/10]${NC} GitHub Actions workflow creation"

mkdir -p "$PROJECT_DIR/.github/workflows"

# Main CI/CD
cat > "$PROJECT_DIR/.github/workflows/ci-cd.yml" << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [develop, 'feature/**']
  pull_request:
    branches: [develop, 'feature/**']

env:
  NODE_VERSION: '18.x'
  AWS_REGION: 'ap-northeast-1'
  ECR_REPOSITORY: instaflow-backend
  ECS_CLUSTER: instaflow-cluster
  ECS_SERVICE: instaflow-backend

jobs:
  # Test job
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint

      - name: Run unit tests
        working-directory: ./backend
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  # Dev deployment (develop only)
  deploy-dev:
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy@v1
        with:
          cluster: ${{ env.ECS_CLUSTER }}
          service: ${{ env.ECS_SERVICE }}
          image: ${{ steps.login-ecr.outputs.registry }}/$ECR_REPOSITORY:$IMAGE_TAG
          task-definition: instaflow-backend-task

  # Production deployment (manual trigger)
  deploy-prod:
    if: github.event_name == 'workflow_dispatch'
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          cd infrastructure/terraform
          terraform init
          terraform apply -auto-approve

  # Security scan
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
EOF

echo -e "${GREEN}CI/CD workflow created${NC}"

# =============================================================================
# Step 7: Create monitoring scripts
# =============================================================================
echo -e "\n${BLUE}[Step 7/10]${NC} Monitoring scripts creation"

# Health check script
cat > "$INFRA_DIR/scripts/health_check.sh" << 'EOF'
#!/bin/bash
# Health check script

BACKEND_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:3000"
SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL"

check_health() {
    local url=$1
    local service=$2

    echo "Checking $service at $url..."

    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status_code" -eq 200 ]; then
        echo "OK: $service is healthy"
        return 0
    else
        echo "ERROR: $service is unhealthy (status: $status_code)"
        send_alert "$service is down! Status: $status_code"
        return 1
    fi
}

send_alert() {
    local message=$1

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Check each service
check_health "$BACKEND_URL" "Backend"
check_health "$FRONTEND_URL" "Frontend"
EOF

chmod +x "$INFRA_DIR/scripts/health_check.sh"

echo -e "${GREEN}Health check script created${NC}"

# Deploy script
cat > "$INFRA_DIR/scripts/deploy.sh" << 'EOF'
#!/bin/bash
# Deployment script

set -e

ENVIRONMENT=${1:-development}
IMAGE_TAG=${2:-latest}
AWS_REGION="ap-northeast-1"
ECR_REPO="instaflow-backend"
ECS_CLUSTER="instaflow-cluster"
ECS_SERVICE="instaflow-backend"

echo "Deploying to $ENVIRONMENT..."
echo "Image tag: $IMAGE_TAG"

# ECR login
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
echo "Building Docker image..."
docker build -t $ECR_REPO:$IMAGE_TAG ./backend

# Push image
echo "Pushing image to ECR..."
docker push $ECR_REPO:$IMAGE_TAG

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION

echo "Deployment completed!"
echo "Service: $ECS_SERVICE"
echo "Cluster: $ECS_CLUSTER"
EOF

chmod +x "$INFRA_DIR/scripts/deploy.sh"

echo -e "${GREEN}Deploy script created${NC}"

# Backup script
cat > "$INFRA_DIR/scripts/backup.sh" << 'EOF'
#!/bin/bash
# Database backup script

set -e

BACKUP_DIR="/backups/instaflow"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="$DB_HOST"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"
S3_BUCKET="$S3_BACKUP_BUCKET"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $DATE..."

# PostgreSQL backup
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/backup_$DATE.sql"

echo "Backup completed: backup_$DATE.sql.gz"

# Upload to S3
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" "s3://$S3_BUCKET/backups/"

    echo "Upload completed to s3://$S3_BUCKET/backups/backup_$DATE.sql.gz"
fi

# Delete old backups (30+ days)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Old backups cleaned up"
echo "Backup process completed successfully!"
EOF

chmod +x "$INFRA_DIR/scripts/backup.sh"

echo -e "${GREEN}Backup script created${NC}"

# =============================================================================
# Step 8: Initial commit
# =============================================================================
echo -e "\n${BLUE}[Step 8/10]${NC} Infrastructure initial commit"

cd "$INFRA_DIR"

git add .
git commit -m "feat(infra): initialize infrastructure as code

- Set up Terraform configuration for AWS
- Create Kubernetes manifests (Deployment, Service)
- Add Docker Compose monitoring stack (Prometheus, Grafana, Jaeger)
- Configure GitHub Actions CI/CD pipeline
- Add monitoring scripts (health_check, deploy, backup)
- Set up automated backups

AI Agent 3 (Infrastructure) - Setup complete"

echo -e "${GREEN}Infrastructure initial commit created${NC}"

# =============================================================================
# Setup Complete
# =============================================================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Terminal 3: Infrastructure & DevOps Environment Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. terraform init (infrastructure/terraform directory)"
echo "2. terraform apply -auto-approve (AWS resources)"
echo "3. kubectl apply -f k8s/ (Deploy to Kubernetes)"
echo "4. docker-compose -f docker/docker-compose.monitoring.yml up -d (Start monitoring)"
echo "5. ./scripts/health_check.sh (Health check)"

echo -e "\n${YELLOW}Notes:${NC}"
echo "- Configure AWS credentials in ~/.aws/credentials"
echo "- Create S3 bucket for Terraform state beforehand"
echo "- docker-compose up -d can start local development environment"
echo "- CI/CD workflow will run automatically on push"

echo -e "\n${BLUE}Ready to code!${NC}"
