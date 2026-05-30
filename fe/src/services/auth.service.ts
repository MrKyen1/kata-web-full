import { apiPost, apiGet } from "../api/apiClient"

import  { LoginResponse } from "../types/auth"

export const authService = {

  login: (data: { identifier: string; password: string }) =>  apiPost<LoginResponse>("v1/auth/login", data),
  me: () => apiGet("v1/auth/me"),
  refresh: (data: { refreshToken: string }) => apiPost("v1/auth/refresh", data),
  logout: (data: { refreshToken: string }) => apiPost("v1/auth/logout", data),
}
