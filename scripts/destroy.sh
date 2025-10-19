#!/bin/bash
set -e

echo "🗑️  Destroying Ticketer AWS Infrastructure..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Warning
echo -e "${RED}⚠️  WARNING: This will destroy ALL AWS resources created by Terraform!${NC}"
echo -e "${RED}   This includes:${NC}"
echo -e "${RED}   - EC2 instance${NC}"
echo -e "${RED}   - VPC and networking${NC}"
echo -e "${RED}   - Security groups${NC}"
echo -e "${RED}   - Elastic IP${NC}"
echo -e "${RED}   - ALL DATA will be lost!${NC}"
echo ""

read -p "Are you ABSOLUTELY sure you want to destroy everything? (type 'yes' to confirm): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Destruction cancelled."
    exit 0
fi

echo ""
read -p "Type 'destroy' to confirm again: " -r
if [[ ! $REPLY =~ ^destroy$ ]]; then
    echo "Destruction cancelled."
    exit 0
fi

# Change to terraform directory
cd terraform

# Check if terraform is initialized
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init
fi

# Destroy infrastructure
echo ""
echo -e "${GREEN}🔥 Destroying infrastructure...${NC}"
terraform destroy -auto-approve

echo ""
echo -e "${GREEN}✅ All AWS resources have been destroyed!${NC}"
echo ""
echo -e "${YELLOW}💰 Cost Impact:${NC}"
echo "   - No more charges will occur"
echo "   - Free tier usage has been freed up"
echo ""
echo -e "${YELLOW}📝 Cleanup tasks:${NC}"
echo "   - Remove kubeconfig: rm ~/.kube/config-ticketer"
echo "   - Remove terraform state: rm -rf terraform/.terraform terraform/terraform.tfstate*"
echo ""
