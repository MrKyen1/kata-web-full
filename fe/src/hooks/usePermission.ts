import { useAuth } from '../contexts/AuthContext'

export const usePermission = () => {
  const { permissions } = useAuth()

  const hasPermission = (code: string) => {
    return permissions.includes(code)
  }

  return {
    permissions,
    hasPermission,
  }
}
