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
if [ -z "$AUTO_APPROVE" ]; then
    read -p "Do you want to apply this plan? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
            echo "Deployment cancelled."
            exit 0
    fi
fi

echo ""
echo -e "${GREEN}🚀 Creating AWS infrastructure...${NC}"
if [ -n "$AUTO_APPROVE" ]; then
    terraform apply -auto-approve tfplan
else
    terraform apply tfplan
fi

# Get outputs
SERVER_IP=$(terraform output -raw instance_public_ip)
echo ""
echo -e "${GREEN}✅ Infrastructure created!${NC}"
echo -e "${GREEN}   Server IP: $SERVER_IP${NC}"

cd ..

########################################
# Step 3: Wait for SSH then MicroK8s     #
########################################
echo ""
KEY_NAME=$(grep key_name terraform/terraform.tfvars | cut -d'"' -f2)

if [ -z "$KEY_NAME" ]; then
        echo -e "${RED}❌ No key pair configured. Cannot access server.${NC}"
        exit 1
fi

echo -e "${YELLOW}⏳ Waiting for SSH on ${SERVER_IP} (port 22)...${NC}"
SSH_ATTEMPTS=60
for i in $(seq 1 $SSH_ATTEMPTS); do
    if ssh -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes ubuntu@${SERVER_IP} 'echo ok' >/dev/null 2>&1; then
        break
    fi
    echo "Waiting for SSH (attempt $i/$SSH_ATTEMPTS)..."
    sleep 5
done

if ! ssh -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes ubuntu@${SERVER_IP} 'echo ok' >/dev/null 2>&1; then
    echo -e "${RED}❌ SSH is not reachable on $SERVER_IP:22. Check security group, key pair, or instance health.${NC}"
    echo -e "${YELLOW}Tip:${NC} Try: aws ec2 describe-instances to confirm state and IP, and verify your key name in terraform/terraform.tfvars."
    exit 1
fi

echo -e "${YELLOW}⏳ Waiting for MicroK8s to be ready on the instance...${NC}"
# Poll the instance until microk8s is ready and kubeconfig is present (max ~8 minutes)
ATTEMPTS=96
SLEEP_SECONDS=5
READY=false
for i in $(seq 1 $ATTEMPTS); do
    # Check microk8s readiness and kubeconfig existence remotely
    if ssh -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@${SERVER_IP} \
        'microk8s status --wait-ready >/dev/null 2>&1 && test -f /home/ubuntu/.kube/config'; then
        READY=true
        break
    fi
    echo "Waiting for MicroK8s (attempt $i/$ATTEMPTS)..."
    sleep $SLEEP_SECONDS
done

if [ "$READY" != true ]; then
    echo -e "${RED}❌ MicroK8s did not become ready in time. Fetching diagnostics...${NC}"
    ssh -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${SERVER_IP} 'microk8s status || true; sudo tail -n 200 /var/log/user-data.log || true' || true
    exit 1
fi

########################################
# Step 4: Prepare tunnel and kubeconfig  #
########################################
echo ""
echo -e "${GREEN}🔌 Starting SSH tunnel for Kubernetes API (local -> 127.0.0.1:16443)...${NC}"

# Find a free local port starting from 16443
find_free_port() {
    local start=${1:-16443}
    local end=${2:-16543}
    for p in $(seq $start $end); do
        if ! lsof -iTCP -sTCP:LISTEN -nP 2>/dev/null | grep -q ":$p "; then
            echo $p
            return 0
        fi
    done
    return 1
}

TUNNEL_PORT=${KUBE_TUNNEL_PORT:-16443}
if lsof -iTCP -sTCP:LISTEN -nP 2>/dev/null | grep -q ":$TUNNEL_PORT "; then
    ALT_PORT=$(find_free_port 16443 16543 || true)
    if [ -n "$ALT_PORT" ]; then
        TUNNEL_PORT=$ALT_PORT
    fi
fi

echo -e "${YELLOW}Using local tunnel port: ${TUNNEL_PORT}${NC}"

# Start SSH tunnel with ExitOnForwardFailure to fail fast if the port is busy
ssh -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -f -N -L ${TUNNEL_PORT}:127.0.0.1:16443 ubuntu@${SERVER_IP} || true

# Wait briefly for tunnel to become active
for i in $(seq 1 10); do
    if nc -z 127.0.0.1 ${TUNNEL_PORT} 2>/dev/null; then
        break
    fi
    sleep 1
done

echo -e "${GREEN}📥 Fetching kubeconfig from server...${NC}"

mkdir -p ~/.kube
scp -i ~/.ssh/${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${SERVER_IP}:/home/ubuntu/.kube/config ~/.kube/config-ticketer
export KUBECONFIG=~/.kube/config-ticketer

# Point kubeconfig to local tunnel (avoids TLS SAN issues entirely)
sed -i.bak "s#server: https://.*#server: https://127.0.0.1:${TUNNEL_PORT}#g" ~/.kube/config-ticketer || true

# Step 5: Verify k8s cluster
echo ""
echo -e "${GREEN}🔍 Verifying Kubernetes cluster (via SSH tunnel on port ${TUNNEL_PORT})...${NC}"
kubectl --request-timeout=60s get nodes

########################################
# Step 6-7: Render manifests dynamically
########################################
echo ""
echo -e "${GREEN}📝 Rendering manifests with external IP and registry user...${NC}"

# Default GitHub user from env or provided value
GITHUB_USER=${GITHUB_USER:-gajjarvatsall}
TMP_DIR=$(mktemp -d)
cp k8s/*.yaml "$TMP_DIR"/

# Substitute dynamic values into temp copies only
sed -i.bak "s/EXTERNAL_IP/$SERVER_IP/g" "$TMP_DIR"/configmap.yaml || true
for file in "$TMP_DIR"/*.yaml; do
    sed -i.bak "s|ghcr.io/USERNAME|ghcr.io/${GITHUB_USER}|g" "$file" || true
done

# Step 8: Deploy to Kubernetes
echo ""
echo -e "${GREEN}☸️  Deploying to Kubernetes...${NC}"

# Helper: kubectl apply with retries (handles transient InternalError/timeout)
apply_retry() {
    local file="$1"
    local tries=${2:-8}
    local delay=3
    local attempt=1
    while true; do
        if kubectl apply -f "$file"; then
            return 0
        fi
        if [ $attempt -ge $tries ]; then
            echo -e "${RED}❌ Failed to apply $file after $tries attempts${NC}"
            return 1
        fi
        echo -e "${YELLOW}⏳ kubectl apply failed for $file (attempt $attempt/$tries). Retrying in ${delay}s...${NC}"
        sleep $delay
        attempt=$((attempt+1))
        delay=$((delay*2))
        if [ $delay -gt 30 ]; then delay=30; fi
    done
}

apply_retry "$TMP_DIR/namespace.yaml"

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
apply_retry "$TMP_DIR/configmap.yaml"
apply_retry "$TMP_DIR/mongodb.yaml"
apply_retry "$TMP_DIR/auth-service.yaml"
apply_retry "$TMP_DIR/services.yaml"
apply_retry "$TMP_DIR/frontend.yaml"
apply_retry "$TMP_DIR/ingress.yaml"

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

# Cleanup temp dir
if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
fi
