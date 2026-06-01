import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { message } from "antd"
import type { ApiError, ApiResponse } from "./types"

interface CustomRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  _retry?: boolean
}

const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000/api/v1"

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

/* ================= REQUEST ================= */
apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = localStorage.getItem("accessToken")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ================= RESPONSE ================= */
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    const requestConfig = response.config as CustomRequestConfig

    // ❗ Backend trả success = false
    if (data?.success === false) {
      const error: ApiError = {
        message: data.message || "Có lỗi xảy ra",
        statusCode: data.statusCode || 400,
      }

      if (requestConfig.showErrorMessage !== false) {
        message.error(error.message)
      }
      return Promise.reject(error)
    }

    return response
  },

  async (error: AxiosError<ApiError>) => {
    const originalRequest: CustomRequestConfig = error.config as CustomRequestConfig

    const status = error.response?.status
    const apiMessage =
      error.response?.data?.message || error.message || "Có lỗi xảy ra"
    const shouldDisplayMessage = originalRequest.showErrorMessage !== false

    console.error("[API ERROR]", {
      status,
      message: apiMessage,
      url: originalRequest?.url,
    })

    /* ================= 401: TOKEN EXPIRED ================= */
    const isAuthEndpoint = (url?: string) =>
      !!url && (url.includes("/auth/login") || url.includes("/auth/refresh"))

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject({
          message: apiMessage,
          statusCode: 401,
        } as ApiError)
      }

      try {
        const refreshToken = localStorage.getItem("refreshToken")

        if (!refreshToken) {
          return Promise.reject({
            message: apiMessage,
            statusCode: 401,
          } as ApiError)
        }

        const refreshBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL
        const refreshUrl = refreshBaseUrl
          ? `${refreshBaseUrl}/auth/refresh`
          : "http://localhost:3000/api/v1/auth/refresh"

        const res = await axios.post(refreshUrl, { refreshToken })

        const { accessToken, refreshToken: newRefresh } = res.data.data

        // ✅ save new token
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", newRefresh)

        // ✅ retry request
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        return handleAuthError(refreshError)
      }
    }

    /* ================= 403 ================= */
    if (status === 403 && shouldDisplayMessage) {
      message.error("Bạn không có quyền truy cập")
    }

    /* ================= 404 ================= */
    if (status === 404 && shouldDisplayMessage) {
      message.error("Không tìm thấy dữ liệu")
    }

    /* ================= 500 ================= */
    if (status === 500 && shouldDisplayMessage) {
      message.error("Lỗi server, vui lòng thử lại sau")
    }

    /* ================= NETWORK ================= */
    if (!error.response) {
      if (shouldDisplayMessage) {
        message.error("Lỗi mạng, kiểm tra kết nối")
      }
      return Promise.reject({
        message: "Network error",
        statusCode: 0,
      } as ApiError)
    }

    /* ================= DEFAULT ================= */
    const apiError: ApiError = {
      message: apiMessage,
      statusCode: status || 500,
      errors: error.response?.data?.errors,
    }

    if (shouldDisplayMessage) {
      message.error(apiError.message)
    }

    return Promise.reject(apiError)
  }
)

/* ================= AUTH ERROR ================= */

function handleAuthError(error: any) {
  console.error("[AUTH ERROR]", error)

  localStorage.clear()

  message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")

  window.location.href = "/login"

  return Promise.reject(error)
}

export default apiClient