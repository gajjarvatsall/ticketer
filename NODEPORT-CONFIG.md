# NodePort Configuration Summary

## Changes Made

All Kubernetes services have been converted from **ClusterIP** to **NodePort** for easier communication and debugging.

### Service Port Mappings

| Service         | Internal Port | NodePort | External Access URL         |
| --------------- | ------------- | -------- | --------------------------- |
| Frontend        | 80            | 30080    | http://44.218.115.120:30080 |
| Auth Service    | 3001          | 30081    | http://44.218.115.120:30081 |
| Event Service   | 3002          | 30082    | http://44.218.115.120:30082 |
| Ticket Service  | 3003          | 30083    | http://44.218.115.120:30083 |
| Payment Service | 3004          | 30084    | http://44.218.115.120:30084 |
| MongoDB         | 27017         | 30017    | http://44.218.115.120:30017 |

## Files Updated

1. ✅ `k8s/auth-service.yaml` - Changed to NodePort with nodePort: 30081
2. ✅ `k8s/services.yaml` - Changed event, ticket, payment services to NodePort
3. ✅ `k8s/mongodb.yaml` - Changed to NodePort with nodePort: 30017
4. ✅ `k8s/frontend.yaml` - Already was NodePort (30080)

## To Apply Changes

Run this command on your **local machine**:

```bash
cd ~/ticketer/scripts
./deploy.sh
```

Or manually apply each file:

```bash
# Copy files to server
scp -i ~/.ssh/devopsassignment.pem k8s/*.yaml ubuntu@44.218.115.120:/tmp/

# SSH to server and apply
ssh -i ~/.ssh/devopsassignment.pem ubuntu@44.218.115.120

# On the server:
microk8s kubectl apply -f /tmp/auth-service.yaml
microk8s kubectl apply -f /tmp/services.yaml
microk8s kubectl apply -f /tmp/mongodb.yaml
microk8s kubectl apply -f /tmp/frontend.yaml

# Check services
microk8s kubectl get svc -n ticketer
```

## Benefits of NodePort

✅ **Simpler Communication**: All services accessible externally
✅ **Easier Debugging**: Can curl any service directly via IP:NodePort
✅ **No Complex Networking**: No need for Ingress or LoadBalancer
✅ **Direct Access**: Services can be accessed from anywhere

## Testing After Deployment

Once applied, you can test each service:

```bash
# Test auth service
curl http://44.218.115.120:30081/health

# Test event service
curl http://44.218.115.120:30082/health

# Test ticket service
curl http://44.218.115.120:30083/health

# Test payment service
curl http://44.218.115.120:30084/health

# Access frontend
open http://44.218.115.120:30080
```

## Security Note

⚠️ **Warning**: NodePort exposes all services publicly. In production, you would typically:

- Use ClusterIP with Ingress
- Add Network Policies
- Use a Service Mesh
- Enable authentication on all endpoints

But for development/testing, NodePort makes everything simpler and more accessible.

## Next Deployment

For next time, this configuration is now saved in your k8s manifests. When you run `./scripts/deploy.sh`, it will automatically create all services as NodePort.
