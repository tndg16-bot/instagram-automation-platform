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
