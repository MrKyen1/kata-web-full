import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { message } from "antd";

// Define API response types
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== REQUEST INTERCEPTOR ====================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add custom headers
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    config.headers["timestamp"] = new Date().getTime().toString();

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
    });

    return config;
  },
  (error: AxiosError) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log successful response
    console.log(
      `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
      {
        statusCode: response.status,
        data: response.data,
      }
    );

    // Check if response has success flag
    if (response.data && response.data.success === false) {
      const error: ApiError = {
        message: response.data.message || "Có lỗi xảy ra",
        statusCode: response.data.statusCode,
        errors: response.data.errors,
      };
      return Promise.reject(error);
    }

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    console.error("[API Response Error]", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    // ==================== 401 - TOKEN EXPIRED ====================
    if (error.response?.status === 401) {
      // Avoid retry loop
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          const refreshToken = localStorage.getItem("refreshToken");

          if (refreshToken) {
            const response = await axios.post(
              `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/refresh`,
              { refreshToken }
            );

            if (response.data.data.accessToken) {
              // Save new token
              localStorage.setItem("authToken", response.data.data.accessToken);

              // Update header
              originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;

              // Retry original request
              return apiClient(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error("[Token Refresh Error]", refreshError);
          // If refresh fails, redirect to login
          handleAuthError();
          return Promise.reject(refreshError);
        }
      }

      // If already retried, handle auth error
      handleAuthError();
      return Promise.reject(error);
    }

    // ==================== 403 - FORBIDDEN ====================
    if (error.response?.status === 403) {
      message.error("Bạn không có quyền truy cập tài nguyên này");
      return Promise.reject(error);
    }

    // ==================== 404 - NOT FOUND ====================
    if (error.response?.status === 404) {
      message.error("Tài nguyên không tìm thấy");
      return Promise.reject(error);
    }

    // ==================== 500 - SERVER ERROR ====================
    if (error.response?.status === 500) {
      message.error("Lỗi máy chủ. Vui lòng thử lại sau");
      return Promise.reject(error);
    }

    // ==================== NETWORK ERROR ====================
    if (!error.response) {
      message.error("Lỗi kết nối. Vui lòng kiểm tra mạng của bạn");
      return Promise.reject({
        message: "Lỗi kết nối",
        statusCode: 0,
      } as ApiError);
    }

    // ==================== OTHER ERRORS ====================
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || "Có lỗi xảy ra",
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors,
    };

    message.error(apiError.message);
    return Promise.reject(apiError);
  }
);

// ==================== ERROR HANDLER ====================
function handleAuthError() {
  // Clear auth data
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  // Show error message
  message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại");

  // Redirect to login
  window.location.href = "/login";
}

export default apiClient;
export type { ApiResponse, ApiError };
