export interface BaseResponse<T> {
  code: number | string;
  data: T | null;
  message: string;
  pagination?: PaginationData;
}

export interface PaginationData {
  page: number;
  page_count: number;
  page_size: number;
  total: number;
}

export interface PaginatedResult<T> {
  list: T[];
  pagination: PaginationData;
  total: number;
}
