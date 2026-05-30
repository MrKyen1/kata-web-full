import api from '../api/axiosConfig'

export const roleService = {
  getAll: () => api.get('/roles'),
  create: (data: any) => api.post('v1/roles', data),
}

export const permissionService = {
  getAll: () => api.get('v1/permissions'),
}

export const rolePermissionService = {
  getMatrix: () => api.get('v1/role-permissions/matrix'),
  syncMatrix: (data: any) =>
    api.put('v1/role-permissions/matrix', data),
}