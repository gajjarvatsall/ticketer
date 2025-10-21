#!/bin/bash
# Quick redeploy script with NodePort configuration

set -e

echo "🚀 Redeploying Ticketer with NodePort Configuration..."
echo ""

# Get current IP
cd terraform
INSTANCE_IP=$(terraform output -raw instance_public_ip)
echo "📍 Instance IP: $INSTANCE_IP"
cd ..

# Deploy the infrastructure
echo ""
echo "📦 Deploying Kubernetes manifests..."
./scripts/deploy.sh

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Access Points:"
echo "   Frontend:        http://$INSTANCE_IP:30080"
echo "   Auth Service:    http://$INSTANCE_IP:30081"
echo "   Event Service:   http://$INSTANCE_IP:30082"
echo "   Ticket Service:  http://$INSTANCE_IP:30083"
echo "   Payment Service: http://$INSTANCE_IP:30084"
echo "   MongoDB:         http://$INSTANCE_IP:30017"
echo ""
echo "📋 Service Communication:"
echo "   - All services use NodePort (30081-30084)"
echo "   - Frontend proxies API calls to backend services"
echo "   - Backend services communicate via external IP:NodePort"
echo ""
echo "🧪 Test Commands:"
echo "   curl http://$INSTANCE_IP:30081/health  # Auth service"
echo "   curl http://$INSTANCE_IP:30082/health  # Event service"
echo "   curl http://$INSTANCE_IP:30083/health  # Ticket service"
echo "   curl http://$INSTANCE_IP:30084/health  # Payment service"
echo ""
