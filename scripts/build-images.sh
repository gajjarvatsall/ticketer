#!/bin/bash
set -e

echo "🐳 Building Docker images locally..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get GitHub username or use default
read -p "Enter your GitHub username (for image tagging): " GITHUB_USER
if [ -z "$GITHUB_USER" ]; then
    GITHUB_USER="yourusername"
fi

REGISTRY="ghcr.io"
TAG="${1:-latest}"

echo ""
echo -e "${GREEN}Building images with tag: $TAG${NC}"
echo ""

# Build all services
services=("auth" "event" "ticket" "payment" "frontend")

for service in "${services[@]}"; do
    echo -e "${YELLOW}📦 Building $service...${NC}"
    
    if [ "$service" = "frontend" ]; then
        docker build -t ${REGISTRY}/${GITHUB_USER}/ticketer-${service}:${TAG} -f Dockerfile.frontend .
    else
        docker build -t ${REGISTRY}/${GITHUB_USER}/ticketer-${service}:${TAG} ./${service}
    fi
    
    echo -e "${GREEN}✅ Built ${service}${NC}"
    echo ""
done

echo ""
echo -e "${GREEN}✅ All images built successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Built images:${NC}"
docker images | grep ticketer

echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Test locally:     docker-compose up"
echo "   2. Push to registry: ./scripts/push-images.sh"
echo "   3. Deploy to AWS:    ./scripts/deploy.sh"
echo ""
