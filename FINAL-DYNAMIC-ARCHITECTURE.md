# FINAL WORKING CONFIGURATION - DYNAMIC & AUTOMATED

## ✅ THE SOLUTION THAT WORKS

Your infrastructure is now **fully dynamic** and will work automatically after every destroy/redeploy with **ZERO manual changes required**.

---

## 🏗️ Architecture Explained

### Two Types of Communication:

1. **Browser → Frontend (External Access)**
   - Uses: NodePort with external IP
   - Example: `http://3.221.128.200:30080`
   - Why: Browsers access from outside the cluster

2. **Service → Service (Internal Communication)**
   - Uses: ClusterIP with internal DNS
   - Example: `http://auth-service:3001`
   - Why: Pods can't reach themselves via external NodePort from inside cluster

---

## 📋 Service Configuration (AUTOMATIC)

### ConfigMap Structure:

```yaml
# Backend services use INTERNAL ClusterIP URLs
AUTH_SERVICE_URL: "http://auth-service:3001" # ← Internal DNS
EVENT_SERVICE_URL: "http://event-service:3002" # ← Internal DNS
TICKET_SERVICE_URL: "http://ticket-service:3003" # ← Internal DNS
PAYMENT_SERVICE_URL: "http://payment-service:3004" # ← Internal DNS

# Frontend URL uses EXTERNAL IP (for CORS)
FRONTEND_URL: "http://3.221.128.200:30080" # ← Auto-replaced!
```

### Service Types:

| Service         | Type     | Internal Access        | External Access |
| --------------- | -------- | ---------------------- | --------------- |
| auth-service    | NodePort | `auth-service:3001`    | `<IP>:30081`    |
| event-service   | NodePort | `event-service:3002`   | `<IP>:30082`    |
| ticket-service  | NodePort | `ticket-service:3003`  | `<IP>:30083`    |
| payment-service | NodePort | `payment-service:3004` | `<IP>:30084`    |
| mongodb         | NodePort | `mongodb:27017`        | `<IP>:30017`    |
| frontend        | NodePort | `frontend:80`          | `<IP>:30080`    |

---

## 🔄 Communication Flow

### Example: User Creates an Event

```
┌──────────┐
│ Browser  │
└────┬─────┘
     │ 1. POST http://3.221.128.200:30080/api/events/
     │    (External IP via NodePort)
     ↓
┌──────────────┐
│  Frontend    │ (nginx in pod)
│  Port: 80    │
└──────┬───────┘
       │ 2. proxy_pass http://event-service.ticketer.svc.cluster.local:3002
       │    (Internal DNS)
       ↓
┌──────────────┐
│ Event Service│
│  Port: 3002  │
└──────┬───────┘
       │ 3. Needs to verify user with auth service
       │    Uses AUTH_SERVICE_URL from ConfigMap
       │    = "http://auth-service:3001"
       │    (Internal ClusterIP)
       ↓
┌──────────────┐
│ Auth Service │
│  Port: 3001  │
└──────┬───────┘
       │ 4. Returns user info
       ↓
┌──────────────┐
│ Event Service│ Creates event
└──────┬───────┘
       │ 5. Returns response
       ↓
┌──────────────┐
│  Frontend    │ Sends to browser
└──────┬───────┘
       ↓
┌──────────┐
│ Browser  │ Shows success!
└──────────┘
```

**Key Point:** Services use internal DNS (`service-name:port`) to talk to each other, NOT external IP!

---

## 🚀 Why This Works After Destroy/Redeploy

### 1. Internal DNS Never Changes

```yaml
AUTH_SERVICE_URL: "http://auth-service:3001"
```

- `auth-service` is the Kubernetes Service name
- Kubernetes DNS automatically resolves it
- Works in ANY cluster, ANY IP, ANY deployment
- **Never needs updating!**

### 2. External IP is Auto-Replaced

```yaml
FRONTEND_URL: "http://EXTERNAL_IP:30080" # In git
```

During deployment:

```bash
# deploy.sh line 193
sed "s/EXTERNAL_IP/$SERVER_IP/g" configmap.yaml
```

Result:

```yaml
FRONTEND_URL: "http://3.221.128.200:30080" # In cluster
```

### 3. Deploy Script Handles Everything

```bash
./redeploy.sh
# OR
./scripts/deploy.sh
```

Automatically:

1. Gets new IP from Terraform
2. Replaces EXTERNAL_IP in configmap
3. Applies all manifests
4. Services restart with correct config

---

## 📁 Final File Configuration

### k8s/configmap.yaml (Template in Git)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: ticketer
data:
  MONGODB_URI_BASE: "mongodb://admin:PASSWORD@mongodb:27017"
  # Internal ClusterIP for service-to-service (NEVER CHANGES)
  AUTH_SERVICE_URL: "http://auth-service:3001"
  EVENT_SERVICE_URL: "http://event-service:3002"
  TICKET_SERVICE_URL: "http://ticket-service:3003"
  PAYMENT_SERVICE_URL: "http://payment-service:3004"
  NODE_ENV: "production"
  # External IP for CORS (AUTO-REPLACED during deployment)
  FRONTEND_URL: "http://EXTERNAL_IP:30080"
```

### nginx.conf (Frontend Proxy)

```nginx
# Proxy to internal ClusterIP (uses DNS)
location /api/auth/ {
    proxy_pass http://auth-service.ticketer.svc.cluster.local:3001;
}

location /api/events/ {
    proxy_pass http://event-service.ticketer.svc.cluster.local:3002;
}

location /api/tickets/ {
    proxy_pass http://ticket-service.ticketer.svc.cluster.local:3003;
}

location /api/payments/ {
    proxy_pass http://payment-service.ticketer.svc.cluster.local:3004;
}
```

---

## 🎯 Complete Redeploy Workflow

### Destroy Old Infrastructure:

```bash
cd ~/ticketer/terraform
terraform destroy -auto-approve
```

### Deploy New Infrastructure (NEW IP):

```bash
cd ~/ticketer
./redeploy.sh
```

**That's it!** The script will:

1. ✅ Create infrastructure with new IP
2. ✅ Get IP from Terraform automatically
3. ✅ Replace `EXTERNAL_IP` with real IP in FRONTEND_URL
4. ✅ Keep internal service URLs unchanged (DNS-based)
5. ✅ Deploy everything
6. ✅ Application works perfectly!

---

## 🧪 Verification

### After Any Deployment:

```bash
# 1. Check ConfigMap has correct settings
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl get configmap app-config -n ticketer -o yaml | grep SERVICE_URL'

# Expected output:
# AUTH_SERVICE_URL: http://auth-service:3001          ← Internal DNS ✓
# EVENT_SERVICE_URL: http://event-service:3002        ← Internal DNS ✓
# TICKET_SERVICE_URL: http://ticket-service:3003      ← Internal DNS ✓
# PAYMENT_SERVICE_URL: http://payment-service:3004    ← Internal DNS ✓
# FRONTEND_URL: http://3.221.128.200:30080            ← Real IP ✓

# 2. Test the application
IP=$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip)
curl -X POST http://$IP:30080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","firstName":"Test","lastName":"User"}'

# Should return: 201 Created with user data ✓

# 3. Open in browser
echo "http://$IP:30080"
```

---

## 🔍 Why Previous Approaches Failed

### ❌ Attempt 1: All NodePort with External IP

```yaml
AUTH_SERVICE_URL: "http://3.221.128.200:30081"
```

**Problem:** Pods can't reach themselves via NodePort from inside cluster  
**Result:** Connection refused, 502 errors

### ❌ Attempt 2: nginx proxy with path duplication

```nginx
proxy_pass http://auth-service:3001/api/auth/;
```

**Problem:** nginx doubled the path (`/api/auth/api/auth/`)  
**Result:** 404 Route not found

### ✅ Final Solution: Mixed Approach

```yaml
# Internal communication
AUTH_SERVICE_URL: "http://auth-service:3001" # ClusterIP DNS

# External access (CORS)
FRONTEND_URL: "http://3.221.128.200:30080" # NodePort IP
```

```nginx
# nginx passes full URI without modification
proxy_pass http://auth-service.ticketer.svc.cluster.local:3001;
```

**Result:** Everything works perfectly! ✓

---

## 📚 Key Concepts

### Kubernetes Service DNS

When you create a Service in Kubernetes:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: ticketer
spec:
  type: NodePort
  ports:
    - port: 3001
```

Kubernetes automatically creates DNS records:

- `auth-service` (within same namespace)
- `auth-service.ticketer` (from other namespaces)
- `auth-service.ticketer.svc.cluster.local` (full FQDN)

All resolve to the **ClusterIP** (internal virtual IP).

### Why NodePort Can't Be Used Internally

NodePort binds to the **host's IP** (the EC2 instance).  
Pods inside the cluster use **pod network** (10.1.x.x).  
When a pod tries to reach the host's public IP, it goes through:

1. Pod network → Host network → Internet → Back to same host
2. But host's public IP can't route back to itself via NodePort
3. **Result:** Connection refused

**Solution:** Use ClusterIP (internal) for pod-to-pod, NodePort (external) for browser-to-pod.

---

## 🎊 Summary

### What's DYNAMIC (Auto-Changes):

✅ External IP in `FRONTEND_URL`  
✅ Terraform outputs  
✅ ConfigMap gets IP from deploy script

### What's STATIC (Never Changes):

✅ Internal service URLs (`http://service-name:port`)  
✅ NodePort numbers (30080-30084)  
✅ Service DNS names

### What You Do:

```bash
cd ~/ticketer
./redeploy.sh
```

### What Happens Automatically:

1. Infrastructure created with new IP
2. Deploy script gets IP from Terraform
3. ConfigMap rendered with:
   - Internal URLs: `http://auth-service:3001` (DNS)
   - External URL: `http://<NEW_IP>:30080` (replaced)
4. Everything deployed and working!

**NO MANUAL IP UPDATES. EVER.** 🚀

---

## 🆘 Troubleshooting

### If you see "Route not found":

**Check 1:** Verify services use internal DNS

```bash
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl get configmap app-config -n ticketer -o yaml | grep AUTH_SERVICE_URL'

# Should show: AUTH_SERVICE_URL: http://auth-service:3001
# NOT: AUTH_SERVICE_URL: http://3.221.128.200:30081
```

**Check 2:** Restart services to pick up config

```bash
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$(cd ~/ticketer/terraform && terraform output -raw instance_public_ip) \
  'microk8s kubectl rollout restart deployment -n ticketer'
```

### If ConfigMap has wrong IP:

**Solution:** Redeploy

```bash
cd ~/ticketer/scripts
./deploy.sh
```

---

## ✨ Final Architecture Summary

```
┌────────────────────────────────────────────────────────────┐
│  Browser (External)                                         │
│  http://3.221.128.200:30080 ← Uses External IP + NodePort  │
└──────────────────────┬─────────────────────────────────────┘
                       ↓
┌────────────────────────────────────────────────────────────┐
│  AWS EC2 Instance (3.221.128.200)                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  MicroK8s Cluster                                   │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Frontend (nginx)                             │  │   │
│  │  │  - External: NodePort 30080                  │  │   │
│  │  │  - Internal: frontend:80                     │  │   │
│  │  │  - Proxies to: auth-service:3001 (DNS)       │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Auth Service                                 │  │   │
│  │  │  - External: NodePort 30081                  │  │   │
│  │  │  - Internal: auth-service:3001 (DNS)         │  │   │
│  │  │  - Talks to: mongodb:27017 (DNS)             │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Event/Ticket/Payment Services               │  │   │
│  │  │  - All use internal DNS for communication    │  │   │
│  │  │  - All accessible externally via NodePort    │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  MongoDB                                      │  │   │
│  │  │  - Internal: mongodb:27017 (DNS)             │  │   │
│  │  │  - Persistent storage via microk8s-hostpath  │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘

Key:
- External Access: Uses public IP + NodePort (for browsers)
- Internal Communication: Uses DNS + ClusterIP (for services)
- Both work together seamlessly!
```

---

**🎯 YOUR APPLICATION IS NOW FULLY DYNAMIC AND AUTOMATED!**

Just run `./redeploy.sh` after any destroy, and everything configures itself automatically! 🎉
