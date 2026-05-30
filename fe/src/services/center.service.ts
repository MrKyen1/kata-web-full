import { apiGet, apiPost, apiPatch, apiDelete } from "../api/apiClient"
import { Center } from "../types/center"

export const centerService = {
  getAll: (params?: any) => apiGet<Center[]>("v1/centers", params),

  getOne: (id: string) => apiGet<Center>(`v1/centers/${id}`),

  create: (data: any) => apiPost<Center>("v1/centers", data),

  update: (id: string, data: any) => apiPatch<Center>(`v1/centers/${id}`, data),

  delete: (id: string) => apiDelete(`v1/centers/${id}`),
}
