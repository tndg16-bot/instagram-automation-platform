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
