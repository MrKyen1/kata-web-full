import apiClient from "./axiosConfig"

export interface ApiRequestConfig {
  data?: any
  params?: Record<string, any>
  showErrorMessage?: boolean
}

export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  config?: ApiRequestConfig
): Promise<T> {
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`

  const res = await apiClient({
    method,
    url: normalizedUrl,
    data: config?.data,
    params: config?.params,
    showErrorMessage: config?.showErrorMessage,
  })

  return res.data.data
}

export const apiGet = <T = any>(url: string, params?: any, config?: { showErrorMessage?: boolean }) =>
  apiRequest<T>("GET", url, { params, showErrorMessage: config?.showErrorMessage })

export const apiPost = <T = any>(url: string, data?: any, config?: { showErrorMessage?: boolean }) =>
  apiRequest<T>("POST", url, { data, showErrorMessage: config?.showErrorMessage })

export const apiPatch = <T = any>(url: string, data?: any, config?: { showErrorMessage?: boolean }) =>
  apiRequest<T>("PATCH", url, { data, showErrorMessage: config?.showErrorMessage })

export const apiDelete = <T = any>(url: string, config?: { showErrorMessage?: boolean }) =>
  apiRequest<T>("DELETE", url, { showErrorMessage: config?.showErrorMessage })
