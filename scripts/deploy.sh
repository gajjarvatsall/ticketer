#!/bin/bash
set -e

echo "🚀 Deploying Ticketer to AWS..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}❌ Terraform is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}❌ kubectl is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}❌ AWS CLI is required but not installed. Aborting.${NC}" >&2; exit 1; }

# Check AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Step 1: Create terraform.tfvars if it doesn't exist
if [ ! -f "terraform/terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars not found. Creating template...${NC}"
    cat > terraform/terraform.tfvars <<EOF
aws_region = "us-east-1"
environment = "production"
project_name = "ticketer"
instance_type = "t2.micro"
key_name = "" # Add your EC2 key pair name here
mongodb_root_password = "$(openssl rand -base64 32)"
session_secret = "$(openssl rand -base64 32)"
EOF
    echo -e "${YELLOW}📝 Please edit terraform/terraform.tfvars and add your EC2 key pair name${NC}"
    echo -e "${YELLOW}   Then run this script again.${NC}"
    exit 0
fi

# Step 2: Initialize and apply Terraform
echo -e "${GREEN}📦 Initializing Terraform...${NC}"
cd terraform
terraform init

echo ""
echo -e "${GREEN}🏗️  Planning infrastructure...${NC}"
terraform plan -out=tfplan

echo ""
read -p "Do you want to apply this plan? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Creating AWS infrastructure...${NC}"
terraform apply tfplan

# Get outputs
SERVER_IP=$(terraform output -raw instance_public_ip)
echo ""
echo -e "${GREEN}✅ Infrastructure created!${NC}"
echo -e "${GREEN}   Server IP: $SERVER_IP${NC}"

cd ..

# Step 3: Wait for instance to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for instance to be ready (this may take 2-3 minutes)...${NC}"
sleep 120

# Step 4: Get kubeconfig
echo ""
echo -e "${GREEN}📥 Fetching kubeconfig...${NC}"
KEY_NAME=$(grep key_name terraform/terraform.tfvars | cut -d'"' -f2)

if [ -z "$KEY_NAME" ]; then
    echo -e "${RED}❌ No key pair configured. Cannot access server.${NC}"
    exit 1
fi

mkdir -p ~/.kube
scp -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${SERVER_IP}:/home/ubuntu/.kube/config ~/.kube/config-ticketer
export KUBECONFIG=~/.kube/config-ticketer
sed -i.bak "s/127.0.0.1/$SERVER_IP/g" ~/.kube/config-ticketer

# Step 5: Verify k8s cluster
echo ""
echo -e "${GREEN}🔍 Verifying Kubernetes cluster...${NC}"
kubectl get nodes

# Step 6: Update ConfigMap with external IP
echo ""
echo -e "${GREEN}📝 Updating configuration with external IP...${NC}"
sed -i.bak "s/EXTERNAL_IP/$SERVER_IP/g" k8s/configmap.yaml

# Step 7: Update image references (replace USERNAME with your GitHub username)
echo ""
read -p "Enter your GitHub username: " GITHUB_USER
for file in k8s/*.yaml; do
    sed -i.bak "s|ghcr.io/USERNAME|ghcr.io/${GITHUB_USER}|g" "$file"
done

# Step 8: Deploy to Kubernetes
echo ""
echo -e "${GREEN}☸️  Deploying to Kubernetes...${NC}"

kubectl apply -f k8s/namespace.yaml

# Create secrets
MONGO_PASSWORD=$(grep mongodb_root_password terraform/terraform.tfvars | cut -d'"' -f2)
SESSION_SECRET=$(grep session_secret terraform/terraform.tfvars | cut -d'"' -f2)

kubectl create secret generic mongodb-credentials \
    --from-literal=root-password="$MONGO_PASSWORD" \
    --namespace=ticketer \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic app-secrets \
    --from-literal=session-secret="$SESSION_SECRET" \
    --namespace=ticketer \
    --dry-run=client -o yaml | kubectl apply -f -

# Apply all manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# Step 9: Wait for deployments
echo ""
echo -e "${GREEN}⏳ Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=5m deployment/mongodb -n ticketer || true
kubectl wait --for=condition=available --timeout=5m deployment/auth-service -n ticketer || true
kubectl wait --for=condition=available --timeout=5m deployment/event-service -n ticketer || true
kubectl wait --for=condition=available --timeout=5m deployment/ticket-service -n ticketer || true
kubectl wait --for=condition=available --timeout=5m deployment/payment-service -n ticketer || true
kubectl wait --for=condition=available --timeout=5m deployment/frontend -n ticketer || true

# Step 10: Show status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📊 Deployment Information${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "🌐 Application URL:  ${GREEN}http://$SERVER_IP:30080${NC}"
echo -e "🔑 SSH Access:       ${GREEN}ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@$SERVER_IP${NC}"
echo -e "☸️  Kubeconfig:       ${GREEN}export KUBECONFIG=~/.kube/config-ticketer${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo "   kubectl get all -n ticketer              # View all resources"
echo "   kubectl logs -f deployment/auth-service -n ticketer  # View logs"
echo "   kubectl describe pod <pod-name> -n ticketer         # Debug pod"
echo ""
echo -e "${YELLOW}🗑️  To destroy everything:${NC}"
echo "   ./scripts/destroy.sh"
echo ""
