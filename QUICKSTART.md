# Quick Start Guide - Ticketer Platform Deployment

This guide will help you deploy the Ticketer platform to AWS in under 10 minutes.

## 📋 Prerequisites Checklist

- [ ] AWS Account (with free tier available)
- [ ] GitHub Account
- [ ] Docker installed locally
- [ ] AWS CLI installed and configured
- [ ] Terraform installed
- [ ] kubectl installed

## 🚀 Deployment Steps

### 1. Install Required Tools (5 minutes)

```bash
# macOS
brew install awscli terraform kubectl docker

# Linux
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip && sudo mv terraform /usr/local/bin/

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/
```

### 2. Configure AWS (2 minutes)

```bash
# Configure AWS credentials
aws configure
# Enter:
#   AWS Access Key ID: [your-key-id]
#   AWS Secret Access Key: [your-secret]
#   Default region: us-east-1
#   Default output: json

# Create EC2 key pair
aws ec2 create-key-pair \
  --key-name ticketer-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/ticketer-key.pem

chmod 400 ~/.ssh/ticketer-key.pem
```

### 3. Build and Push Docker Images (3 minutes)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ticketer.git
cd ticketer

# Make scripts executable
chmod +x scripts/*.sh

# Build Docker images
./scripts/build-images.sh
# Enter your GitHub username when prompted

# Push to GitHub Container Registry
./scripts/push-images.sh
# Enter your GitHub username and Personal Access Token
# Create token at: https://github.com/settings/tokens/new
# Required scope: write:packages
```

### 4. Deploy to AWS (5 minutes)

```bash
# Run the deployment script
./scripts/deploy.sh

# This will:
# ✅ Create AWS infrastructure (VPC, EC2, security groups)
# ✅ Install k3s Kubernetes on EC2
# ✅ Deploy all microservices
# ✅ Configure MongoDB
# ✅ Setup networking

# When prompted:
# - Review the Terraform plan
# - Type 'yes' to confirm
# - Wait 2-3 minutes for completion
```

### 5. Access Your Application 🎉

After deployment completes, you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Deployment Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Application URL:  http://54.123.45.67:30080
🔑 SSH Access:       ssh -i ~/.ssh/ticketer-key.pem ubuntu@54.123.45.67
☸️  Kubeconfig:       export KUBECONFIG=~/.kube/config-ticketer
```

Open the Application URL in your browser!

## 🔧 Verify Deployment

```bash
# Set kubeconfig
export KUBECONFIG=~/.kube/config-ticketer

# Check all pods are running
kubectl get pods -n ticketer

# Should see:
# NAME                              READY   STATUS    RESTARTS
# mongodb-xxx                       1/1     Running   0
# auth-service-xxx                  1/1     Running   0
# event-service-xxx                 1/1     Running   0
# ticket-service-xxx                1/1     Running   0
# payment-service-xxx               1/1     Running   0
# frontend-xxx                      1/1     Running   0
```

## 🎯 Quick Commands

```bash
# View logs
kubectl logs -f deployment/auth-service -n ticketer

# Check all resources
kubectl get all -n ticketer

# SSH to server
ssh -i ~/.ssh/ticketer-key.pem ubuntu@<YOUR_IP>

# Restart a service
kubectl rollout restart deployment/auth-service -n ticketer
```

## 🗑️ Destroy Everything (STOP ALL CHARGES)

```bash
# Single command to destroy all AWS resources
./scripts/destroy.sh

# Confirm by typing 'yes' then 'destroy'
# All resources deleted in ~2 minutes
# NO MORE AWS CHARGES! 💰
```

## ⚙️ GitHub Actions CI/CD Setup (Optional)

### 1. Add GitHub Secrets

Go to GitHub → Your Repo → Settings → Secrets and variables → Actions

Add these secrets:

```
AWS_ACCESS_KEY_ID          = [your-aws-key]
AWS_SECRET_ACCESS_KEY      = [your-aws-secret]
AWS_REGION                 = us-east-1
SSH_PRIVATE_KEY            = [contents of ~/.ssh/ticketer-key.pem]
MONGODB_ROOT_PASSWORD      = [generate with: openssl rand -base64 32]
SESSION_SECRET             = [generate with: openssl rand -base64 32]
```

### 2. Push Code

```bash
git add .
git commit -m "Setup deployment"
git push origin main

# GitHub Actions will automatically:
# ✅ Run tests
# ✅ Build Docker images
# ✅ Push to GHCR
# ✅ Deploy to AWS
```

## 📊 Cost Breakdown

| Resource      | Free Tier   | Our Usage | Cost         |
| ------------- | ----------- | --------- | ------------ |
| EC2 t2.micro  | 750 hrs/mo  | ~720 hrs  | $0           |
| EBS 20GB      | 30 GB free  | 20 GB     | $0           |
| Data Transfer | 100 GB free | <5 GB     | $0           |
| **Total**     |             |           | **$0/month** |

**After 12 months:** ~$8-10/month

## 🐛 Troubleshooting

### Pods not starting?

```bash
kubectl describe pod <pod-name> -n ticketer
kubectl logs <pod-name> -n ticketer
```

### Can't connect to application?

```bash
# Check security group allows port 30080
# Check pods are running
kubectl get pods -n ticketer

# Try SSH and check from inside
ssh -i ~/.ssh/ticketer-key.pem ubuntu@<YOUR_IP>
curl localhost:30080
```

### Terraform errors?

```bash
cd terraform
terraform init
terraform plan
# Fix any errors in terraform.tfvars
```

## 📚 Next Steps

1. **Customize** - Update environment variables in `k8s/configmap.yaml`
2. **Scale** - Increase replicas in deployment manifests
3. **Monitor** - Add Prometheus/Grafana for monitoring
4. **Domain** - Point your domain to the Elastic IP
5. **HTTPS** - Add Let's Encrypt for SSL

## 🎓 Learning Resources

- [AWS Free Tier Guide](https://aws.amazon.com/free/)
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Terraform Getting Started](https://learn.hashicorp.com/terraform)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 💡 Pro Tips

1. **Stop When Not Using**

   ```bash
   aws ec2 stop-instances --instance-ids <instance-id>
   # Start: aws ec2 start-instances --instance-ids <instance-id>
   ```

2. **Monitor Costs**

   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=2025-10-01,End=2025-10-31 \
     --granularity MONTHLY \
     --metrics "BlendedCost"
   ```

3. **Backup MongoDB**
   ```bash
   kubectl exec -n ticketer deployment/mongodb -- \
     mongodump --archive=/backup.gz --gzip
   kubectl cp ticketer/mongodb-xxx:/backup.gz ./backup.gz
   ```

---

**🎉 Congratulations! You've deployed a full microservices platform to AWS!**

For detailed documentation, see [DEVOPS.md](DEVOPS.md)
