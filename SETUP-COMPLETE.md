# ✅ COMPLETE SETUP - NO MANUAL IP CHANGES REQUIRED

## 🎉 Your Infrastructure is Fully Automated!

Every time you destroy and redeploy, the system automatically configures itself with the new IP address. **Zero manual intervention required!**

---

## Quick Reference

### 🔄 Complete Redeploy Workflow

```bash
# ONE COMMAND TO RULE THEM ALL
cd ~/ticketer && ./redeploy.sh
```

That's it! The script will:

1. ✅ Get the current public IP from Terraform
2. ✅ Replace `EXTERNAL_IP` in all manifests
3. ✅ Deploy with correct NodePort configuration
4. ✅ All services communicate properly

---

## 📋 Service Configuration (Automatic)

| Component    | Port  | NodePort | Auto-Configured URL      |
| ------------ | ----- | -------- | ------------------------ |
| Frontend     | 80    | 30080    | `http://<AUTO_IP>:30080` |
| Auth API     | 3001  | 30081    | `http://<AUTO_IP>:30081` |
| Events API   | 3002  | 30082    | `http://<AUTO_IP>:30082` |
| Tickets API  | 3003  | 30083    | `http://<AUTO_IP>:30083` |
| Payments API | 3004  | 30084    | `http://<AUTO_IP>:30084` |
| MongoDB      | 27017 | 30017    | `http://<AUTO_IP>:30017` |

**`<AUTO_IP>`** is automatically fetched and replaced by the deploy script!

---

## 🔧 How It Works

### 1. Template-Based ConfigMap

**File:** `k8s/configmap.yaml`

```yaml
data:
  AUTH_SERVICE_URL: "http://EXTERNAL_IP:30081" # ← Placeholder
  EVENT_SERVICE_URL: "http://EXTERNAL_IP:30082" # ← Placeholder
  TICKET_SERVICE_URL: "http://EXTERNAL_IP:30083" # ← Placeholder
  PAYMENT_SERVICE_URL: "http://EXTERNAL_IP:30084" # ← Placeholder
  FRONTEND_URL: "http://EXTERNAL_IP:30080" # ← Placeholder
```

### 2. Deploy Script Intelligence

**File:** `scripts/deploy.sh`

```bash
# Line 71: Fetch current IP from Terraform
SERVER_IP=$(terraform output -raw instance_public_ip)

# Line 193: Replace placeholder with actual IP
sed -i.bak "s/EXTERNAL_IP/$SERVER_IP/g" "$TMP_DIR"/configmap.yaml
```

### 3. Applied ConfigMap (After Deployment)

```yaml
data:
  AUTH_SERVICE_URL: "http://3.221.128.200:30081" # ← Real IP!
  EVENT_SERVICE_URL: "http://3.221.128.200:30082" # ← Real IP!
  TICKET_SERVICE_URL: "http://3.221.128.200:30083" # ← Real IP!
  PAYMENT_SERVICE_URL: "http://3.221.128.200:30084" # ← Real IP!
  FRONTEND_URL: "http://3.221.128.200:30080" # ← Real IP!
```

---

## 🚀 Deployment Commands

### Option 1: Use Redeploy Script (Recommended)

```bash
cd ~/ticketer
./redeploy.sh
```

### Option 2: Manual Deployment

```bash
# Step 1: Create/Update Infrastructure
cd ~/ticketer/terraform
terraform apply -auto-approve

# Step 2: Deploy Application (auto-configures IP)
cd ~/ticketer/scripts
./deploy.sh
```

### Option 3: Destroy & Redeploy

```bash
# Destroy old infrastructure
cd ~/ticketer/terraform
terraform destroy -auto-approve

# Deploy new infrastructure + application
cd ~/ticketer
./redeploy.sh
```

---

## ✨ What's Automated

✅ **IP Address Extraction** - From Terraform outputs  
✅ **Template Rendering** - `EXTERNAL_IP` → Real IP  
✅ **ConfigMap Generation** - With correct service URLs  
✅ **Manifest Application** - All YAML files deployed  
✅ **Service Discovery** - NodePort with dynamic IPs  
✅ **CORS Configuration** - Frontend URL auto-updated

---

## 🎯 What You Never Have To Do

❌ Manually edit `configmap.yaml` with new IPs  
❌ Update service URLs in any file  
❌ SSH to server and patch ConfigMaps  
❌ Remember what the current IP is  
❌ Restart services manually after IP changes

---

## 🧪 Verification Steps

### After Deployment, Verify Configuration:

```bash
# 1. Get current IP
cd ~/ticketer/terraform
CURRENT_IP=$(terraform output -raw instance_public_ip)
echo "Current IP: $CURRENT_IP"

# 2. Check ConfigMap has correct IP (not EXTERNAL_IP)
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$CURRENT_IP \
  'microk8s kubectl get configmap app-config -n ticketer -o yaml | grep SERVICE_URL'

# Expected output (with actual IP, not EXTERNAL_IP):
# AUTH_SERVICE_URL: http://3.221.128.200:30081
# EVENT_SERVICE_URL: http://3.221.128.200:30082
# ...

# 3. Test frontend
curl http://$CURRENT_IP:30080

# 4. Test auth service
curl http://$CURRENT_IP:30081/health

# 5. Open in browser
echo "Open: http://$CURRENT_IP:30080"
```

---

## 📁 Key Files

| File                         | Purpose                                  | Manual Edits? |
| ---------------------------- | ---------------------------------------- | ------------- |
| `k8s/configmap.yaml`         | Template with `EXTERNAL_IP` placeholder  | ❌ Never      |
| `scripts/deploy.sh`          | Replaces placeholders, deploys manifests | ❌ No need    |
| `redeploy.sh`                | One-command full deployment              | ❌ No need    |
| `terraform/terraform.tfvars` | Your AWS settings (region, key, etc)     | ✅ Once only  |

---

## 🔄 Typical Workflow

### Day 1: Initial Setup

```bash
cd ~/ticketer
# Edit terraform/terraform.tfvars with your key_name
./redeploy.sh
# Done! Application running at http://<IP>:30080
```

### Day 2: Make Code Changes

```bash
# Build and push new Docker images
./scripts/build-push-amd64.sh

# Redeploy (gets same IP if infrastructure unchanged)
./scripts/deploy.sh
```

### Day 3: Destroy & Recreate (New IP)

```bash
cd ~/ticketer/terraform
terraform destroy -auto-approve

# Redeploy with NEW IP (automatic configuration!)
cd ~/ticketer
./redeploy.sh

# Application running at http://<NEW_IP>:30080
# All services auto-configured with new IP!
```

---

## 🛡️ Architecture Decisions

### Why NodePort + External IP?

- ✅ **Simple**: No Ingress controllers needed
- ✅ **Debuggable**: Direct access to each service
- ✅ **Reliable**: No DNS or proxy issues
- ✅ **Free Tier**: No LoadBalancer costs

### Why Template + Deploy Script?

- ✅ **DRY Principle**: Single source of truth (Terraform outputs)
- ✅ **Idempotent**: Can run deploy script multiple times safely
- ✅ **Flexible**: Works with any IP, any region, any instance

### Why Not Hardcode IPs?

- ❌ **Breaks on redeploy**: New EC2 = new IP
- ❌ **Manual updates**: Error-prone and tedious
- ❌ **Not scalable**: Can't automate CI/CD

---

## 📚 Documentation

- **AUTO-IP-CONFIGURATION.md** - Detailed explanation of auto-IP system
- **NODEPORT-COMPLETE-GUIDE.md** - NodePort setup and troubleshooting
- **NODEPORT-CONFIG.md** - Quick reference for NodePort mappings
- **THIS FILE** - Complete setup summary

---

## 🎊 Summary

Your Ticketer application is configured for **maximum automation**:

1. **Destroy infrastructure** → IP changes
2. **Run `./redeploy.sh`** → Everything auto-configures
3. **Access new URL** → Application works perfectly

**NO manual IP updates. EVER.** 🚀

---

## 🆘 Support / Troubleshooting

### Problem: ConfigMap shows EXTERNAL_IP instead of real IP

**Cause:** Deploy script didn't run or failed

**Solution:**

```bash
cd ~/ticketer/scripts
./deploy.sh
```

### Problem: Services can't communicate

**Check 1:** Verify ConfigMap

```bash
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl describe configmap app-config -n ticketer'
```

**Check 2:** Restart pods

```bash
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl rollout restart deployment -n ticketer'
```

### Problem: Can't access application

**Check 1:** Get correct IP

```bash
cd ~/ticketer/terraform && terraform output instance_public_ip
```

**Check 2:** Verify pods running

```bash
INSTANCE_IP=$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip)
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$INSTANCE_IP \
  'microk8s kubectl get pods -n ticketer'
```

---

**🎯 Bottom Line: Just run `./redeploy.sh` and everything works automatically!**
