# ⚡ AWS Deployment Quick Start (5 Simple Steps!)

## For Complete Beginners - Deploy in 30 Minutes

This is the **simplest path** to deploy TransLang on AWS. Follow these 5 steps exactly!

---

## ✅ Before You Start

**You need:**
1. ✅ AWS account ([sign up here](https://aws.amazon.com))
2. ✅ Docker installed ([get it here](https://www.docker.com/products/docker-desktop))
3. ✅ Soniox API key ([get it here](https://soniox.com))

---

## 🚀 Step 1: Install AWS CLI

### Mac:
```bash
brew install awscli
```

### Windows:
Download and run: [AWS CLI Installer](https://awscli.amazonaws.com/AWSCLIV2.msi)

### Linux:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Verify:**
```bash
aws --version
# Should show: aws-cli/2.x.x
```

---

## 🔑 Step 2: Configure AWS

### 2.1 Get Your AWS Credentials

1. Login to [AWS Console](https://console.aws.amazon.com)
2. Click your name (top right) → **Security credentials**
3. Scroll to **Access keys**
4. Click **Create access key** → Choose **CLI**
5. Copy **Access Key ID** and **Secret Access Key**

### 2.2 Configure CLI

```bash
aws configure
```

**Enter when prompted:**
```
AWS Access Key ID: <paste your key>
AWS Secret Access Key: <paste your secret>
Default region name: us-east-1
Default output format: json
```

**Verify it worked:**
```bash
aws sts get-caller-identity
```

✅ **You should see your account info!**

---

## 🐳 Step 3: Build & Push Docker Image

### 3.1 Set Your AWS Account ID

```bash
# Get your account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Verify
echo $AWS_ACCOUNT_ID
```

### 3.2 Create ECR Repository

```bash
aws ecr create-repository --repository-name translang --region us-east-1
```

### 3.3 Build Docker Image

```bash
# In your project root
docker build -t translang:latest .
```

**(Takes 3-5 minutes - time for coffee! ☕)**

### 3.4 Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
```

### 3.5 Tag and Push

```bash
# Tag
docker tag translang:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/translang:latest

# Push
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/translang:latest
```

**(Takes 2-5 minutes)**

✅ **Your app is now in AWS!**

---

## 🏗️ Step 4: Setup ECS (Use AWS Console - Easier!)

### 4.1 Store Your Soniox API Key

```bash
aws secretsmanager create-secret \
  --name translang/soniox-key \
  --secret-string '{"SONIOX_SECRET_KEY":"your_actual_api_key_here"}' \
  --region us-east-1
```

**Copy the ARN from the response!**

### 4.2 Create Task Execution Role (If Needed)

```bash
# Check if role exists
aws iam get-role --role-name ecsTaskExecutionRole 2>/dev/null

# If not found, create it:
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ecs-tasks.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager access
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### 4.3 Use AWS Console for ECS Setup

**👉 This is EASIER than CLI for beginners!**

1. **Go to:** [AWS ECS Console](https://console.aws.amazon.com/ecs/v2)

2. **Create Cluster:**
   - Click "Clusters" → "Create cluster"
   - Name: `translang-cluster`
   - Click "Create"

3. **Create Task Definition:**
   - Click "Task definitions" → "Create new task definition" → "Create new task definition with JSON"
   - Copy contents from `deployment/task-definition.template.json`
   - **Replace** `YOUR_ACCOUNT_ID` with your account ID
   - **Replace** the secrets ARN with your actual ARN from step 4.1
   - Click "Create"

4. **Create Service:**
   - Go back to "Clusters" → "translang-cluster"
   - Click "Services" tab → "Create"
   - **Task definition:** Choose `translang-task`
   - **Service name:** `translang-service`
   - **Desired tasks:** 1
   - **Networking:**
     - Select default VPC
     - Select subnets (choose 2+)
     - Security group: Create new
       - Allow port 3000 from anywhere
     - **Public IP:** ENABLED
   - Click "Create"

✅ **ECS is deploying your app!**

---

## 🌐 Step 5: Access Your App

### 5.1 Wait for Task to Start

**In ECS Console:**
1. Go to "Clusters" → "translang-cluster"
2. Click "Services" → "translang-service"
3. Click "Tasks" tab
4. Wait for status: **RUNNING** (takes 1-2 minutes)

### 5.2 Get Public IP

1. Click the running task
2. Scroll to **Configuration** section
3. Find **Public IP**
4. Copy it!

### 5.3 Open Your App

```
http://YOUR_PUBLIC_IP:3000
```

**Example:** `http://54.123.45.67:3000`

🎉 **Your app is LIVE on AWS!**

---

## 🎯 Summary - What You Just Did

1. ✅ Built Docker image of your app
2. ✅ Pushed to AWS ECR (container storage)
3. ✅ Created ECS cluster (container orchestrator)
4. ✅ Created task definition (container config)
5. ✅ Deployed service on Fargate (serverless!)

**Total time:** ~30 minutes
**Cost:** ~$32/month (or $11/month if 8 hours/day)

---

## 🔄 To Update Your App Later

```bash
# 1. Make your code changes
# 2. Run the deployment script:
cd deployment
chmod +x deploy.sh
export AWS_ACCOUNT_ID=123456789012  # Your account ID
./deploy.sh

# That's it! Script handles everything:
# - Builds new image
# - Pushes to ECR
# - Updates ECS service
# - Waits for deployment
# - Shows new public IP
```

---

## 🆘 Getting Help

### If Something Doesn't Work:

**1. Check AWS Console:**
- Go to ECS → Clusters → translang-cluster
- Look for error messages

**2. Check Logs:**
```bash
aws logs tail /ecs/translang --follow
```

**3. Common Issues:**
- ❌ **"AccessDenied"** → Check IAM permissions
- ❌ **"ImagePullBackOff"** → Check ECR image exists
- ❌ **"CannotPullContainer"** → Check task execution role
- ❌ **"Unhealthy"** → Check health endpoint works

**4. Start Fresh:**
If stuck, delete everything and start over:
```bash
# Delete service
aws ecs delete-service --cluster translang-cluster --service translang-service --force

# Delete cluster
aws ecs delete-cluster --cluster translang-cluster

# Try again from Step 4!
```

---

## 🎓 You're Done!

Congratulations! You've deployed a production Next.js app on AWS using:
- ✅ Docker containers
- ✅ AWS ECR for storage
- ✅ AWS ECS for orchestration
- ✅ AWS Fargate for serverless compute
- ✅ Secrets Manager for security

**This is real DevOps!** 🚀

---

**Next Steps:**
- Share the public IP with friends
- Test the real-time translation
- Monitor logs in CloudWatch
- Consider adding a custom domain (optional)

**For more details:** See `AWS-DEPLOYMENT-GUIDE.md`
**For architecture:** See `AWS-ARCHITECTURE.md`

---

You're now a cloud engineer! 🎉

