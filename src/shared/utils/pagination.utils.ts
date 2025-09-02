export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaginationUtils {
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
  ): PaginatedResult<T> {
    return {
      data,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
