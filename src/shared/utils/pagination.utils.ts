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

// Legacy cursor-based interfaces (mantener compatibilidad)
export interface CursorPaginationOptions {
  cursor?: string;
  size?: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  cursor?: string;
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
   * Método legacy para compatibilidad con código existente
   */
  static getSkip(page: number, limit: number): number {
    return this.getOffset(page, limit);
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

  /**
   * Convierte cursor-based a offset-based (para migración gradual)
   */
  static convertCursorToOffset(cursor?: string, size?: number): PaginationOptions {
    // Para cursor-based, podemos simular paginación
    // Esta es una implementación básica para mantener compatibilidad
    const limit = size || this.DEFAULT_LIMIT;
    const page = cursor ? 2 : 1; // Simplificado para el ejemplo
    
    return { page, limit };
  }

  /**
   * Método legacy para mantener compatibilidad con cursor-based pagination
   */
  static createLegacyPaginatedResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
  ): PaginatedResult<T> {
    return this.createPaginatedResult({ data, total }, options);
  }
}
