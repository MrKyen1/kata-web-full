import { apiGet, apiPost, apiPatch, apiDelete } from "../api/apiClient"

export const userService = {
  getAll: (params?: any) => apiGet<any[]>("v1/users", params),
  create: (data: any) => apiPost("v1/users", data),
  update: (id: string, data: any) => apiPatch(`v1/users/${id}`, data),
  delete: (id: string) => apiDelete(`v1/users/${id}`),
}
