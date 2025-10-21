#!/bin/bash
set -e

echo "🔨 Rebuilding ALL services with fixes..."
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Build and push auth service
echo "📦 Building auth-service..."
docker buildx build --platform linux/amd64 \
  -t ghcr.io/gajjarvatsall/ticketer-auth:latest \
  -f auth/Dockerfile \
  --push \
  ./auth

# Build and push event service  
echo "📦 Building event-service..."
docker buildx build --platform linux/amd64 \
  -t ghcr.io/gajjarvatsall/ticketer-event:latest \
  -f event/Dockerfile \
  --push \
  ./event

# Build and push ticket service
echo "📦 Building ticket-service..."
docker buildx build --platform linux/amd64 \
  -t ghcr.io/gajjarvatsall/ticketer-ticket:latest \
  -f ticket/Dockerfile \
  --push \
  ./ticket

# Build and push payment service
echo "📦 Building payment-service..."
docker buildx build --platform linux/amd64 \
  -t ghcr.io/gajjarvatsall/ticketer-payment:latest \
  -f payment/Dockerfile \
  --push \
  ./payment

# Build and push frontend
echo "📦 Building frontend..."
docker buildx build --platform linux/amd64 \
  -t ghcr.io/gajjarvatsall/ticketer-frontend:latest \
  -f Dockerfile \
  --push \
  .

echo ""
echo "✅ All services rebuilt and pushed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: cd terraform && terraform output -raw instance_public_ip"
echo "2. Run: ssh -i ~/.ssh/devopsassignment.pem ubuntu@<IP> 'microk8s kubectl rollout restart deployment -n ticketer'"
echo ""
