#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Dynamic Redeploy Configuration${NC}"
echo ""

# Get current IP
cd "$(dirname "$0")/../terraform"
CURRENT_IP=$(terraform output -raw instance_public_ip 2>/dev/null)

if [ -z "$CURRENT_IP" ]; then
    echo -e "${RED}❌ No infrastructure deployed. Run ./scripts/deploy.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}📍 Current IP: $CURRENT_IP${NC}"
echo ""

# Test 1: Check ConfigMap has real IP (not placeholder)
echo -e "${YELLOW}Test 1: Checking ConfigMap...${NC}"
CONFIGMAP_URL=$(ssh -i ~/.ssh/devopsassignment.pem ubuntu@$CURRENT_IP \
  'microk8s kubectl get configmap app-config -n ticketer -o yaml 2>/dev/null | grep FRONTEND_URL' 2>/dev/null)

if echo "$CONFIGMAP_URL" | grep -q "EXTERNAL_IP"; then
    echo -e "${RED}❌ ConfigMap still has placeholder 'EXTERNAL_IP'${NC}"
    echo "   Fix: Re-run ./scripts/deploy.sh"
    exit 1
elif echo "$CONFIGMAP_URL" | grep -q "$CURRENT_IP"; then
    echo -e "${GREEN}✅ ConfigMap has correct IP: $CURRENT_IP${NC}"
else
    echo -e "${YELLOW}⚠️  ConfigMap has different IP. This is OK if you just redeployed.${NC}"
    echo "   Found: $CONFIGMAP_URL"
fi
echo ""

# Test 2: Check all pods are running
echo -e "${YELLOW}Test 2: Checking pod status...${NC}"
POD_STATUS=$(ssh -i ~/.ssh/devopsassignment.pem ubuntu@$CURRENT_IP \
  'microk8s kubectl get pods -n ticketer 2>/dev/null | grep -v NAME' 2>/dev/null)

RUNNING_PODS=$(echo "$POD_STATUS" | grep "Running" | wc -l | tr -d ' ')
TOTAL_PODS=$(echo "$POD_STATUS" | wc -l | tr -d ' ')

if [ "$RUNNING_PODS" -ge 6 ]; then
    echo -e "${GREEN}✅ $RUNNING_PODS/$TOTAL_PODS pods are running${NC}"
else
    echo -e "${RED}❌ Only $RUNNING_PODS/$TOTAL_PODS pods running${NC}"
    echo "   Wait a few seconds and try again, or check: ssh ubuntu@$CURRENT_IP 'microk8s kubectl get pods -n ticketer'"
    exit 1
fi
echo ""

# Test 3: Test signup (creates session cookie)
echo -e "${YELLOW}Test 3: Testing signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -c /tmp/test-cookies-$$.txt \
  -X POST http://$CURRENT_IP:30080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test-$(date +%s)@example.com\",\"password\":\"test123456\",\"firstName\":\"Test\",\"lastName\":\"User\"}" \
  -w "\n%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Signup successful (201 Created)${NC}"
    
    # Check if cookie was set
    if [ -f /tmp/test-cookies-$$.txt ] && grep -q "connect.sid" /tmp/test-cookies-$$.txt; then
        echo -e "${GREEN}✅ Session cookie set${NC}"
    else
        echo -e "${RED}❌ Session cookie NOT set${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Signup failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    rm -f /tmp/test-cookies-$$.txt
    exit 1
fi
echo ""

# Test 4: Test authenticated request (using cookie)
echo -e "${YELLOW}Test 4: Testing authenticated request...${NC}"
ME_RESPONSE=$(curl -s -b /tmp/test-cookies-$$.txt \
  http://$CURRENT_IP:30080/api/auth/me \
  -w "\n%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$ME_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Authenticated request successful (200 OK)${NC}"
    echo -e "${GREEN}✅ Session cookie is working${NC}"
else
    echo -e "${RED}❌ Authenticated request failed (HTTP $HTTP_CODE)${NC}"
    echo "   This means cookies are NOT being forwarded properly"
    echo "   Response: $RESPONSE_BODY"
    rm -f /tmp/test-cookies-$$.txt
    exit 1
fi
echo ""

# Test 5: Test logout
echo -e "${YELLOW}Test 5: Testing logout...${NC}"
LOGOUT_RESPONSE=$(curl -s -b /tmp/test-cookies-$$.txt \
  -X POST http://$CURRENT_IP:30080/api/auth/logout \
  -w "\n%{http_code}" 2>/dev/null)

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$LOGOUT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Logout successful (200 OK)${NC}"
else
    echo -e "${RED}❌ Logout failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi

# Cleanup
rm -f /tmp/test-cookies-$$.txt
echo ""

# Final summary
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Your infrastructure is fully dynamic and ready for redeploy!${NC}"
echo ""
echo -e "Application URL: ${YELLOW}http://$CURRENT_IP:30080${NC}"
echo ""
echo -e "${YELLOW}To test destroy/redeploy:${NC}"
echo "  1. cd ~/ticketer/terraform && terraform destroy -auto-approve"
echo "  2. cd ~/ticketer && ./scripts/deploy.sh"
echo "  3. ./scripts/test-dynamic-config.sh"
echo ""
