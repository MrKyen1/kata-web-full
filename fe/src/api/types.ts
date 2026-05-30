export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  statusCode?: number
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}