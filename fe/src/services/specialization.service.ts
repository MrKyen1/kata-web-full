import api from '../api/axiosConfig'
export const specializationService = {
  getAll: () => api.get('v1/specializations'),
  create: (data: any) => api.post('v1/specializations', data),
  update: (id: string, data: any) => api.patch(`v1/specializations/${id}`, data),
  delete: (id: string) => api.delete(`v1/specializations/${id}`),
}
