# CI/CD Pipeline

## Overview

Simple CI/CD pipeline that builds and pushes Docker images to GitHub Container Registry (GHCR).

**Deployment is done manually** - the pipeline only handles building and pushing images.

---

## 🚀 What It Does

### On Push to Main
1. ✅ Builds all 5 Docker images (auth, event, ticket, payment, frontend)
2. ✅ Pushes images to `ghcr.io/gajjarvatsall/ticketer-*:latest`
3. ✅ Tags images with commit SHA
4. ✅ Uses GitHub Actions cache for faster builds

### On Pull Request
1. ✅ Builds all images to verify they compile
2. ❌ Does NOT push to registry (only validation)

### Manual Trigger
- Can be triggered manually from GitHub Actions UI
- Useful for rebuilding images without code changes

---

## 📦 Docker Images

After successful build, images are available at:

```
ghcr.io/gajjarvatsall/ticketer-auth:latest
ghcr.io/gajjarvatsall/ticketer-event:latest
ghcr.io/gajjarvatsall/ticketer-ticket:latest
ghcr.io/gajjarvatsall/ticketer-payment:latest
ghcr.io/gajjarvatsall/ticketer-frontend:latest
```

Each image is also tagged with the commit SHA:
```
ghcr.io/gajjarvatsall/ticketer-auth:<commit-sha>
```

---

## 🔧 Manual Deployment

After images are built and pushed, deploy manually:

### Option 1: Full Deploy Script
```bash
cd ~/ticketer
./scripts/deploy.sh
```

### Option 2: Restart Deployments (if infrastructure exists)
```bash
cd ~/ticketer/terraform
IP=$(terraform output -raw instance_public_ip)
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$IP \
  'microk8s kubectl rollout restart deployment -n ticketer'
```

### Option 3: Step by Step
```bash
# 1. Create/update infrastructure
cd ~/ticketer/terraform
terraform apply

# 2. Get server IP
SERVER_IP=$(terraform output -raw instance_public_ip)

# 3. Apply Kubernetes manifests
cd ~/ticketer
TMP_DIR=$(mktemp -d)
cp k8s/*.yaml "$TMP_DIR"/
sed -i.bak "s/EXTERNAL_IP/$SERVER_IP/g" "$TMP_DIR"/configmap.yaml

# Copy to server and apply
scp -i ~/.ssh/devopsassignment.pem "$TMP_DIR"/*.yaml ubuntu@$SERVER_IP:/tmp/
ssh -i ~/.ssh/devopsassignment.pem ubuntu@$SERVER_IP \
  'microk8s kubectl apply -f /tmp/ -n ticketer'
```

---

## ⚙️ Configuration

### File Location
`.github/workflows/ci.yml`

### Triggers
```yaml
on:
  push:
    branches: [main]      # Builds and pushes on main
  pull_request:
    branches: [main]      # Builds only (no push)
  workflow_dispatch:      # Manual trigger
```

### Permissions
```yaml
permissions:
  contents: read    # Read repository
  packages: write   # Push to GHCR
```

### Build Matrix
```yaml
strategy:
  matrix:
    include:
      - service: auth
        context: ./auth
        dockerfile: ./auth/Dockerfile
      # ... and so on
```

---

## 🔍 How to Monitor

### View Workflow Runs
1. Go to GitHub repository
2. Click "Actions" tab
3. See all workflow runs and their status

### Check Build Logs
1. Click on a workflow run
2. Click on "Build and Push Images" job
3. Expand individual service builds to see logs

### Verify Images
```bash
# List images in GHCR
gh api /user/packages/container/ticketer-auth/versions

# Or pull an image to verify
docker pull ghcr.io/gajjarvatsall/ticketer-auth:latest
```

---

## 🐛 Troubleshooting

### Build Fails
- **Check Dockerfile syntax** - View logs in GitHub Actions
- **Check dependencies** - Ensure package.json has all deps
- **Check base images** - node:18-alpine, nginx:alpine must be accessible

### Push Fails
- **Check permissions** - Workflow needs `packages: write`
- **Check GITHUB_TOKEN** - Should be automatically provided
- **Check registry** - `ghcr.io` must be accessible

### Images Not Updating
- **Check tags** - Both `latest` and SHA tags should be pushed
- **Force pull** - Run `docker pull --disable-content-trust ghcr.io/...`
- **Check cache** - Clear GitHub Actions cache if needed

---

## 📊 Build Time

Typical build times:
- **First build:** ~10-15 minutes (no cache)
- **Subsequent builds:** ~3-5 minutes (with cache)
- **No code changes:** ~1-2 minutes (cache hit)

Build runs in parallel (5 services simultaneously).

---

## 🔒 Security

- **Private images:** By default in GHCR for private repos
- **Authentication:** Uses GITHUB_TOKEN (automatic)
- **No secrets needed:** Registry login handled by GitHub
- **Image scanning:** Can add Trivy or Snyk scanning if needed

---

## 📝 Workflow File

```yaml
name: CI/CD - Build and Push Images

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository_owner }}/ticketer

jobs:
  build-and-push:
    # Builds all 5 services in parallel
    # Pushes to GHCR on push to main
    
  summary:
    # Shows build status and next steps
```

---

## ✅ Benefits

1. **Simple** - One file, clear purpose
2. **Fast** - Parallel builds with caching
3. **Reliable** - GitHub-hosted runners
4. **No deployment risk** - Manual control over when to deploy
5. **Flexible** - Can trigger manually when needed

---

## 🎯 Next Steps After Build

1. ✅ **Images are built and pushed**
2. 🔧 **Deploy manually when ready**
3. ✅ **Test the application**
4. 🔄 **Repeat as needed**

**Simple, predictable, and under your control!**
