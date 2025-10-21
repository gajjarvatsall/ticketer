# Automatic IP Configuration - Zero Manual Changes Required

## How It Works

Your infrastructure is now configured to **automatically adapt to IP changes** after every destroy/redeploy cycle with **ZERO manual intervention**.

### The Magic 🪄

1. **Deploy Script Intelligence**
   - `scripts/deploy.sh` automatically gets the new IP from Terraform
   - Replaces all `EXTERNAL_IP` placeholders in manifests
   - Applies everything with the correct IP

2. **Template-Based Configuration**
   - `k8s/configmap.yaml` uses `EXTERNAL_IP` as a placeholder
   - Deploy script replaces it with actual IP before applying
   - All services get correct NodePort URLs automatically

3. **EC2 User Data**
   - Instance fetches its own public IP from AWS metadata service
   - Waits for Elastic IP to stabilize
   - MicroK8s installs with correct configuration

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. terraform apply                                           │
│    → Creates EC2 with new Elastic IP                        │
│    → Outputs: instance_public_ip = "X.X.X.X"               │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. scripts/deploy.sh                                         │
│    → Gets IP: SERVER_IP=$(terraform output ...)             │
│    → Copies k8s/*.yaml to temp directory                    │
│    → Replaces: sed "s/EXTERNAL_IP/$SERVER_IP/g"            │
│    → Applies manifests with actual IP                       │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Kubernetes applies ConfigMap                             │
│    AUTH_SERVICE_URL: "http://X.X.X.X:30081"                │
│    EVENT_SERVICE_URL: "http://X.X.X.X:30082"               │
│    TICKET_SERVICE_URL: "http://X.X.X.X:30083"              │
│    PAYMENT_SERVICE_URL: "http://X.X.X.X:30084"             │
│    FRONTEND_URL: "http://X.X.X.X:30080"                    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. All pods start with correct configuration                │
│    ✅ Services communicate via NodePort                     │
│    ✅ Frontend serves from correct URL                      │
│    ✅ CORS allows correct origin                            │
└─────────────────────────────────────────────────────────────┘
```

## Complete Destroy & Redeploy Workflow

### Destroy Everything:

```bash
cd ~/ticketer/terraform
terraform destroy -auto-approve
```

### Redeploy Everything (Automatic IP Configuration):

```bash
cd ~/ticketer
./redeploy.sh
```

OR manually:

```bash
# 1. Create infrastructure
cd ~/ticketer/terraform
terraform apply -auto-approve

# 2. Deploy application (auto-configures with new IP)
cd ~/ticketer/scripts
./deploy.sh
```

That's it! **No manual IP updates needed anywhere!**

## What Gets Replaced Automatically

### ConfigMap (k8s/configmap.yaml)

**Template:**

```yaml
AUTH_SERVICE_URL: "http://EXTERNAL_IP:30081"
```

**After deploy script:**

```yaml
AUTH_SERVICE_URL: "http://3.221.128.200:30081" # ← Auto-replaced!
```

### All Occurrences

The deploy script replaces `EXTERNAL_IP` in:

- `k8s/configmap.yaml` - Backend service URLs
- Any other manifests that use the placeholder

## File Configuration

### ✅ k8s/configmap.yaml (Template)

```yaml
data:
  AUTH_SERVICE_URL: "http://EXTERNAL_IP:30081"
  EVENT_SERVICE_URL: "http://EXTERNAL_IP:30082"
  TICKET_SERVICE_URL: "http://EXTERNAL_IP:30083"
  PAYMENT_SERVICE_URL: "http://EXTERNAL_IP:30084"
  FRONTEND_URL: "http://EXTERNAL_IP:30080"
```

- Uses `EXTERNAL_IP` placeholder
- Gets replaced during deployment
- **Never hardcode IPs here!**

### ✅ scripts/deploy.sh (Smart Deployment)

```bash
# Line 71: Gets current IP
SERVER_IP=$(terraform output -raw instance_public_ip)

# Line 193: Replaces placeholder
sed -i.bak "s/EXTERNAL_IP/$SERVER_IP/g" "$TMP_DIR"/configmap.yaml
```

- Automatically pulls new IP from Terraform
- Replaces all placeholders
- **No manual intervention needed!**

### ✅ All Service Manifests (NodePort)

```yaml
spec:
  type: NodePort
  ports:
    - port: 3001
      targetPort: 3001
      nodePort: 30081 # ← Fixed port, never changes
```

- NodePort numbers are fixed (30081-30084, 30080)
- Only the IP address changes
- **Ports remain constant!**

## Why This Works

### 1. Elastic IP (Terraform)

```hcl
resource "aws_eip" "k3s_server" {
  instance = aws_instance.k3s_server.id
  domain   = "vpc"
}
```

- AWS assigns a new public IP each time
- Terraform tracks it and outputs it
- Deploy script reads it automatically

### 2. Template Pattern

- ConfigMap uses `EXTERNAL_IP` as placeholder
- Deploy script performs string replacement
- Applied manifests have actual IP

### 3. NodePort Stability

- NodePort numbers (30081, 30082, etc.) never change
- Only the host IP changes
- Internal cluster DNS still works for pod-to-pod

## Testing the Auto-Configuration

### After Any Redeploy:

```bash
# 1. Check what IP was configured
cd ~/ticketer/terraform
terraform output instance_public_ip

# 2. SSH to instance
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(terraform output -raw instance_public_ip)

# 3. Check ConfigMap has correct IP
microk8s kubectl get configmap app-config -n ticketer -o yaml | grep SERVICE_URL

# You should see the current IP, not EXTERNAL_IP or old IP!
```

### Expected Output:

```yaml
AUTH_SERVICE_URL: "http://3.221.128.200:30081"   # ← Current IP
EVENT_SERVICE_URL: "http://3.221.128.200:30082"  # ← Current IP
TICKET_SERVICE_URL: "http://3.221.128.200:30083" # ← Current IP
PAYMENT_SERVICE_URL: "http://3.221.128.200:30084"# ← Current IP
FRONTEND_URL: "http://3.221.128.200:30080"       # ← Current IP
```

## Troubleshooting

### If You See EXTERNAL_IP in ConfigMap:

**Problem:** Deploy script didn't replace the placeholder

**Solution:**

```bash
# Run deploy script again
cd ~/ticketer/scripts
./deploy.sh
```

### If Services Can't Communicate:

**Check 1:** Verify ConfigMap has actual IP (not EXTERNAL_IP)

```bash
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl get configmap app-config -n ticketer -o yaml'
```

**Check 2:** Restart deployments to pick up config

```bash
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl rollout restart deployment -n ticketer'
```

## The Beauty of This Setup

✅ **Destroy** → Changes IP  
✅ **Apply** → Terraform creates with new IP  
✅ **Deploy** → Script automatically configures new IP  
✅ **Done** → Everything works with zero manual changes

### You Never Need To:

❌ Edit configmap.yaml manually  
❌ Update IP addresses anywhere  
❌ Modify any configuration files  
❌ Remember the new IP

### You Only Need To:

✅ Run `./redeploy.sh` or `./scripts/deploy.sh`  
✅ That's it! 🎉

## Complete Redeploy Commands

### Quick Redeploy (Everything):

```bash
cd ~/ticketer

# Destroy old infrastructure
cd terraform
terraform destroy -auto-approve

# Deploy new infrastructure + application
cd ..
./redeploy.sh
```

### Manual Step-by-Step:

```bash
# 1. Destroy
cd ~/ticketer/terraform
terraform destroy -auto-approve

# 2. Create infrastructure
terraform apply -auto-approve

# 3. Deploy application (auto-configures IP)
cd ~/ticketer/scripts
./deploy.sh

# 4. Get new URL
NEW_IP=$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip)
echo "Application: http://$NEW_IP:30080"
```

## Summary

Your setup is now **fully automated**:

1. **ConfigMap template** uses `EXTERNAL_IP` placeholder
2. **Deploy script** gets real IP from Terraform
3. **Deploy script** replaces placeholder before applying
4. **All services** configured with correct IP automatically
5. **Zero manual changes** required after destroy/redeploy

**Just run `./redeploy.sh` and everything works!** 🚀
