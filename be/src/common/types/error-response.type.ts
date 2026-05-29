export type FieldErrors = Record<string, string[]>;

export interface ErrorResponseBody {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
  fieldErrors?: FieldErrors;
  path: string;
  requestId?: string;
  timestamp: string;
}

export interface NormalizedError {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
  fieldErrors?: FieldErrors;
}
