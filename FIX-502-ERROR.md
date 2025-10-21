# 502 Error Fix - Nginx Path Doubling Issue

## Problem Identified

**Error:** 502 Bad Gateway + "Route not found"  
**Cause:** Nginx was doubling the API path

### What Was Happening:

1. Browser sent: `POST /api/auth/register`
2. Nginx matched: `location /api/auth/`
3. Nginx proxy_pass: `http://auth-service:3001/api/auth/` + `/api/auth/register`
4. Final URL: `http://auth-service:3001/api/auth/api/auth/register` ❌ DOUBLE PATH!
5. Backend response: 404 "Route not found"

### The Bug in nginx.conf:

```nginx
# WRONG - This causes path doubling
location /api/auth/ {
    proxy_pass http://auth-service.ticketer.svc.cluster.local:3001/api/auth/;
    #                                                                 ^^^^^^^^^
    #          This path gets ADDED to the original /api/auth/register
}
```

**Result:** `/api/auth/` + `/api/auth/register` = `/api/auth/api/auth/register`

---

## Solution Applied

### Fixed nginx.conf:

```nginx
# CORRECT - Passes the full URI without modification
location /api/auth/ {
    proxy_pass http://auth-service.ticketer.svc.cluster.local:3001;
    #
    #          No path here = nginx passes /api/auth/register as-is
}
```

**Result:** Request goes to `http://auth-service:3001/api/auth/register` ✅

---

## Changes Made

### 1. Updated nginx.conf

**File:** `/Users/vatsalgajjar/ticketer/nginx.conf`

Changed all proxy_pass directives from:

```nginx
proxy_pass http://SERVICE:PORT/api/PATH/;
```

To:

```nginx
proxy_pass http://SERVICE:PORT;
```

### 2. Rebuilt Frontend Image

```bash
docker buildx build --platform linux/amd64 --push \
  -t ghcr.io/gajjarvatsall/ticketer-frontend:latest \
  -f Dockerfile.frontend .
```

### 3. Restarted Frontend Deployment

```bash
microk8s kubectl rollout restart deployment/frontend -n ticketer
```

---

## Verification

### ✅ Tests Passed:

1. **Signup:**

   ```bash
   curl -X POST http://3.221.128.200:30080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456","firstName":"Test","lastName":"User"}'

   # Response: 201 Created ✓
   ```

2. **Login:**

   ```bash
   curl -X POST http://3.221.128.200:30080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'

   # Response: 200 OK ✓
   ```

3. **Nginx Logs:**
   ```
   10.0.1.7 - - [21/Oct/2025:16:10:34 +0000] "POST /api/auth/register HTTP/1.1" 201
   10.0.1.7 - - [21/Oct/2025:16:10:51 +0000] "POST /api/auth/login HTTP/1.1" 200
   ```
   No more 502 or 404 errors! ✓

---

## How Nginx proxy_pass Works

### With trailing slash in location:

```nginx
location /api/auth/ {
    proxy_pass http://backend:3001/api/auth/;
}
```

Request: `/api/auth/register`  
→ Matches `/api/auth/`  
→ Removes matched part: `/register`  
→ Appends to proxy_pass path: `/api/auth/` + `/register`  
→ **Result:** `http://backend:3001/api/auth/register` ✓ (would work if designed this way)

**BUT** in our case, the URI already contains `/api/auth/register`, so it became:
→ `/api/auth/` + `/api/auth/register` = `/api/auth/api/auth/register` ❌

### Without path in proxy_pass (CORRECT for our case):

```nginx
location /api/auth/ {
    proxy_pass http://backend:3001;
}
```

Request: `/api/auth/register`  
→ Matches `/api/auth/`  
→ Passes FULL URI as-is  
→ **Result:** `http://backend:3001/api/auth/register` ✓

---

## Why This Happened

The original nginx config was designed for a different architecture where:

- Backend services had routes at root level (e.g., `/register`, `/login`)
- Nginx would add the `/api/auth/` prefix

But our backend services ALREADY have the `/api/auth/` prefix in their routes:

```javascript
// auth/src/server.js
app.use("/api/auth", authRoutes);  // ← Routes already prefixed!

// auth/src/routes/auth.js
router.post('/register', ...);      // Full path: /api/auth/register
```

So the nginx proxy just needs to pass the request through without modification.

---

## Future Deployments

This fix is now permanent. When you redeploy:

```bash
cd ~/ticketer
./redeploy.sh
```

The corrected `nginx.conf` will be used automatically, and you won't see the 502/404 errors anymore.

---

## Summary

✅ **Fixed:** Nginx path doubling causing 502 errors  
✅ **Solution:** Removed path from proxy_pass directives  
✅ **Tested:** Signup and login working perfectly  
✅ **Deployed:** New frontend image with fix  
✅ **Status:** Application fully functional at http://3.221.128.200:30080

**Try signing up now - it should work!** 🎉
