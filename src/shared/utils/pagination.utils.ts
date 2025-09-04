export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface RepositorySearchResult<T> {
  data: T[];
  total: number;
}

export class PaginationUtils {
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;

  /**
   * Crea un resultado paginado completo con metadata
   */
  static createPaginatedResult<T>(
    searchResult: RepositorySearchResult<T>,
    options: PaginationOptions,
  ): PaginatedResult<T> {
    const { data, total } = searchResult;
    const { page, limit } = options;
    
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Calcula el offset basado en página y límite
   */
  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Normaliza y valida las opciones de paginación
   */
  static normalizePaginationOptions(
    page?: number,
    limit?: number,
  ): PaginationOptions {
    const normalizedPage = Math.max(1, page || 1);
    const normalizedLimit = Math.min(
      this.MAX_LIMIT,
      Math.max(1, limit || this.DEFAULT_LIMIT),
    );

    return {
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  /**
   * Crea las opciones de paginación incluyendo offset para repositorio
   */
  static createRepositoryPaginationOptions(
    page?: number,
    limit?: number,
  ): PaginationOptions & { offset: number } {
    const options = this.normalizePaginationOptions(page, limit);
    
    return {
      ...options,
      offset: this.getOffset(options.page, options.limit),
    };
  }
}
