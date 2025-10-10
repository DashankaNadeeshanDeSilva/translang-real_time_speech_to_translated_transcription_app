#!/bin/bash

# TransLang AWS Deployment Script
# Automates deployment to AWS ECR + ECS Fargate
# 
# Usage: ./deployment/deploy.sh
#
# Prerequisites:
# - AWS CLI configured
# - Docker installed
# - Environment variables set

set -e  # Exit on error

echo "🚀 TransLang AWS Deployment Script"
echo "=================================="
echo ""

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECR_REPOSITORY="translang"
ECS_CLUSTER="translang-cluster"
ECS_SERVICE="translang-service"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Validate prerequisites
echo "📋 Checking prerequisites..."

if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "❌ Error: AWS_ACCOUNT_ID environment variable not set"
  echo "   Run: export AWS_ACCOUNT_ID=123456789012"
  exit 1
fi

if ! command -v aws &> /dev/null; then
  echo "❌ Error: AWS CLI not installed"
  echo "   Install from: https://aws.amazon.com/cli/"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Error: Docker not installed"
  echo "   Install from: https://www.docker.com/products/docker-desktop"
  exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Step 1: Build Docker image
echo "🐳 Step 1: Building Docker image..."
docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
echo "✅ Docker image built successfully"
echo ""

# Step 2: Tag image for ECR
echo "🏷️  Step 2: Tagging image for ECR..."
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
echo "✅ Image tagged: ${ECR_URI}:${IMAGE_TAG}"
echo ""

# Step 3: Login to ECR
echo "🔐 Step 3: Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo "✅ ECR login successful"
echo ""

# Step 4: Push image to ECR
echo "📤 Step 4: Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}
echo "✅ Image pushed to ECR"
echo ""

# Step 5: Update ECS service (force new deployment)
echo "🔄 Step 5: Updating ECS service..."
aws ecs update-service \
  --cluster ${ECS_CLUSTER} \
  --service ${ECS_SERVICE} \
  --force-new-deployment \
  --region ${AWS_REGION} \
  > /dev/null

echo "✅ ECS service update initiated"
echo ""

# Step 6: Wait for deployment
echo "⏳ Step 6: Waiting for deployment to complete..."
echo "   This may take 2-5 minutes..."

aws ecs wait services-stable \
  --cluster ${ECS_CLUSTER} \
  --services ${ECS_SERVICE} \
  --region ${AWS_REGION}

echo "✅ Deployment completed successfully!"
echo ""

# Step 7: Get public IP
echo "🌐 Step 7: Retrieving public IP..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster ${ECS_CLUSTER} \
  --service-name ${ECS_SERVICE} \
  --region ${AWS_REGION} \
  --query "taskArns[0]" \
  --output text)

if [ -n "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
  ENI_ID=$(aws ecs describe-tasks \
    --cluster ${ECS_CLUSTER} \
    --tasks ${TASK_ARN} \
    --region ${AWS_REGION} \
    --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
    --output text)
  
  if [ -n "$ENI_ID" ]; then
    PUBLIC_IP=$(aws ec2 describe-network-interfaces \
      --network-interface-ids ${ENI_ID} \
      --region ${AWS_REGION} \
      --query "NetworkInterfaces[0].Association.PublicIp" \
      --output text)
    
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Your app is live at:"
    echo "   http://${PUBLIC_IP}:3000"
    echo ""
  fi
fi

echo "📊 View logs:"
echo "   aws logs tail /ecs/translang --follow"
echo ""
echo "🎉 Deployment complete!"

