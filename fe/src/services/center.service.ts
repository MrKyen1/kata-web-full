import { apiGet, apiPost, apiPatch, apiDelete } from "../api/apiClient"

export const centerService = {
  getAll: (params?: any) => apiGet<any[]>("v1/centers", params),

  getOne: (id: string) => apiGet(`v1/centers/${id}`),

  create: (data: any) => apiPost("v1/centers", data),

  update: (id: string, data: any) => apiPatch(`v1/centers/${id}`, data),

  delete: (id: string) => apiDelete(`v1/centers/${id}`),
}
