# Hướng Dẫn Sử Dụng Axios Interceptor & API Client

## 📋 Tệp Được Tạo

### 1. **src/api/axiosConfig.ts** - Cấu Hình Axios & Interceptor
- ✅ Request Interceptor: Thêm token vào header
- ✅ Response Interceptor: Xử lý lỗi từ server
- ✅ Token Refresh: Tự động refresh token khi hết hạn
- ✅ Error Handling: Xử lý các loại lỗi khác nhau (401, 403, 404, 500, v.v.)

### 2. **src/api/apiClient.ts** - API Client Helper
- ✅ `apiGet()` - GET requests
- ✅ `apiPost()` - POST requests
- ✅ `apiPut()` - PUT requests
- ✅ `apiPatch()` - PATCH requests
- ✅ `apiDelete()` - DELETE requests

### 3. **src/hooks/useApi.ts** - Custom Hooks
- ✅ `useApi<T>()` - Cho data fetching
- ✅ `useApiMutation<T>()` - Cho mutations (POST, PUT, DELETE)

### 4. **src/services/apiServices.ts** - API Services
- ✅ `authService` - Authentication endpoints
- ✅ `courseService` - Courses endpoints
- ✅ `examService` - Exams endpoints
- ✅ `studentService` - Students endpoints
- ✅ `teacherService` - Teachers endpoints

---

## 🚀 Cách Sử Dụng

### **Cách 1: Sử Dụng Custom Hooks (RECOMMENDED)**

```typescript
// Component: LoginForm.tsx
import { useApiMutation } from '@/hooks/useApi';
import { authService } from '@/services/apiServices';

export function LoginForm() {
  const { mutate, loading, error } = useApiMutation({
    onSuccess: (data) => {
      // Save token
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      message.success('Đăng nhập thành công!');
      // Redirect to dashboard
    },
    onError: (error) => {
      console.error('Login failed:', error.message);
    }
  });

  const handleLogin = async (username: string, password: string) => {
    try {
      await mutate(() => authService.login(username, password));
    } catch (err) {
      // Error already handled in interceptor
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const username = (e.target as any).username.value;
      const password = (e.target as any).password.value;
      handleLogin(username, password);
    }}>
      <input type="text" name="username" placeholder="Username" />
      <input type="password" name="password" placeholder="Password" />
      <button type="submit" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

---

### **Cách 2: Sử Dụng API Services Trực Tiếp**

```typescript
// Component: CourseList.tsx
import { useState, useEffect } from 'react';
import { courseService } from '@/services/apiServices';
import { ApiError } from '@/api/axiosConfig';

export function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await courseService.getAllCourses(1, 10);
        setCourses(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {courses.map((course: any) => (
        <li key={course.id}>{course.title}</li>
      ))}
    </ul>
  );
}
```

---

### **Cách 3: Sử Dụng API Client Trực Tiếp**

```typescript
import { apiGet, apiPost } from '@/api/apiClient';

// Fetch data
const courses = await apiGet('/courses');

// Post data
const newCourse = await apiPost('/courses', {
  title: 'Toán Lớp 6',
  description: 'Khóa học toán'
});
```

---

## 🔐 Features Của Interceptor

### **1. Request Interceptor**
```typescript
✅ Thêm Authorization token tự động
✅ Thêm custom headers
✅ Log all requests
✅ Format data trước khi gửi
```

### **2. Response Interceptor**
```typescript
✅ Log all responses
✅ Xử lý lỗi từ server
✅ Tự động refresh token nếu hết hạn (401)
✅ Redirect to login nếu unauthorized
✅ Hiển thị error message cho user
```

### **3. Error Handling**
```typescript
401 Unauthorized    → Refresh token & retry
403 Forbidden       → Show permission error
404 Not Found       → Show not found error
500 Server Error    → Show server error message
Network Error       → Show connection error
```

---

## 📝 Environment Variables Setup

Tạo file `.env` ở root project:

```env
VITE_API_URL=http://localhost:3000/api
```

Hoặc `.env.production`:

```env
VITE_API_URL=https://api.kataedu.vn/api
```

---

## 💾 Token Storage

Tokens được lưu trong localStorage:

```typescript
// Sau khi login thành công
localStorage.setItem('authToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Interceptor sẽ tự động lấy authToken và thêm vào header
```

---

## 🔄 Token Refresh Flow

```
1. User gửi request
2. Backend trả về 401 (token hết hạn)
3. Interceptor tự động gửi refreshToken
4. Backend trả về accessToken mới
5. Interceptor lưu token mới và retry request
6. Nếu refresh fail → Redirect to login
```

---

## ⚙️ Custom Configuration

### Thay đổi Base URL

```typescript
// axiosConfig.ts
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 30000, // Thay đổi timeout
});
```

### Thêm Headers Custom

```typescript
// Trong Request Interceptor
config.headers["X-Custom-Header"] = "value";
```

### Thêm Error Tracking (e.g., Sentry)

```typescript
// Trong Response Error Interceptor
import * as Sentry from "@sentry/react";

if (error.response?.status === 500) {
  Sentry.captureException(error);
}
```

---

## 📚 Ví Dụ Hoàn Chỉnh: Login & Dashboard

```typescript
// services/authService.ts
export const authService = {
  login: (username: string, password: string) =>
    apiPost('/auth/login', { username, password }),
    
  logout: () => apiPost('/auth/logout'),
};

// pages/LoginPage.tsx
import { useApiMutation } from '@/hooks/useApi';
import { authService } from '@/services/apiServices';

export function LoginPage() {
  const { mutate, loading, error } = useApiMutation({
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/dashboard');
    }
  });

  const handleLogin = async (username: string, password: string) => {
    await mutate(() => authService.login(username, password));
  };

  return (
    // Form component
  );
}

// pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { courseService } from '@/services/apiServices';

export function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getAllCourses()
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        // Error handled by interceptor
        setLoading(false);
      });
  }, []);

  return (
    // Dashboard component
  );
}
```

---

## 🛠️ Troubleshooting

### Token không được thêm vào header
- ✅ Kiểm tra token được lưu trong localStorage
- ✅ Kiểm tra key đúng: `authToken`

### Request bị pending
- ✅ Kiểm tra `timeout` setting
- ✅ Kiểm tra backend response

### Token refresh không hoạt động
- ✅ Kiểm tra refreshToken endpoint trên backend
- ✅ Kiểm tra refreshToken được lưu trong localStorage

### CORS Error
- ✅ Thêm CORS headers trên backend
- ✅ Kiểm tra baseURL correct

---

## 📞 Liên Hệ Backend Developer

Hãy cung cấp cho backend developer:

```json
{
  "baseURL": "http://localhost:3000/api",
  "authHeader": "Authorization: Bearer {token}",
  "refreshEndpoint": "/auth/refresh",
  "loginEndpoint": "/auth/login",
  "expectedResponse": {
    "success": true,
    "data": { /* API data */ },
    "message": "Success",
    "statusCode": 200
  }
}
```

---

Chúc bạn code vui! 🎉
