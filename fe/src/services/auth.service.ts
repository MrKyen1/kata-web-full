import { apiPost, apiGet } from "../api/apiClient"

import  { LoginResponse } from "../types/auth"

export const authService = {

  login: (
    data: { identifier: string; password: string },
    config?: { showErrorMessage?: boolean }
  ) => apiPost<LoginResponse>("v1/auth/login", data, config),
  me: () => apiGet("v1/auth/me"),
  refresh: (data: { refreshToken: string }) => apiPost("v1/auth/refresh", data),
  logout: (data: { refreshToken: string }) => apiPost("v1/auth/logout", data),
}
