export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: PaginationMeta | Record<string, unknown> | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
