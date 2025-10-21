#!/bin/bash
set -e

echo "🐳 Building and pushing Docker images for amd64 (x86_64)..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

GITHUB_USER="gajjarvatsall"
REGISTRY="ghcr.io"
TAG="latest"
PLATFORM="linux/amd64"

echo -e "${YELLOW}📋 Building for platform: ${PLATFORM}${NC}"
echo ""

# Get GitHub token
echo -e "${YELLOW}Enter your GitHub Personal Access Token:${NC}"
read -sp "Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ GitHub token is required${NC}"
    exit 1
fi

# Login to GitHub Container Registry
echo ""
echo -e "${GREEN}🔐 Logging in to GitHub Container Registry...${NC}"
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Services to build
services=("auth" "event" "ticket" "payment")

echo ""
echo -e "${GREEN}Building and pushing microservices...${NC}"
echo ""

for service in "${services[@]}"; do
    IMAGE="${REGISTRY}/${GITHUB_USER}/ticketer-${service}:${TAG}"
    echo -e "${YELLOW}🔨 Building ${service} for ${PLATFORM}...${NC}"
    
    docker buildx build \
        --platform ${PLATFORM} \
        --push \
        -t ${IMAGE} \
        ./${service}
    
    echo -e "${GREEN}✅ Built and pushed ${service}${NC}"
    echo ""
done

# Build frontend separately (uses Dockerfile.frontend at root)
echo -e "${YELLOW}🔨 Building frontend for ${PLATFORM}...${NC}"
IMAGE="${REGISTRY}/${GITHUB_USER}/ticketer-frontend:${TAG}"

docker buildx build \
    --platform ${PLATFORM} \
    --push \
    -t ${IMAGE} \
    -f Dockerfile.frontend \
    .

echo -e "${GREEN}✅ Built and pushed frontend${NC}"
echo ""

echo ""
echo -e "${GREEN}🎉 All images built and pushed successfully for ${PLATFORM}!${NC}"
echo ""
echo -e "${YELLOW}📋 Images pushed:${NC}"
for service in "${services[@]}" "frontend"; do
    echo "   ${REGISTRY}/${GITHUB_USER}/ticketer-${service}:${TAG}"
done

echo ""
echo -e "${YELLOW}💡 Next step: Restart pods on Kubernetes to pull new images${NC}"
echo "   kubectl rollout restart deployment -n ticketer"
