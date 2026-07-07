export interface ApiError {
  success: false;
  message: string;
  data: null;
  meta: {
    errors: string[] | null;
    path: string;
    timestamp: string;
  };
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'success' in value && !(value as ApiError).success;
}
