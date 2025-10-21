# Complete NodePort Configuration Guide

## Configuration Summary

All services are now configured with **NodePort** for maximum simplicity and accessibility.

### Updated Files

1. ✅ **k8s/configmap.yaml** - Backend services use EXTERNAL_IP:NodePort URLs
2. ✅ **k8s/auth-service.yaml** - NodePort 30081
3. ✅ **k8s/services.yaml** - NodePort 30082, 30083, 30084
4. ✅ **k8s/mongodb.yaml** - NodePort 30017
5. ✅ **k8s/frontend.yaml** - NodePort 30080 (already was)
6. ✅ **nginx.conf** - Uses full DNS names (service.namespace.svc.cluster.local)

### Service Configuration

```yaml
# ConfigMap - Backend services communicate via NodePort
AUTH_SERVICE_URL: "http://EXTERNAL_IP:30081" # Gets replaced with actual IP
EVENT_SERVICE_URL: "http://EXTERNAL_IP:30082"
TICKET_SERVICE_URL: "http://EXTERNAL_IP:30083"
PAYMENT_SERVICE_URL: "http://EXTERNAL_IP:30084"
FRONTEND_URL: "http://EXTERNAL_IP:30080"
```

### NodePort Mappings

| Service         | Port  | NodePort | Access URL                 |
| --------------- | ----- | -------- | -------------------------- |
| frontend        | 80    | 30080    | http://3.221.128.200:30080 |
| auth-service    | 3001  | 30081    | http://3.221.128.200:30081 |
| event-service   | 3002  | 30082    | http://3.221.128.200:30082 |
| ticket-service  | 3003  | 30083    | http://3.221.128.200:30083 |
| payment-service | 3004  | 30084    | http://3.221.128.200:30084 |
| mongodb         | 27017 | 30017    | http://3.221.128.200:30017 |

## How It Works

### Frontend → Backend Communication

1. Browser calls: `http://3.221.128.200:30080/api/auth/register`
2. Nginx proxy receives the request in frontend pod
3. Nginx forwards to: `http://auth-service.ticketer.svc.cluster.local:3001/api/auth/register`
4. Request reaches auth service pod
5. Response sent back through nginx to browser

### Backend → Backend Communication

1. Event service needs to verify user with auth service
2. Reads `AUTH_SERVICE_URL` from ConfigMap: `http://3.221.128.200:30081`
3. Makes request to: `http://3.221.128.200:30081/api/auth/verify`
4. Request goes through NodePort to auth service
5. Response received

## Deployment Steps

### 1. Initial Deploy

```bash
cd ~/ticketer
./redeploy.sh
```

### 2. Manual Deploy (if needed)

```bash
cd ~/ticketer/scripts
./deploy.sh
```

### 3. Verify Deployment

```bash
# Check all services are NodePort
ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
  'microk8s kubectl get svc -n ticketer'

# Expected output:
# NAME              TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
# auth-service      NodePort   10.152.x.x       <none>        3001:30081/TCP    5m
# event-service     NodePort   10.152.x.x       <none>        3002:30082/TCP    5m
# ticket-service    NodePort   10.152.x.x       <none>        3003:30083/TCP    5m
# payment-service   NodePort   10.152.x.x       <none>        3004:30084/TCP    5m
# frontend          NodePort   10.152.x.x       <none>        80:30080/TCP      5m
# mongodb           NodePort   10.152.x.x       <none>        27017:30017/TCP   5m
```

### 4. Test Each Service

```bash
# Test auth service
curl http://3.221.128.200:30081/health
# Expected: {"status":"healthy","service":"auth-service",...}

# Test event service
curl http://3.221.128.200:30082/health

# Test ticket service
curl http://3.221.128.200:30083/health

# Test payment service
curl http://3.221.128.200:30084/health
```

### 5. Test Full Application Flow

```bash
# 1. Register a user
curl -X POST http://3.221.128.200:30080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"test123456",
    "firstName":"Test",
    "lastName":"User"
  }'

# 2. Login
curl -X POST http://3.221.128.200:30080/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email":"test@example.com",
    "password":"test123456"
  }'

# 3. Create an event
curl -X POST http://3.221.128.200:30080/api/events/ \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name":"Test Event",
    "description":"A test event",
    "date":"2025-12-25T19:00:00Z",
    "location":"Test Venue",
    "totalTickets":100,
    "price":50
  }'
```

## Troubleshooting

### If auth still doesn't work:

1. **Check ConfigMap has correct IP:**

   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl get configmap app-config -n ticketer -o yaml | grep SERVICE_URL'
   ```

   Should show: `http://3.221.128.200:30081` etc.

2. **Verify pods can reach each other:**

   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl exec -n ticketer deployment/event-service -- \
      wget -O- -q http://3.221.128.200:30081/health'
   ```

3. **Check pod logs:**

   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl logs -n ticketer deployment/auth-service --tail=50'
   ```

4. **Restart all deployments:**
   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl rollout restart deployment -n ticketer'
   ```

### If frontend can't reach backend:

1. **Check nginx config in frontend pod:**

   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl exec -n ticketer deployment/frontend -- \
      cat /etc/nginx/conf.d/default.conf | grep proxy_pass'
   ```

   Should show: `http://auth-service.ticketer.svc.cluster.local:3001`

2. **Test DNS resolution:**
   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl exec -n ticketer deployment/frontend -- \
      nslookup auth-service.ticketer.svc.cluster.local'
   ```

## Why NodePort Configuration

### Advantages:

✅ **Simple**: No need for Ingress controllers or LoadBalancers
✅ **Debuggable**: Every service accessible externally for testing
✅ **Reliable**: Services communicate via stable external IP
✅ **Free Tier Friendly**: No additional AWS resources needed

### Trade-offs:

⚠️ **Security**: All services exposed publicly (fine for demo/dev)
⚠️ **Port Range**: Limited to 30000-32767
⚠️ **No SSL**: Would need additional setup for HTTPS

## Next Steps After Deployment

1. **Open application**: http://3.221.128.200:30080
2. **Sign up** with a new account
3. **Create an event**
4. **Book a ticket**
5. **Verify in MongoDB** (optional):
   ```bash
   ssh -i ~/.ssh/devopsassignment.pem ubuntu@3.221.128.200 \
     'microk8s kubectl exec -n ticketer deployment/mongodb -- \
      mongosh -u admin -p [PASSWORD] --eval "show dbs"'
   ```

## Configuration is Permanent

These changes are saved in your k8s manifests. Every time you run:

- `./scripts/deploy.sh`
- `./redeploy.sh`
- `terraform apply` + deploy

All services will automatically be created as NodePort with the correct configuration! 🎉
