#!/bin/bash
# This script runs on the EC2 instance to update ConfigMap with its own public IP
# It's called from the user-data script after MicroK8s is ready

set -e

echo "[update-configmap] Getting instance public IP from metadata service..."
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "[update-configmap] Public IP: $PUBLIC_IP"

# Create the configmap with the actual public IP
cat > /tmp/app-config.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: ticketer
data:
  MONGODB_URI_BASE: "mongodb://admin:PASSWORD@mongodb:27017"
  # Using NodePort URLs with actual public IP for service communication
  AUTH_SERVICE_URL: "http://${PUBLIC_IP}:30081"
  EVENT_SERVICE_URL: "http://${PUBLIC_IP}:30082"
  TICKET_SERVICE_URL: "http://${PUBLIC_IP}:30083"
  PAYMENT_SERVICE_URL: "http://${PUBLIC_IP}:30084"
  NODE_ENV: "production"
  FRONTEND_URL: "http://${PUBLIC_IP}:30080"
EOF

echo "[update-configmap] ConfigMap created with IP: $PUBLIC_IP"
cat /tmp/app-config.yaml

# Apply it if ticketer namespace exists
if microk8s kubectl get namespace ticketer >/dev/null 2>&1; then
  echo "[update-configmap] Applying ConfigMap to cluster..."
  microk8s kubectl apply -f /tmp/app-config.yaml
  
  # Restart deployments to pick up new config
  echo "[update-configmap] Restarting deployments to pick up new config..."
  microk8s kubectl rollout restart deployment -n ticketer || true
  
  echo "[update-configmap] ✅ ConfigMap updated successfully!"
else
  echo "[update-configmap] ⚠️  Namespace 'ticketer' not found yet. ConfigMap will be applied during deployment."
fi
