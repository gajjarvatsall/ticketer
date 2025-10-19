#!/bin/bash
set -e

echo "📤 Pushing Docker images to GitHub Container Registry..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USER
if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}❌ GitHub username is required${NC}"
    exit 1
fi

# GitHub Personal Access Token
echo ""
echo -e "${YELLOW}You need a GitHub Personal Access Token with 'write:packages' permission${NC}"
echo -e "${YELLOW}Create one at: https://github.com/settings/tokens/new${NC}"
echo ""
read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ GitHub token is required${NC}"
    exit 1
fi

REGISTRY="ghcr.io"
TAG="${1:-latest}"

# Login to GitHub Container Registry
echo ""
echo -e "${GREEN}🔐 Logging in to GitHub Container Registry...${NC}"
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

# Push all services
services=("auth" "event" "ticket" "payment" "frontend")

echo ""
for service in "${services[@]}"; do
    IMAGE="${REGISTRY}/${GITHUB_USER}/ticketer-${service}:${TAG}"
    echo -e "${YELLOW}📤 Pushing ${service}...${NC}"
    docker push $IMAGE
    echo -e "${GREEN}✅ Pushed ${service}${NC}"
    echo ""
done

echo ""
echo -e "${GREEN}✅ All images pushed successfully!${NC}"
echo ""
echo -e "${YELLOW}📦 Images available at:${NC}"
echo "   https://github.com/${GITHUB_USER}?tab=packages"
echo ""
echo -e "${YELLOW}💡 Next step:${NC}"
echo "   Deploy to AWS: ./scripts/deploy.sh"
echo ""
