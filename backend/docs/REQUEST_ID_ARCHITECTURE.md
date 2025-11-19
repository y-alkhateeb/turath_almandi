# Request ID Architecture - Server-Only Generation

## Overview

This document explains the request ID architecture and why we use **server-only generation** instead of accepting client-provided request IDs.

**Decision:** Request IDs are generated exclusively by the backend server.

---

## Architecture Pattern

### Server Generates, Client Reads

```
┌─────────────┐                    ┌─────────────┐
│   Frontend  │                    │   Backend   │
│   (Client)  │                    │   (Server)  │
└─────────────┘                    └─────────────┘
       │                                  │
       │  1. Request (no X-Request-Id)    │
       │ ─────────────────────────────────>│
       │                                  │
       │                    2. Generate UUID
       │                    req.requestId = randomUUID()
       │                                  │
       │  3. Response + X-Request-Id      │
       │ <─────────────────────────────────│
       │                                  │
       │  4. Read X-Request-Id from       │
       │     response headers             │
       │                                  │
```

### Flow

1. **Client sends request** - No `X-Request-Id` header
2. **Server generates UUID** - `RequestIdMiddleware` creates unique ID
3. **Server adds to response** - `X-Request-Id` header included in response
4. **Client reads from response** - Can use for error reporting, correlation

---

## Backend Implementation

### Request ID Middleware

**File:** `backend/src/common/middleware/request-id.middleware.ts`

```typescript
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Server generates UUID (not from client)
    const requestId = randomUUID();

    // Add to request object for server-side logging
    req.requestId = requestId;

    // Add to response headers so client can read it
    res.setHeader('X-Request-Id', requestId);

    // Log request with ID
    this.logger.log(`[${requestId}] ${req.method} ${req.url}`);

    next();
  }
}
```

### CORS Configuration

**File:** `backend/src/main.ts`

```typescript
app.enableCors({
  // Headers clients are ALLOWED TO SEND
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Accept-Language'
    // ❌ X-Request-Id NOT here - client cannot send it
  ],

  // Headers clients can READ FROM RESPONSES
  exposedHeaders: [
    'X-Request-Id',      // ✅ Client can read this
    'X-Response-Time'    // ✅ Client can read this
  ],
});
```

**Key Points:**
- `allowedHeaders`: What client **can send** → No `X-Request-Id`
- `exposedHeaders`: What client **can read** → Yes `X-Request-Id`

---

## Frontend Requirements

### ❌ What NOT to Do

**Don't send X-Request-Id in requests:**

```typescript
// ❌ INCORRECT - Remove this
axios.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = generateUUID(); // ❌ Don't do this
  return config;
});
```

### ✅ What TO Do

**Read X-Request-Id from responses:**

```typescript
// ✅ CORRECT - Read from response headers
axios.interceptors.response.use(
  (response) => {
    const requestId = response.headers['x-request-id'];
    console.log(`Request ID: ${requestId}`);
    return response;
  },
  (error) => {
    const requestId = error.response?.headers['x-request-id'];

    // Use in error reporting
    console.error(`Error on request ${requestId}:`, error.message);

    // Send to error tracking service
    trackError({
      requestId,
      message: error.message,
      status: error.response?.status,
    });

    return Promise.reject(error);
  }
);
```

### Use Cases

#### 1. Error Reporting
```typescript
async function createTransaction(data) {
  try {
    const response = await api.post('/transactions', data);
    return response.data;
  } catch (error) {
    const requestId = error.response?.headers['x-request-id'];

    // Show to user for support
    showError(
      `Transaction failed. Reference ID: ${requestId}\n` +
      `Please contact support with this ID.`
    );

    throw error;
  }
}
```

#### 2. Request Correlation
```typescript
// Store request ID for debugging
const requestLog = {
  timestamp: new Date(),
  requestId: response.headers['x-request-id'],
  endpoint: '/api/v1/transactions',
  duration: response.headers['x-response-time'],
};

console.log('Request completed:', requestLog);
```

#### 3. User Support
```typescript
// When user reports an issue, they can provide the Request ID
function copyRequestIdToClipboard(error) {
  const requestId = error.response?.headers['x-request-id'];
  navigator.clipboard.writeText(requestId);
  alert(`Request ID copied: ${requestId}\nShare this with support.`);
}
```

---

## Why Server-Only Generation?

### ✅ Advantages

#### 1. **Security**
- Prevents injection attacks via malicious request IDs
- No need to validate/sanitize client input
- Client cannot manipulate server logs

#### 2. **Simplicity**
- Single source of truth (server)
- No synchronization issues
- Cleaner architecture

#### 3. **Consistency**
- All request IDs follow same format (UUID v4)
- Guaranteed uniqueness (crypto.randomUUID)
- No client implementation errors

#### 4. **Best Practice**
- Follows REST API conventions
- Standard pattern in industry
- Easier to audit and debug

### ❌ Why Not Accept Client IDs?

#### Problems with Client-Provided IDs:

1. **Security Risk**
```typescript
// Client could send:
X-Request-Id: '; DROP TABLE users; --
X-Request-Id: <script>alert('xss')</script>
X-Request-Id: ../../../etc/passwd
```

2. **Log Pollution**
```typescript
// Client could flood logs with:
X-Request-Id: AAAAAAAAAA-repeated-1000-times
```

3. **Unreliable**
```typescript
// Different clients might:
- Use different formats (not UUID)
- Generate collisions (not unique)
- Send duplicate IDs
- Omit the header entirely
```

4. **Unnecessary Complexity**
```typescript
// Server would need to:
- Validate format
- Check for injection
- Handle missing IDs
- Sanitize for logging
```

---

## When to Use Client-Provided IDs

**Only in these scenarios:**

### 1. Distributed Tracing (Multi-Service)

If you have multiple backend services:

```
Frontend → API Gateway → Auth Service → Database
                      ↘ Payment Service
```

Then accepting `X-Trace-Id` from frontend makes sense for correlation.

**Our case:** Single backend service → Not needed

### 2. Mobile App Offline Mode

Mobile apps that queue requests while offline:

```typescript
// Mobile generates ID when offline
const requestId = generateOfflineId();
queueRequest({ id: requestId, data });

// Later when online, use same ID
await api.post('/sync', { requestId, data });
```

**Our case:** Web app, always online → Not needed

### 3. Idempotency Keys

For preventing duplicate operations (different from request IDs):

```typescript
// Client generates idempotency key
const idempotencyKey = generateUUID();

// Server uses it to detect retries
await api.post('/payments', data, {
  headers: { 'Idempotency-Key': idempotencyKey }
});
```

**Note:** This is a separate header, not `X-Request-Id`

---

## Migration Guide

### If Frontend Currently Sends X-Request-Id

**Step 1: Identify where it's sent**

Search for:
```bash
grep -r "X-Request-Id" frontend/src
grep -r "x-request-id" frontend/src
grep -r "requestId" frontend/src
```

**Step 2: Remove request interceptors**

```typescript
// Remove or comment out:
axios.interceptors.request.use((config) => {
  // config.headers['X-Request-Id'] = generateUUID(); // ❌ Remove this line
  return config;
});
```

**Step 3: Keep response interceptors**

```typescript
// Keep this - reads from response:
axios.interceptors.response.use(
  (response) => {
    const requestId = response.headers['x-request-id']; // ✅ Keep this
    // Store or log as needed
    return response;
  }
);
```

**Step 4: Update error handling**

```typescript
// Update to read from response headers:
catch (error) {
  const requestId = error.response?.headers['x-request-id']; // ✅ Read from server
  showError(`Error ${requestId}: ${error.message}`);
}
```

**Step 5: Test**

```bash
# Should NOT see CORS errors
# Should still see X-Request-Id in response headers
```

---

## Testing

### Backend Test

```bash
# Request without X-Request-Id header
curl -X GET https://api.example.com/api/v1/health

# Response should include:
HTTP/1.1 200 OK
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 45ms
```

### Frontend Test

```javascript
// Should work without sending X-Request-Id
const response = await fetch('https://api.example.com/api/v1/health');

// Should be able to read X-Request-Id from response
const requestId = response.headers.get('x-request-id');
console.log('Request ID:', requestId); // ✅ Should print UUID
```

### CORS Preflight Test

```bash
# OPTIONS request should not list X-Request-Id in allowed headers
curl -X OPTIONS https://api.example.com/api/v1/health \
  -H "Origin: https://frontend.example.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Request-Id"

# Should return:
Access-Control-Allow-Headers: Content-Type, Authorization, Accept, Accept-Language
# ❌ X-Request-Id should NOT be in this list

Access-Control-Expose-Headers: X-Request-Id, X-Response-Time
# ✅ X-Request-Id SHOULD be in exposed headers
```

---

## Logging and Monitoring

### Backend Logs

Every request will have a unique ID:

```
[550e8400-e29b-41d4-a716-446655440000] GET /api/v1/transactions
[550e8400-e29b-41d4-a716-446655440000] GET /api/v1/transactions 200 - 125ms
```

### Frontend Error Reports

Users can provide request ID for support:

```
Error Report:
- Request ID: 550e8400-e29b-41d4-a716-446655440000
- Error: Transaction failed
- Status: 500
- Timestamp: 2025-11-18T20:30:00Z
```

Backend team can then search logs for this exact request.

---

## Summary

### Backend (Current Implementation) ✅

- ✅ Generates UUID for every request
- ✅ Adds `X-Request-Id` to response headers
- ✅ Does NOT accept `X-Request-Id` from clients
- ✅ Exposes header so clients can read it
- ✅ Uses ID for server-side logging

### Frontend (Required Changes) 📋

- ❌ Stop sending `X-Request-Id` in requests
- ✅ Read `X-Request-Id` from response headers
- ✅ Use for error reporting
- ✅ Display to users for support cases

### Benefits

- 🔒 **More Secure** - No client input validation needed
- 🎯 **Simpler** - Single source of truth
- 📊 **Better Logging** - Consistent format
- ✅ **Best Practice** - Industry standard pattern

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Status:** ✅ Implemented in backend
**Action Required:** Frontend update to stop sending header
