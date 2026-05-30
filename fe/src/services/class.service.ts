import api from '../api/axiosConfig'
export const classService = {
  getAll: (params?: any) => api.get('v1/classes', { params }),
  getOne: (id: string) => api.get(`v1/classes/${id}`),
  create: (data: any) => api.post('v1/classes', data),
  update: (id: string, data: any) => api.patch(`v1/classes/${id}`, data),
  delete: (id: string) => api.delete(`v1/classes/${id}`),
}