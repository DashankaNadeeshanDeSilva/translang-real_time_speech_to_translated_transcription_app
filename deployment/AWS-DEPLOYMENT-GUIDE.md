# 🚀 AWS Deployment Guide - TransLang (Beginner-Friendly)

## Complete Guide to Deploy on AWS with Docker + ECR + ECS Fargate

This guide will walk you through deploying TransLang to AWS step by step. **No prior AWS experience required!**

---

## 📋 Table of Contents

1. [Why AWS Fargate?](#why-aws-fargate)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Step 1: Prepare Your Application](#step-1-prepare-your-application)
5. [Step 2: Build Docker Image](#step-2-build-docker-image)
6. [Step 3: Setup AWS CLI](#step-3-setup-aws-cli)
7. [Step 4: Create ECR Repository](#step-4-create-ecr-repository)
8. [Step 5: Push Image to ECR](#step-5-push-image-to-ecr)
9. [Step 6: Create ECS Cluster](#step-6-create-ecs-cluster)
10. [Step 7: Create Task Definition](#step-7-create-task-definition)
11. [Step 8: Deploy Service](#step-8-deploy-service)
12. [Step 9: Access Your App](#step-9-access-your-app)
13. [Troubleshooting](#troubleshooting)
14. [Cost Estimation](#cost-estimation)
15. [Updating Your App](#updating-your-app)

---

## 🤔 Why AWS Fargate?

**Fargate** is AWS's **serverless container service**. Here's why it's perfect for beginners:

### ✅ Advantages of Fargate:
- **No Server Management** - AWS handles everything
- **Auto-Scaling** - Automatically scales with traffic
- **Pay Per Use** - Only pay for what you use
- **Easy Deployment** - Simpler than managing EC2 instances
- **Secure** - Built-in security features
- **Perfect for Next.js** - Ideal for web applications

### 🆚 Fargate vs EC2:
| Feature | Fargate | EC2 |
|---------|---------|-----|
| Server Management | ❌ None | ✅ Manual |
| Complexity | 🟢 Low | 🔴 High |
| Scaling | 🟢 Automatic | 🟡 Manual |
| Cost (Low Traffic) | 🟢 Lower | 🔴 Higher |
| Best For | **Beginners, Web Apps** | Advanced users |

**Recommendation:** Use **Fargate** for this project! ✅

---

## 📦 Prerequisites

Before starting, you'll need:

### 1. **AWS Account**
- Sign up at [aws.amazon.com](https://aws.amazon.com)
- Free tier available (12 months)
- Credit card required (but won't charge without usage)

### 2. **AWS CLI Installed**
- Download: [AWS CLI Installation](https://aws.amazon.com/cli/)
- Verify installation: `aws --version`

### 3. **Docker Installed**
- Download: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Verify: `docker --version`

### 4. **Soniox API Key**
- Production API key from [soniox.com](https://soniox.com)

### 5. **Project Files**
- Your completed TransLang application
- All phases (0-6) implemented

---

## 🏗️ Architecture Overview

```
Your Computer
    ↓
[Docker Build]
    ↓
Docker Image
    ↓
Push to AWS ECR (Container Registry)
    ↓
AWS ECS Fargate
    ↓
Running Container
    ↓
Application Load Balancer (Optional)
    ↓
Users Access via HTTPS
```

**What each component does:**

- **Docker**: Packages your app into a container
- **ECR** (Elastic Container Registry): Stores your Docker image
- **ECS** (Elastic Container Service): Manages containers
- **Fargate**: Runs containers without servers
- **ALB** (Application Load Balancer): Routes traffic (optional)

---

## 📝 Step 1: Prepare Your Application

### 1.1 Create Production Environment File

```bash
# In your project root
cp .env.local.example .env.production

# Edit .env.production with your production values
```

**`.env.production` contents:**
```env
SONIOX_SECRET_KEY=your_production_soniox_api_key_here
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 1.2 Test Production Build Locally

```bash
# Build for production
npm run build

# Test the build
npm run start

# Verify it works at http://localhost:3000
```

✅ **Checkpoint:** App should work perfectly in production mode!

---

## 🐳 Step 2: Build Docker Image

### 2.1 Build the Image

```bash
# In your project root
docker build -t translang:latest .
```

**This will take 3-5 minutes.** You'll see:
```
[+] Building 234.5s (18/18) FINISHED
=> [internal] load build definition
=> => transferring dockerfile
=> [internal] load .dockerignore
=> [internal] load metadata for docker.io/library/node:20-alpine
...
=> exporting to image
=> => writing image sha256:abc123...
=> => naming to docker.io/library/translang:latest
```

### 2.2 Test Docker Image Locally

```bash
# Run the container
docker run -p 3000:3000 \
  -e SONIOX_SECRET_KEY=your_api_key_here \
  translang:latest
```

**Open browser:** http://localhost:3000

✅ **Checkpoint:** App should work in Docker container!

### 2.3 Stop the Container

```bash
# Press Ctrl+C
# Or in another terminal:
docker ps  # Find container ID
docker stop <container_id>
```

---

## ⚙️ Step 3: Setup AWS CLI

### 3.1 Configure AWS Credentials

```bash
aws configure
```

**You'll be asked:**
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

**To get AWS credentials:**
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Click your name (top right) → Security credentials
3. Create access key → CLI access
4. Copy Access Key ID and Secret Access Key

### 3.2 Verify Configuration

```bash
aws sts get-caller-identity
```

**Should return:**
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-name"
}
```

✅ **Checkpoint:** AWS CLI is configured!

---

## 📦 Step 4: Create ECR Repository

**ECR** is where we'll store your Docker image.

### 4.1 Create Repository

```bash
aws ecr create-repository \
  --repository-name translang \
  --region us-east-1
```

**Response:**
```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-east-1:123456789012:repository/translang",
        "registryId": "123456789012",
        "repositoryName": "translang",
        "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/translang"
    }
}
```

**Save the `repositoryUri`** - you'll need it!

### 4.2 Verify Repository Created

```bash
aws ecr describe-repositories --repository-names translang
```

✅ **Checkpoint:** ECR repository exists!

---

## 📤 Step 5: Push Image to ECR

### 5.1 Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

**Replace `123456789012` with your AWS account ID!**

**Success message:**
```
Login Succeeded
```

### 5.2 Tag Your Image

```bash
docker tag translang:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/translang:latest
```

**Replace with YOUR account ID and repository URI!**

### 5.3 Push to ECR

```bash
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/translang:latest
```

**This will take 2-5 minutes.** You'll see:
```
The push refers to repository [123456789012.dkr.ecr.us-east-1.amazonaws.com/translang]
abc123: Pushed
def456: Pushed
...
latest: digest: sha256:xyz789... size: 1234
```

### 5.4 Verify Image in ECR

```bash
aws ecr list-images --repository-name translang
```

✅ **Checkpoint:** Docker image is in ECR!

---

## 🏗️ Step 6: Create ECS Cluster

**ECS Cluster** is where your containers will run.

### 6.1 Create Cluster (Console - Easier!)

**Option A: AWS Console (Recommended for Beginners)**

1. Go to [ECS Console](https://console.aws.amazon.com/ecs/v2)
2. Click **"Clusters"** (left sidebar)
3. Click **"Create cluster"**
4. **Cluster name:** `translang-cluster`
5. Leave other settings as default
6. Click **"Create"**

**Option B: AWS CLI**

```bash
aws ecs create-cluster \
  --cluster-name translang-cluster \
  --region us-east-1
```

### 6.2 Verify Cluster

```bash
aws ecs list-clusters
```

✅ **Checkpoint:** ECS cluster created!

---

## 📋 Step 7: Create Task Definition

**Task Definition** tells ECS how to run your container.

### 7.1 Create Task Definition File

Create `deployment/task-definition.json`:

```json
{
  "family": "translang-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "translang-container",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/translang:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "SONIOX_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:translang/soniox-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/translang",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**⚠️ Important:** Replace:
- `YOUR_ACCOUNT_ID` with your AWS account ID
- Update image URI with your ECR repository

### 7.2 Create IAM Execution Role

**This role allows ECS to pull your Docker image.**

```bash
# Create trust policy file
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### 7.3 Store Soniox API Key in Secrets Manager

**Secure way to store your API key:**

```bash
aws secretsmanager create-secret \
  --name translang/soniox-key \
  --secret-string "your_production_soniox_api_key_here" \
  --region us-east-1
```

**Copy the `ARN` from the response** and use it in task-definition.json!

### 7.4 Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/translang \
  --region us-east-1
```

### 7.5 Register Task Definition

```bash
aws ecs register-task-definition \
  --cli-input-json file://deployment/task-definition.json
```

✅ **Checkpoint:** Task definition registered!

---

## 🚀 Step 8: Deploy Service

### 8.1 Get Default VPC and Subnets

```bash
# Get VPC ID
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

# Get Subnet IDs
aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --query "Subnets[*].SubnetId" --output text
```

**Save these values!**

### 8.2 Create Security Group

```bash
# Get VPC ID (from previous step)
VPC_ID=vpc-xxxxxx

# Create security group
aws ec2 create-security-group \
  --group-name translang-sg \
  --description "Security group for TransLang app" \
  --vpc-id $VPC_ID

# Save the GroupId from response
SG_ID=sg-xxxxxx

# Allow inbound HTTP/HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow port 3000 (Next.js)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

### 8.3 Create ECS Service

```bash
aws ecs create-service \
  --cluster translang-cluster \
  --service-name translang-service \
  --task-definition translang-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxx,subnet-yyyyyy],securityGroups=[sg-xxxxxx],assignPublicIp=ENABLED}" \
  --region us-east-1
```

**Replace:**
- `subnet-xxxxxx` with your subnet IDs (from 8.1)
- `sg-xxxxxx` with your security group ID (from 8.2)

**This creates:**
- 1 running task (container)
- Public IP assigned
- Auto-restart if crash

✅ **Checkpoint:** Service is deploying!

---

## 🌐 Step 9: Access Your App

### 9.1 Get Public IP

**Option A: AWS Console**
1. Go to [ECS Console](https://console.aws.amazon.com/ecs/v2)
2. Click **Clusters** → **translang-cluster**
3. Click **Services** → **translang-service**
4. Click **Tasks** tab
5. Click the running task
6. Find **Public IP** in Configuration section

**Option B: AWS CLI**

```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster translang-cluster \
  --service-name translang-service \
  --query "taskArns[0]" \
  --output text)

# Get task details
aws ecs describe-tasks \
  --cluster translang-cluster \
  --tasks $TASK_ARN \
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
  --output text | xargs -I {} aws ec2 describe-network-interfaces \
  --network-interface-ids {} \
  --query "NetworkInterfaces[0].Association.PublicIp" \
  --output text
```

### 9.2 Access Your Application

```
http://YOUR_PUBLIC_IP:3000
```

**Example:** `http://54.123.45.67:3000`

🎉 **Your app is live on AWS!**

---

## 🐛 Troubleshooting

### Task Not Starting

**Check logs:**
```bash
aws logs tail /ecs/translang --follow
```

**Common issues:**
- ❌ Wrong image URI in task definition
- ❌ Secrets Manager ARN incorrect
- ❌ IAM role missing permissions
- ❌ Security group blocking port 3000

### Cannot Access App

**Check:**
1. Security group allows port 3000
2. Public IP assignment enabled
3. Task status is "RUNNING"
4. Health check passing

**View task status:**
```bash
aws ecs describe-tasks \
  --cluster translang-cluster \
  --tasks $TASK_ARN
```

### Container Keeps Restarting

**Check logs for errors:**
```bash
aws logs tail /ecs/translang --follow
```

**Common causes:**
- Missing SONIOX_SECRET_KEY
- Health check failing
- Application crash
- Out of memory (increase memory in task definition)

---

## 💰 Cost Estimation

### AWS Fargate Pricing (us-east-1):

**Your Configuration:**
- CPU: 0.5 vCPU = $0.04048/hour
- Memory: 1 GB = $0.004445/hour
- **Total:** ~$0.045/hour = **$32.40/month** (24/7)

**If running 8 hours/day:**
- 8 hours × 30 days = 240 hours/month
- 240 × $0.045 = **~$10.80/month**

**Additional costs:**
- ECR storage: ~$0.10/GB/month (image is ~500MB)
- Data transfer: First 100GB free
- Load balancer (optional): ~$16/month

**Estimated total:** $11-50/month depending on usage

**Free Tier (First 12 months):**
- 50GB ECR storage free
- Some compute free

---

## 🔄 Updating Your App

### When You Make Changes:

```bash
# 1. Build new Docker image
docker build -t translang:latest .

# 2. Tag with ECR URI
docker tag translang:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/translang:latest

# 3. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 4. Push new image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/translang:latest

# 5. Force new deployment
aws ecs update-service \
  --cluster translang-cluster \
  --service translang-service \
  --force-new-deployment \
  --region us-east-1
```

**Wait 2-3 minutes for new task to start!**

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
aws logs tail /ecs/translang --follow

# Recent logs
aws logs tail /ecs/translang --since 1h
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster translang-cluster \
  --services translang-service
```

### View Running Tasks

```bash
aws ecs list-tasks \
  --cluster translang-cluster \
  --service-name translang-service
```

---

## 🛑 Stopping/Deleting Resources

### To Stop (But Keep Resources):

```bash
aws ecs update-service \
  --cluster translang-cluster \
  --service translang-service \
  --desired-count 0
```

### To Delete Everything:

```bash
# 1. Delete service
aws ecs delete-service \
  --cluster translang-cluster \
  --service translang-service \
  --force

# 2. Wait for service to be deleted (1-2 minutes)

# 3. Delete cluster
aws ecs delete-cluster \
  --cluster translang-cluster

# 4. Delete ECR repository
aws ecr delete-repository \
  --repository-name translang \
  --force

# 5. Delete security group
aws ec2 delete-security-group --group-id sg-xxxxxx

# 6. Delete secrets
aws secretsmanager delete-secret \
  --secret-id translang/soniox-key \
  --force-delete-without-recovery

# 7. Delete log group
aws logs delete-log-group \
  --log-group-name /ecs/translang
```

---

## 🎯 Quick Reference

### Useful Commands:

```bash
# Check service status
aws ecs describe-services --cluster translang-cluster --services translang-service

# View logs
aws logs tail /ecs/translang --follow

# Update deployment
aws ecs update-service --cluster translang-cluster --service translang-service --force-new-deployment

# Scale up (more containers)
aws ecs update-service --cluster translang-cluster --service translang-service --desired-count 2

# Scale down
aws ecs update-service --cluster translang-cluster --service translang-service --desired-count 1
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Production API key added to Secrets Manager
- [ ] Docker image builds successfully
- [ ] Image pushed to ECR
- [ ] Task definition registered
- [ ] Security group allows port 3000
- [ ] Service created and running
- [ ] Health check passing
- [ ] Application accessible via public IP
- [ ] Logs working in CloudWatch
- [ ] Environment variables set correctly

---

## 🎓 Next Steps (Optional)

### Add Custom Domain:
1. Register domain (Route 53)
2. Create Application Load Balancer
3. Setup SSL certificate (ACM)
4. Point domain to ALB

### Add Auto-Scaling:
1. Create auto-scaling target
2. Define scaling policies
3. Monitor with CloudWatch

### Improve Security:
1. Use private subnets
2. Add NAT gateway
3. Restrict security groups
4. Enable VPC Flow Logs

---

**🎉 Congratulations! Your TransLang app is deployed on AWS!**

For detailed architectural decisions and alternatives, see `AWS-ARCHITECTURE.md`.

---

Built with ❤️ on AWS Fargate

