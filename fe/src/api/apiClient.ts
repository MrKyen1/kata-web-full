import apiClient from "./axiosConfig"

export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  config?: {
    data?: any
    params?: Record<string, any>
  }
): Promise<T> {
  const res = await apiClient({
    method,
    url,
    data: config?.data,
    params: config?.params,
  })

  return res.data.data
}

export const apiGet = <T>(url: string, params?: any) =>
  apiRequest<T>("GET", url, { params })

export const apiPost = <T>(url: string, data?: any) =>
  apiRequest<T>("POST", url, { data })

export const apiPatch = <T>(url: string, data?: any) =>
  apiRequest<T>("PATCH", url, { data })

export const apiDelete = <T>(url: string) =>
  apiRequest<T>("DELETE", url)
