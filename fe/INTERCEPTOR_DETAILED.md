/**
 * AXIOS INTERCEPTOR DOCUMENTATION
 * 
 * This file explains the complete request/response lifecycle with interceptors
 * for authentication, error handling, and automatic token refresh.
 */

// ============================================================================
// 1. REQUEST INTERCEPTOR - Runs BEFORE every API call
// ============================================================================

/**
 * REQUEST FLOW:
 * 
 * User calls: await apiGet('/users')
 *                    ↓
 * axios creates request to GET /users
 *                    ↓
 * REQUEST INTERCEPTOR intercepts
 *                    ↓
 * Step 1: Get token from localStorage
 *         const token = localStorage.getItem('authToken')
 *         
 * Step 2: Add Authorization header
 *         config.headers.Authorization = `Bearer ${token}`
 *         
 * Step 3: Add custom headers
 *         X-Requested-With: XMLHttpRequest
 *         timestamp: 1717007400000
 *         
 * Step 4: Log the request
 *         [API Request] GET /users
 *                    ↓
 * Request sent to server with all headers
 */

// Example interceptor code:
/*
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['timestamp'] = new Date().getTime().toString();
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  }
);
*/


// ============================================================================
// 2. RESPONSE INTERCEPTOR - Runs AFTER server responds
// ============================================================================

/**
 * SUCCESSFUL RESPONSE (200-299):
 * 
 * Server returns: { success: true, data: [...], message: "OK", statusCode: 200 }
 *                    ↓
 * RESPONSE INTERCEPTOR checks
 *                    ↓
 * Check: response.data.success === false ?
 *        NO ✓ → Continue to application
 *        YES ✗ → Treat as error
 *                    ↓
 * Application receives the response data
 */

/**
 * ERROR RESPONSE - 401 UNAUTHORIZED (Token Expired)
 * 
 * Server returns: 401 Unauthorized
 *                    ↓
 * RESPONSE INTERCEPTOR checks error.response?.status
 *                    ↓
 * IS 401? YES
 *                    ↓
 * Check: _retry flag already set?
 *        YES → Already tried once, give up → redirect to login
 *        NO → Set _retry = true and proceed to refresh
 *                    ↓
 * Get refreshToken from localStorage
 *                    ↓
 * POST /auth/refresh { refreshToken }
 *                    ↓
 * Server returns: { success: true, data: { accessToken: "new..." } }
 *                    ↓
 * Save new token: localStorage.setItem('authToken', newToken)
 *                    ↓
 * Update request header: Authorization: Bearer new...
 *                    ↓
 * Retry original request with new token
 *                    ↓
 * Return response to application
 */

/**
 * ERROR RESPONSE - 403 FORBIDDEN (No Permission)
 * 
 * Server returns: 403 Forbidden
 *                    ↓
 * Show message: "Bạn không có quyền truy cập tài nguyên này"
 *                    ↓
 * Reject the promise
 *                    ↓
 * Application catches error
 */

/**
 * ERROR RESPONSE - 404 NOT FOUND
 * 
 * Server returns: 404 Not Found
 *                    ↓
 * Show message: "Tài nguyên không tìm thấy"
 *                    ↓
 * Reject the promise
 */

/**
 * ERROR RESPONSE - 500 SERVER ERROR
 * 
 * Server returns: 500 Internal Server Error
 *                    ↓
 * Show message: "Lỗi máy chủ. Vui lòng thử lại sau"
 *                    ↓
 * Reject the promise
 */

/**
 * ERROR RESPONSE - NETWORK ERROR (No Response)
 * 
 * Network connection fails (e.g., backend is down)
 *                    ↓
 * error.response is undefined
 *                    ↓
 * Show message: "Lỗi kết nối. Vui lòng kiểm tra mạng của bạn"
 *                    ↓
 * Reject the promise
 */


// ============================================================================
// 3. COMPLETE REQUEST-RESPONSE CYCLE EXAMPLE
// ============================================================================

/**
 * SCENARIO: User logs in
 * 
 * FRONTEND:
 * ---------
 * 1. User clicks "Login" button
 * 2. User enters: identifier="admin", password="password123"
 * 3. Form validates → calls login(identifier, password)
 * 4. AuthContext calls: await authService.login(identifier, password)
 * 5. authService calls: await apiPost('/auth/login', { identifier, password })
 * 6. apiClient makes POST request
 * 
 * REQUEST INTERCEPTOR:
 * -------------------
 * ✗ No token yet (first login)
 * ✓ Add headers: Content-Type, X-Requested-With, timestamp
 * ✓ Log: [API Request] POST /auth/login
 * 
 * BACKEND:
 * --------
 * Receives POST /auth/login
 * Validates credentials
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *     "user": {
 *       "id": "123e4567-e89b-12d3-a456-426614174000",
 *       "code": "ADM001",
 *       "fullName": "Admin User",
 *       "email": "admin@example.com",
 *       "role": { "id": "...", "code": "ADMIN", "name": "Administrator" }
 *     }
 *   },
 *   "message": "Login successful",
 *   "statusCode": 200
 * }
 * 
 * RESPONSE INTERCEPTOR:
 * --------------------
 * ✓ Check status: 200 (success)
 * ✓ Check data.success: true
 * ✓ Log: [API Response] POST /auth/login
 * ✓ Return data to application
 * 
 * FRONTEND RESUMES:
 * ----------------
 * 7. authService.login() returns the response
 * 8. AuthContext.login() saves:
 *    - localStorage.setItem('authToken', accessToken)
 *    - localStorage.setItem('refreshToken', refreshToken)
 *    - localStorage.setItem('user', JSON.stringify(user))
 *    - setUser(user) in state
 * 9. message.success('Đăng nhập thành công!')
 * 10. navigate('/') → redirect to home page
 */


// ============================================================================
// 4. TOKEN REFRESH CYCLE EXAMPLE
// ============================================================================

/**
 * SCENARIO: User has been logged in for a while, token expires
 * 
 * FRONTEND:
 * ---------
 * User clicks on "My Profile"
 * Application calls: await apiGet('/auth/me')
 * 
 * REQUEST INTERCEPTOR:
 * -------------------
 * ✓ Get token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (EXPIRED)"
 * ✓ Add Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ✓ Send request
 * 
 * BACKEND:
 * --------
 * Receives GET /auth/me
 * Validates token
 * Token is EXPIRED → Return 401 Unauthorized
 * 
 * RESPONSE INTERCEPTOR (401 HANDLING):
 * ------------------------------------
 * ✓ error.response?.status === 401? YES
 * ✓ originalRequest._retry already set? NO
 * ✓ Set _retry = true
 * ✓ Get refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (VALID)"
 * ✓ POST /auth/refresh { refreshToken }
 * 
 * BACKEND REFRESH:
 * ----------------
 * Validates refreshToken
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (NEW)"
 *   }
 * }
 * 
 * RESPONSE INTERCEPTOR (RETRY):
 * ----------------------------
 * ✓ Save new token: localStorage.setItem('authToken', newAccessToken)
 * ✓ Update header: config.headers.Authorization = `Bearer ${newAccessToken}`
 * ✓ Retry original request: return apiClient(originalRequest)
 * 
 * REQUEST INTERCEPTOR (RETRY):
 * ----------------------------
 * ✓ Get new token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (NEW)"
 * ✓ Add Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (NEW)
 * ✓ Send request again
 * 
 * BACKEND:
 * --------
 * Receives GET /auth/me with new token
 * Validates token ✓ VALID
 * Returns user profile data
 * {
 *   "success": true,
 *   "data": { "id": "...", "fullName": "...", ... }
 * }
 * 
 * FRONTEND:
 * ---------
 * Receives user profile data successfully
 * Application displays the profile
 */


// ============================================================================
// 5. ERROR HANDLING DIAGRAM
// ============================================================================

/**
 *                           API REQUEST
 *                               ↓
 *                    REQUEST INTERCEPTOR
 *                    (Add token & headers)
 *                               ↓
 *                          SERVER
 *                               ↓
 *         ┌─────────────────────┼─────────────────────┐
 *         ↓                     ↓                     ↓
 *     2xx SUCCESS          4xx CLIENT ERROR       5xx SERVER ERROR
 *         ↓                     ↓                     ↓
 *   RESPONSE INTERCEPTOR   RESPONSE INTERCEPTOR   RESPONSE INTERCEPTOR
 *         ↓                     ↓                     ↓
 *   Check if success            ↓                 Show error message
 *   = true                   Is 401?               (500, 502, 503...)
 *         ↓                  ↙    ↖                    ↓
 *     Return to          YES      NO                Return error
 *    application         ↓         ↓
 *                    Retry with  Other
 *                    new token   status
 *                    (401, 403   codes
 *                    404, etc)   ↓
 *                               Show
 *                              error
 *                              message
 */


// ============================================================================
// 6. KEY FEATURES
// ============================================================================

/**
 * ✅ AUTOMATIC TOKEN MANAGEMENT
 *    - Token added to every request automatically
 *    - No need to manually add headers
 * 
 * ✅ TRANSPARENT TOKEN REFRESH
 *    - User doesn't know token expired
 *    - Automatic retry without user interaction
 *    - Seamless experience
 * 
 * ✅ AUTOMATIC ERROR HANDLING
 *    - User-friendly error messages
 *    - Redirects to login on auth error
 *    - Logs all API activity
 * 
 * ✅ TYPE SAFE
 *    - Full TypeScript support
 *    - Generic API response types
 *    - Compile-time error checking
 * 
 * ✅ NETWORK ERROR HANDLING
 *    - Detects connection failures
 *    - User-friendly network error messages
 * 
 * ✅ REQUEST/RESPONSE LOGGING
 *    - Debug mode available
 *    - Console logs for development
 */


// ============================================================================
// 7. USAGE IN COMPONENTS
// ============================================================================

/**
 * // In any React component:
 * 
 * import { useAuth } from '../contexts/AuthContext';
 * import { apiGet, apiPost } from '../api/apiClient';
 * 
 * function MyComponent() {
 *   const { user, isLoggedIn, isLoading, error } = useAuth();
 * 
 *   // No need to add token header - interceptor does it automatically!
 *   const handleGetUsers = async () => {
 *     try {
 *       const users = await apiGet('/users', { isActive: true });
 *       console.log('Users:', users);
 *     } catch (error) {
 *       // Error already handled by interceptor
 *       console.error('Error:', error);
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handleGetUsers} disabled={isLoading}>
 *       Get Users
 *     </button>
 *   );
 * }
 */
