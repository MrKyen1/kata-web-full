# Frontend API Integration Guide

## Overview
This document describes how the frontend integrates with the backend API using Axios with comprehensive interceptor setup for authentication, error handling, and request/response processing.

## Architecture

### 1. **Axios Configuration** (`src/api/axiosConfig.ts`)

The base Axios instance is configured with:
- **Base URL**: `http://localhost:3000/api` (or from `VITE_API_URL`)
- **Timeout**: 30 seconds
- **Default Headers**: `Content-Type: application/json`

### 2. **Request Interceptor** (Pre-Request Processing)

The request interceptor automatically:
- ✅ Retrieves the access token from localStorage
- ✅ Adds `Authorization: Bearer {token}` header
- ✅ Adds custom headers (`X-Requested-With`, `timestamp`)
- ✅ Logs all outgoing requests

```typescript
// Automatically handled by interceptor
GET /api/users
↓
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Requested-With: XMLHttpRequest
timestamp: 1717007400000
```

### 3. **Response Interceptor** (Post-Response Processing)

The response interceptor handles:

#### ✅ **401 Unauthorized (Token Expired)**
- Attempts to refresh the token using the refresh token
- Retries the original request with the new token
- If refresh fails → Clears auth data → Redirects to login

#### ✅ **403 Forbidden**
- Shows error: "Bạn không có quyền truy cập tài nguyên này"

#### ✅ **404 Not Found**
- Shows error: "Tài nguyên không tìm thấy"

#### ✅ **500 Server Error**
- Shows error: "Lỗi máy chủ. Vui lòng thử lại sau"

#### ✅ **Network Error (No Response)**
- Shows error: "Lỗi kết nối. Vui lòng kiểm tra mạng của bạn"

#### ✅ **Other Errors**
- Displays the error message from the API response

## Authentication Flow

### Login Process

```typescript
// 1. User enters credentials
const handleFinish = async (values) => {
  await login(values.identifier, values.password);
  // 2. AuthContext calls authService.login()
  // 3. API Response:
  {
    "success": true,
    "data": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "user": { id, code, fullName, email, ... }
    }
  }
  // 4. Tokens saved to localStorage
  // 5. User data saved to localStorage
  // 6. Redirect to home page
};
```

### Token Refresh Flow

```typescript
// When user has expired token but valid refresh token:
// 1. API returns 401 Unauthorized
// 2. Interceptor checks: Do we have a refresh token?
// 3. POST /api/auth/refresh with refresh token
// 4. Backend returns new access token
// 5. Interceptor updates header and retries original request
// 6. Original request completes successfully
```

### Logout Process

```typescript
// 1. User clicks logout
await logout();
// 2. AuthContext calls authService.logout()
// 3. POST /api/auth/logout (notifies backend)
// 4. Clear all tokens from localStorage
// 5. Clear user from state
// 6. Redirect to login page
```

## API Services

### Authentication Service (`src/services/authService.ts`)

All auth-related API calls with proper error handling:

```typescript
// Login
await login(identifier: string, password: string)
// Returns: { accessToken, refreshToken, user }

// Refresh Token
await refreshToken(refreshToken: string)
// Returns: { accessToken }

// Logout
await logout()

// Change Password
await changePassword(currentPassword: string, newPassword: string)

// Reset Password
await resetPassword(identifier: string)

// Update Profile
await updateMe(data: UpdateMeDto)
// Returns: Updated user object

// Get Current User
await getCurrentUser()
// Returns: Current user object
```

## Error Handling

### API Client Error Handling (`src/api/apiClient.ts`)

Generic wrapper that handles all API requests:

```typescript
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  config?: {
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  }
): Promise<T>
```

Helper methods:
```typescript
apiGet<T>(url, params?, headers?)
apiPost<T>(url, data, config?)
apiPut<T>(url, data, config?)
apiPatch<T>(url, data, config?)
apiDelete<T>(url, config?)
```

### AuthContext Error Handling

The `useAuth()` hook provides:
```typescript
const { 
  user,           // Current logged-in user or null
  isLoggedIn,     // Boolean: user logged in and has token
  isLoading,      // Boolean: API call in progress
  error,          // Error message string or null
  login,          // async function
  logout,         // async function
  refreshAccessToken // async function
} = useAuth();
```

## Usage Examples

### 1. Login Page
```typescript
const { login, isLoading, error } = useAuth();

const handleLogin = async (identifier: string, password: string) => {
  try {
    await login(identifier, password);
    navigate('/');
  } catch (error) {
    // Error is shown via message.error() in interceptor
    // Or handled by AuthContext
  }
};
```

### 2. Protected API Calls
```typescript
import { apiGet, apiPost } from '../api/apiClient';

// Get user list with filters
const users = await apiGet('/users', {
  isActive: true,
  roleCode: 'STUDENT'
});

// Create new user
const newUser = await apiPost('/users', {
  code: 'USER001',
  password: 'password123',
  fullName: 'John Doe',
  ...
});
```

### 3. Update Profile
```typescript
const { updateMe } = useAuth();

const handleUpdateProfile = async (data) => {
  try {
    await updateMe({
      fullName: 'New Name',
      phone: '0901234567',
      email: 'newemail@example.com'
    });
    message.success('Profile updated!');
  } catch (error) {
    // Error handled by interceptor
  }
};
```

## Token Storage

Tokens are stored in **localStorage** (not ideal for production):

```typescript
// After successful login:
localStorage.setItem('authToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
localStorage.setItem('user', JSON.stringify(response.user));

// On logout or 401:
localStorage.removeItem('authToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
```

**⚠️ Production Recommendation:**
- Store tokens in **httpOnly cookies** instead
- Never expose tokens in localStorage (XSS vulnerability)

## Environment Variables

Create `.env` file in the `fe/` folder:

```env
VITE_API_URL=http://localhost:3000/api
```

## Debugging

### Enable Console Logs

The interceptors log all requests/responses:

```
[API Request] POST /auth/login
  { data: { identifier: 'admin', password: '...' } }

[API Response] POST /auth/login
  { statusCode: 200, data: { accessToken: '...', user: {...} } }

[Token Refresh Error] Error: ...
```

### Check Token Status

```typescript
// In browser console:
localStorage.getItem('authToken')      // Current access token
localStorage.getItem('refreshToken')   // Refresh token
localStorage.getItem('user')           // Current user data
```

## Common Issues

| Issue | Solution |
|-------|----------|
| **401 errors keep appearing** | Clear localStorage and login again |
| **API timeout (30s)** | Backend might be slow or down |
| **CORS errors** | Backend CORS headers not configured |
| **Token not sent in request** | Check Authorization header in Network tab |
| **Refresh token fails silently** | User is logged out and redirected to login |

## API Response Format

All API responses follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

// Example:
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "ADM001",
    "fullName": "Admin User",
    ...
  },
  "message": "Success",
  "statusCode": 200
}
```

## Error Response Format

```typescript
interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Example:
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401,
  "errors": {
    "identifier": ["Invalid username or email"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

## Next Steps

1. ✅ Configure backend API URL in `.env`
2. ✅ Test login flow end-to-end
3. ✅ Create user management pages (list, create, edit, delete)
4. ✅ Implement role-based access control (RBAC) 
5. ✅ Add more protected routes and components
6. ✅ Move to httpOnly cookies for production
