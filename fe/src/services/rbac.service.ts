import { apiGet, apiPost } from '../api/apiClient'

export const roleService = {
  getAll: () => apiGet<any[]>('/roles'),
  create: (data: any) => apiPost('v1/roles', data),
}

export const permissionService = {
  getAll: () => apiGet<any[]>('v1/permissions'),
}

export const rolePermissionService = {
  getMatrix: () => apiGet<any[]>('v1/role-permissions/matrix'),
  syncMatrix: (data: any) => apiPost('v1/role-permissions/matrix', data),
}