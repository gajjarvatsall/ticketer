# FRONTEND API PATH FIX - Signup Button Issue Resolved

## Problem

The signup button wasn't working because of **path doubling** in the API service configuration.

### Root Cause

The API service (`src/services/api.ts`) was configured with:

- **baseURL**: `/api/auth` (set by axios instance)
- **API calls**: `/api/auth/register` (in the service methods)

This caused the final URL to be: `/api/auth` + `/api/auth/register` = **`/api/auth/api/auth/register`** ❌

## Solution Applied

### Fixed All API Service Methods

Changed from using full paths to relative paths since baseURL already contains the service prefix:

#### Before (WRONG):

```typescript
const authAPI = axios.create({
  baseURL: "/api/auth", // ← Base URL
});

export const authService = {
  async register(userData) {
    const response = await authAPI.post("/api/auth/register", userData);
    //                                   ^^^^^^^^^^^^^^^^^^^ DUPLICATE PATH!
    return response.data;
  },
};
```

#### After (FIXED):

```typescript
const authAPI = axios.create({
  baseURL: "/api/auth", // ← Base URL
});

export const authService = {
  async register(userData) {
    const response = await authAPI.post("/register", userData);
    //                                   ^^^^^^^^^^ Just the endpoint!
    return response.data;
  },
};
```

### All Services Fixed

✅ **Auth Service** (`/api/auth`)

- `/login` (was `/api/auth/login`)
- `/register` (was `/api/auth/register`)
- `/logout` (was `/api/auth/logout`)
- `/me` (was `/api/auth/me`)
- `/verify` (was `/api/auth/verify`)

✅ **Event Service** (`/api/events`)

- `/` (was `/api/events`)
- `/:id` (was `/api/events/:id`)
- `/my/events` (was `/api/events/my/events`)

✅ **Ticket Service** (`/api/tickets`)

- `/book` (was `/api/tickets/book`)
- `/orders` (was `/api/tickets/orders`)
- `/orders/:id` (was `/api/tickets/orders/:id`)

✅ **Payment Service** (`/api/payments`)

- `/process` (was `/api/payment/process`)
- `/history` (was `/api/payment/history`)

## How axios baseURL Works

When you create an axios instance with a baseURL:

```typescript
const api = axios.create({ baseURL: "/api/auth" });
```

And then make a request:

```typescript
api.post("/register", data);
```

The final URL is: `baseURL + path = /api/auth + /register = /api/auth/register` ✓

**If you provide a full path that includes the baseURL:**

```typescript
api.post("/api/auth/register", data);
```

You get: `baseURL + path = /api/auth + /api/auth/register = /api/auth/api/auth/register` ❌

## Deployment

1. **Fixed**: `src/services/api.ts` - Removed duplicate paths
2. **Created**: `Dockerfile` - Vite-based multi-stage build with nginx
3. **Built**: `docker buildx build --platform linux/amd64 -t ghcr.io/gajjarvatsall/ticketer-frontend:latest --push .`
4. **Deployed**: `kubectl rollout restart deployment/frontend -n ticketer`

## Verification

```bash
curl -X POST http://3.221.128.200:30080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"buttontest@example.com","password":"test123456","firstName":"Button","lastName":"Test"}'
```

**Response**: ✓ 201 Created

```json
{
  "message": "User registered successfully",
  "user": {
    "email": "buttontest@example.com",
    "firstName": "Button",
    "lastName": "Test",
    "role": "user",
    "isActive": true,
    "_id": "68f7b45be34be655f438f8ef",
    "createdAt": "2025-10-21T16:27:07.976Z",
    "updatedAt": "2025-10-21T16:27:07.976Z",
    "__v": 0
  }
}
```

## Testing in Browser

1. Open: http://3.221.128.200:30080
2. Click "Sign up instead" button
3. Fill in:
   - First Name
   - Last Name
   - Email
   - Password (min 6 chars)
4. Click "Sign up" button
5. ✓ Should see success toast and be logged in!

---

## Key Takeaway

**Never duplicate the baseURL path in individual API calls!**

- ✓ Good: `baseURL: '/api/auth'` + path: `/register`
- ✗ Bad: `baseURL: '/api/auth'` + path: `/api/auth/register`

The baseURL is automatically prepended to all requests made with that axios instance.
