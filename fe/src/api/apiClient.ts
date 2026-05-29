import apiClient, { ApiResponse, ApiError } from "./axiosConfig";

/**
 * Generic API request wrapper
 * Handles type-safe API calls with error handling
 */
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  config?: {
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  }
): Promise<T> {
  try {
    const response = await apiClient({
      method,
      url,
      data: config?.data,
      params: config?.params,
      headers: config?.headers,
    });

    // Return data directly
    return response.data.data || response.data;
  } catch (error) {
    // Handle errors consistently
    handleApiError(error);
    throw error;
  }
}

/**
 * Error handling helper
 */
function handleApiError(error: any): ApiError {
  const apiError: ApiError = {
    message: error.message || "Có lỗi xảy ra",
    statusCode: error.statusCode || 500,
    errors: error.errors,
  };

  console.error("[API Error Handler]", apiError);
  return apiError;
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  url: string,
  params?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  return apiRequest<T>("GET", url, { params, headers });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  config?: { params?: Record<string, any>; headers?: Record<string, string> }
): Promise<T> {
  return apiRequest<T>("POST", url, { data, ...config });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  config?: { params?: Record<string, any>; headers?: Record<string, string> }
): Promise<T> {
  return apiRequest<T>("PUT", url, { data, ...config });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  url: string,
  data?: any,
  config?: { params?: Record<string, any>; headers?: Record<string, string> }
): Promise<T> {
  return apiRequest<T>("PATCH", url, { data, ...config });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  url: string,
  config?: { params?: Record<string, any>; headers?: Record<string, string> }
): Promise<T> {
  return apiRequest<T>("DELETE", url, config);
}
