import { apiGet, apiPost, apiPatch, apiDelete } from '../api/apiClient'

export const classService = {
  getAll: (params?: any) => apiGet<any[]>('v1/classes', params),
  getOne: (id: string) => apiGet(`v1/classes/${id}`),
  create: (data: any) => apiPost('v1/classes', data),
  update: (id: string, data: any) => apiPatch(`v1/classes/${id}`, data),
  delete: (id: string) => apiDelete(`v1/classes/${id}`),
}