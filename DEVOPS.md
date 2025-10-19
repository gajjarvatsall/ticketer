# DevOps Documentation - Ticketer Platform

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Infrastructure](#infrastructure)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AWS Free Tier                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         EC2 Instance (t2.micro)                │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │         K3s Kubernetes Cluster           │ │    │
│  │  │                                           │ │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │ │    │
│  │  │  │Frontend │  │  Auth   │  │  Event  │ │ │    │
│  │  │  │ (Nginx) │  │ Service │  │ Service │ │ │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘ │ │    │
│  │  │                                           │ │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │ │    │
│  │  │  │ Ticket  │  │ Payment │  │ MongoDB │ │ │    │
│  │  │  │ Service │  │ Service │  │         │ │ │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘ │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────┐                                     │
│  │  Elastic IP    │ ◄── Public Access                  │
│  └────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Container Orchestration**: k3s (Lightweight Kubernetes)
- **Infrastructure as Code**: Terraform
- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Cloud Provider**: AWS (Free Tier)
- **Database**: MongoDB (containerized)
- **Frontend**: React + Vite (served via Nginx)
- **Backend**: Node.js microservices

---

## 🌐 Infrastructure

### AWS Resources (All Free Tier Eligible)

1. **EC2 Instance**
   - Type: t2.micro (1 vCPU, 1GB RAM)
   - OS: Ubuntu 22.04 LTS
   - Storage: 20GB gp2 EBS
   - Free tier: 750 hours/month

2. **Networking**
   - VPC with custom CIDR (10.0.0.0/16)
   - Public subnet
   - Internet Gateway
   - Route tables
   - Security groups

3. **Elastic IP**
   - Static public IP
   - Free when attached to running instance

### Why K3s Instead of EKS?

| Feature  | EKS                 | K3s on EC2           |
| -------- | ------------------- | -------------------- |
| Cost     | $73/month + EC2     | FREE (only EC2)      |
| Setup    | Complex             | Simple               |
| Features | Full K8s            | 95% K8s features     |
| Best for | Production at scale | Small apps, learning |

**Cost Savings: $73/month = $876/year!** 🎉

---

## 💻 Local Development

### Prerequisites

```bash
# Install required tools
brew install docker docker-compose  # macOS
# or
sudo apt install docker.io docker-compose  # Linux
```

### Running Locally

1. **Using Docker Compose** (Recommended for testing)

   ```bash
   docker-compose up -d
   ```

   Access:
   - Frontend: http://localhost:5173
   - Auth API: http://localhost:3001
   - Event API: http://localhost:3002
   - Ticket API: http://localhost:3003
   - Payment API: http://localhost:3004

2. **Using npm** (Development mode)

   ```bash
   # Start MongoDB
   docker run -d -p 27017:27017 mongo:7.0

   # Start services
   ./start-all.sh
   ```

### Building Docker Images Locally

```bash
./scripts/build-images.sh
```

---

## 🚀 Deployment

### One-Time Setup

#### 1. AWS Account Setup

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# Enter:
#   AWS Access Key ID
#   AWS Secret Access Key
#   Default region: us-east-1
#   Default output: json
```

#### 2. Create EC2 Key Pair

```bash
# Create key pair in AWS Console or CLI
aws ec2 create-key-pair \
  --key-name ticketer-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/ticketer-key.pem

chmod 400 ~/.ssh/ticketer-key.pem
```

#### 3. Install Tools

```bash
# Terraform
brew install terraform  # macOS
# or
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# kubectl
brew install kubectl  # macOS
# or
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Manual Deployment

#### Step 1: Build and Push Images

```bash
# Build images
./scripts/build-images.sh

# Push to GitHub Container Registry
./scripts/push-images.sh
```

#### Step 2: Deploy Infrastructure

```bash
# Run deployment script
./scripts/deploy.sh
```

This script will:

1. Create terraform.tfvars with secure random passwords
2. Deploy AWS infrastructure (VPC, EC2, security groups)
3. Install k3s on the EC2 instance
4. Configure kubectl
5. Deploy all microservices to Kubernetes
6. Display access information

#### Step 3: Access Your Application

```bash
# The script outputs:
# Application URL: http://<PUBLIC_IP>:30080
# SSH Access: ssh -i ~/.ssh/ticketer-key.pem ubuntu@<PUBLIC_IP>
```

### Destroying Everything (Single Command!)

```bash
# Destroy ALL AWS resources
./scripts/destroy.sh
```

This will:

- Terminate the EC2 instance
- Delete the VPC and all networking
- Release the Elastic IP
- Remove all security groups
- **Stop all charges immediately** 💰

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. CI Pipeline (.github/workflows/ci.yml)

Triggers on: Push to `main` or `develop`, Pull Requests

**Jobs:**

- ✅ Lint and test frontend
- ✅ Test all microservices
- ✅ Build Docker images (test only)

#### 2. CD Pipeline (.github/workflows/cd.yml)

Triggers on: Push to `main`

**Jobs:**

- 🔨 Build and push Docker images to GHCR
- 🚀 Deploy to Kubernetes on AWS

### Required GitHub Secrets

Add these in GitHub → Settings → Secrets:

```bash
AWS_ACCESS_KEY_ID          # Your AWS access key
AWS_SECRET_ACCESS_KEY      # Your AWS secret key
AWS_REGION                 # us-east-1
SSH_PRIVATE_KEY            # Contents of ticketer-key.pem
MONGODB_ROOT_PASSWORD      # Generate: openssl rand -base64 32
SESSION_SECRET             # Generate: openssl rand -base64 32
```

### Setting Up GitHub Actions

1. **Enable GitHub Container Registry**

   ```bash
   # Login to ghcr.io
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

2. **Make packages public** (optional)
   - Go to your package settings
   - Change visibility to "Public"

3. **Trigger deployment**
   ```bash
   git push origin main
   ```

---

## 📊 Monitoring & Logging

### View Logs

```bash
# View all pods
kubectl get pods -n ticketer

# View specific service logs
kubectl logs -f deployment/auth-service -n ticketer
kubectl logs -f deployment/frontend -n ticketer

# View last 100 lines
kubectl logs --tail=100 deployment/event-service -n ticketer

# View all containers in a pod
kubectl logs deployment/mongodb -n ticketer --all-containers=true
```

### Check Status

```bash
# All resources
kubectl get all -n ticketer

# Deployments
kubectl get deployments -n ticketer

# Services
kubectl get services -n ticketer

# Pods with details
kubectl get pods -n ticketer -o wide
```

### Debug Pod Issues

```bash
# Describe pod (shows events)
kubectl describe pod <pod-name> -n ticketer

# Get into a container
kubectl exec -it <pod-name> -n ticketer -- /bin/sh

# Check resource usage
kubectl top pods -n ticketer
kubectl top nodes
```

### Access MongoDB

```bash
# Port forward to MongoDB
kubectl port-forward -n ticketer svc/mongodb 27017:27017

# Connect with mongosh
mongosh mongodb://admin:<password>@localhost:27017/admin
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n ticketer

# Common causes:
# - Image pull errors (check image name)
# - Resource limits (t2.micro is small!)
# - Failing health checks
```

#### 2. Out of Memory

```bash
# Check resource usage
kubectl top pods -n ticketer

# Solution: Reduce replicas or resource requests in YAML files
```

#### 3. Connection Refused

```bash
# Check if service is running
kubectl get svc -n ticketer

# Check security group allows port
aws ec2 describe-security-groups --group-ids <sg-id>

# Verify pod is ready
kubectl get pods -n ticketer
```

#### 4. Terraform State Lock

```bash
# If terraform is stuck
cd terraform
terraform force-unlock <LOCK_ID>
```

#### 5. Cannot Connect to K8s

```bash
# Re-fetch kubeconfig
SERVER_IP=$(cd terraform && terraform output -raw instance_public_ip)
scp -i ~/.ssh/ticketer-key.pem ubuntu@$SERVER_IP:/home/ubuntu/.kube/config ~/.kube/config-ticketer
sed -i "s/127.0.0.1/$SERVER_IP/g" ~/.kube/config-ticketer
export KUBECONFIG=~/.kube/config-ticketer
```

---

## 💰 Cost Optimization

### Free Tier Limits

| Resource          | Free Tier          | Our Usage | Safe?  |
| ----------------- | ------------------ | --------- | ------ |
| EC2 t2.micro      | 750 hrs/month      | ~720 hrs  | ✅ Yes |
| EBS Storage       | 30 GB              | 20 GB     | ✅ Yes |
| Data Transfer Out | 100 GB/month       | <5 GB     | ✅ Yes |
| Elastic IP        | Free when attached | 1         | ✅ Yes |

### Cost Monitoring

```bash
# Check AWS costs
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost"
```

### Staying Free

1. **Run ONE t2.micro instance** (we do this ✅)
2. **Don't use EKS** (we use k3s ✅)
3. **Keep EBS under 30GB** (we use 20GB ✅)
4. **Delete when not needed** (`./scripts/destroy.sh`)
5. **Stop instance when testing**:
   ```bash
   aws ec2 stop-instances --instance-ids $(cd terraform && terraform output -raw instance_id)
   # Start again:
   aws ec2 start-instances --instance-ids $(cd terraform && terraform output -raw instance_id)
   ```

### After 12 Months (Free Tier Expires)

**Expected cost:** ~$8-10/month

- t2.micro: ~$8/month
- EBS 20GB: ~$2/month
- Elastic IP: FREE (when attached)

**Ways to reduce:**

- Use t2.nano: ~$4/month (512MB RAM - may be tight)
- Run only when needed (stop at night)
- Consider spot instances: ~$2/month

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Deploy everything
./scripts/deploy.sh

# Destroy everything
./scripts/destroy.sh

# Build images
./scripts/build-images.sh

# Push images
./scripts/push-images.sh

# View all resources
kubectl get all -n ticketer

# Check logs
kubectl logs -f deployment/auth-service -n ticketer

# SSH to server
ssh -i ~/.ssh/ticketer-key.pem ubuntu@<PUBLIC_IP>

# Port forward a service
kubectl port-forward -n ticketer svc/auth-service 3001:3001
```

### Useful URLs

- AWS Console: https://console.aws.amazon.com
- GitHub Packages: https://github.com/USERNAME?tab=packages
- Terraform Registry: https://registry.terraform.io

---

## 📚 Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [K3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

## 🤝 Contributing

1. Make changes in a feature branch
2. Push to GitHub (triggers CI)
3. Create Pull Request
4. After merge to main, CD automatically deploys

---

## 📧 Support

For issues or questions:

1. Check logs: `kubectl logs -f deployment/<service> -n ticketer`
2. Check pod status: `kubectl describe pod <pod-name> -n ticketer`
3. SSH to server: `ssh -i ~/.ssh/ticketer-key.pem ubuntu@<PUBLIC_IP>`

---

**Made with ❤️ for learning DevOps practices**
