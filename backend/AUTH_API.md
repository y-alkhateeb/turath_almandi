# Authentication API Documentation

## Overview
This authentication system provides JWT-based authentication for the restaurant accounting system with role-based access control.

## Features
- ✅ Username/password authentication
- ✅ JWT tokens with 24h expiration
- ✅ Role-based access control (ADMIN, ACCOUNTANT)
- ✅ Branch-based access control
- ✅ Arabic error messages
- ✅ Password hashing with bcrypt
- ✅ Proper security headers

## Endpoints

### 1. Login
**POST** `/api/v1/auth/login`

Authenticates a user and returns a JWT access token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "role": "ADMIN",
    "branchId": null,
    "isActive": true
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid credentials
  ```json
  {
    "statusCode": 401,
    "message": "اسم المستخدم أو كلمة المرور غير صحيحة",
    "error": "Unauthorized"
  }
  ```
- **401 Unauthorized** - Account deactivated
  ```json
  {
    "statusCode": 401,
    "message": "الحساب معطل. يرجى التواصل مع المسؤول",
    "error": "Unauthorized"
  }
  ```
- **400 Bad Request** - Validation error
  ```json
  {
    "statusCode": 400,
    "message": [
      "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
      "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
    ],
    "error": "Bad Request"
  }
  ```

### 2. Get Current User Profile
**GET** `/api/v1/auth/me`

Returns the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "role": "ADMIN",
  "branchId": null,
  "isActive": true
}
```

**Error Response:**
- **401 Unauthorized** - Invalid or expired token
  ```json
  {
    "statusCode": 401,
    "message": "الرمز غير صالح أو منتهي الصلاحية",
    "error": "Unauthorized"
  }
  ```

### 3. Register New User
**POST** `/api/v1/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "username": "accountant1",
  "password": "password123",
  "role": "ACCOUNTANT",
  "branchId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Success Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "username": "accountant1",
    "role": "ACCOUNTANT",
    "branchId": "550e8400-e29b-41d4-a716-446655440001",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response:**
- **409 Conflict** - Username already exists
  ```json
  {
    "statusCode": 409,
    "message": "المستخدم بهذا الاسم موجود مسبقاً",
    "error": "Conflict"
  }
  ```

## JWT Token Structure

The JWT token contains the following payload:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "username": "admin",
  "role": "ADMIN",
  "branch_id": null,
  "iat": 1642248600,
  "exp": 1642335000
}
```

**Payload Fields:**
- `sub`: User ID (UUID)
- `username`: User's username
- `role`: User role (ADMIN or ACCOUNTANT)
- `branch_id`: Branch ID (null for ADMIN, UUID for ACCOUNTANT)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (24 hours from iat)

## Role-Based Access Control

### Roles

#### ADMIN
- Can access all branches
- Full system access
- `branchId` is typically `null`

#### ACCOUNTANT
- Can only access assigned branch
- Limited to branch-specific operations
- Must have a valid `branchId`

### Using Roles in Controllers

```typescript
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {

  // Only ADMIN can access
  @Get('all')
  @Roles([UserRole.ADMIN])
  getAllTransactions() {
    // Implementation
  }

  // Both ADMIN and ACCOUNTANT can access
  @Get('branch/:branchId')
  @Roles([UserRole.ADMIN, UserRole.ACCOUNTANT])
  getBranchTransactions(
    @Param('branchId') branchId: string,
    @CurrentUser() user: any,
  ) {
    // For ACCOUNTANT, verify branchId matches user.branchId
    if (user.role === 'ACCOUNTANT' && user.branchId !== branchId) {
      throw new ForbiddenException('ليس لديك صلاحية للوصول إلى هذا الفرع');
    }
    // Implementation
  }

  // All authenticated users can access
  @Get('my')
  getMyTransactions(@CurrentUser() user: any) {
    // Implementation
  }
}
```

## Client-Side Usage Examples

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

// Login
async function login(username: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });

    const { user, access_token } = response.data;

    // Store token
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, access_token };
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('Invalid credentials:', error.response.data.message);
    }
    throw error;
  }
}

// Create authenticated axios instance
function createAuthAxios() {
  const token = localStorage.getItem('access_token');

  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Get current user profile
async function getProfile() {
  const authAxios = createAuthAxios();
  const response = await authAxios.get('/auth/me');
  return response.data;
}

// Make authenticated request
async function getTransactions() {
  const authAxios = createAuthAxios();
  const response = await authAxios.get('/transactions');
  return response.data;
}
```

### React Example

```typescript
import { useState } from 'react';
import axios from 'axios';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
        username,
        password,
      });

      const { user, access_token } = response.data;

      // Store token and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect or update state
      window.location.href = '/dashboard';
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response.data.message);
      } else {
        setError('حدث خطأ. يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="اسم المستخدم"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="كلمة المرور"
        required
        minLength={6}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## Environment Variables

Make sure to set these in your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/turath_almandi

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Security Best Practices

1. **Never expose JWT_SECRET** - Keep it in environment variables
2. **Use HTTPS in production** - Tokens should be transmitted over secure connections
3. **Implement rate limiting** - Prevent brute force attacks on login endpoint
4. **Validate branch access** - Always verify accountant users can only access their assigned branch
5. **Refresh tokens** - Consider implementing refresh tokens for better UX
6. **Password requirements** - Enforce strong password policies
7. **Audit logging** - Log all authentication attempts and sensitive operations

## Common Issues & Solutions

### Issue: "الرمز غير صالح أو منتهي الصلاحية"
**Solution:** Token has expired (24h) or is invalid. User needs to login again.

### Issue: "الحساب معطل. يرجى التواصل مع المسؤول"
**Solution:** User account has been deactivated. Admin needs to reactivate the account.

### Issue: CORS errors
**Solution:** Ensure `CORS_ORIGIN` environment variable includes your frontend URL.

### Issue: Token not being sent with requests
**Solution:** Make sure to include the Authorization header with Bearer token in all protected requests.

## Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get profile (replace TOKEN with actual token)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"

# Register new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"accountant1",
    "password":"password123",
    "role":"ACCOUNTANT",
    "branchId":"550e8400-e29b-41d4-a716-446655440001"
  }'
```

## Testing with Postman

1. **Login Request:**
   - Method: POST
   - URL: `http://localhost:3000/api/v1/auth/login`
   - Body (JSON):
     ```json
     {
       "username": "admin",
       "password": "password123"
     }
     ```
   - Copy the `access_token` from response

2. **Protected Request:**
   - Method: GET
   - URL: `http://localhost:3000/api/v1/auth/me`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer <paste_token_here>`
