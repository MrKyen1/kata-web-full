import { useState, useCallback } from "react";
import { ApiError } from "../api/axiosConfig";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  showErrorMessage?: boolean;
}

/**
 * Custom hook for API calls
 * Manages loading state, error state, and data
 */
export function useApi<T = any>(options?: UseApiOptions) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const call = useCallback(
    async (apiFunction: () => Promise<T>) => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await apiFunction();
        setState({ data: result, loading: false, error: null });
        options?.onSuccess?.(result);
        return result;
      } catch (error: any) {
        const apiError: ApiError = {
          message: error.message || "Có lỗi xảy ra",
          statusCode: error.statusCode || 500,
          errors: error.errors,
        };

        setState({ data: null, loading: false, error: apiError });
        options?.onError?.(apiError);

        throw apiError;
      }
    },
    [options]
  );

  return {
    ...state,
    call,
  };
}

/**
 * Custom hook for mutation API calls (POST, PUT, DELETE, PATCH)
 * Used when you want to trigger API on demand
 */
export function useApiMutation<T = any>(options?: UseApiOptions) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (apiFunction: () => Promise<T>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await apiFunction();
        setState({ data: result, loading: false, error: null });
        options?.onSuccess?.(result);
        return result;
      } catch (error: any) {
        const apiError: ApiError = {
          message: error.message || "Có lỗi xảy ra",
          statusCode: error.statusCode || 500,
          errors: error.errors,
        };

        setState({ data: null, loading: false, error: apiError });
        options?.onError?.(apiError);

        throw apiError;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
