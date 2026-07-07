export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: PaginationMeta | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
