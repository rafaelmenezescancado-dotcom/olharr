/**
 * Utilitários de paginação para queries Prisma.
 *
 * Uso:
 *   const { page, pageSize } = parsePagination(searchParams)
 *   const { skip, take } = paginationArgs(page, pageSize)
 *   const dados = await prisma.model.findMany({ ...skip, ...take, ... })
 */

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Parseia parâmetros de paginação de searchParams ou valores diretos.
 */
export function parsePagination(
  params?: { page?: string | number; pageSize?: string | number } | null
): PaginationParams {
  const page = Math.max(1, Number(params?.page) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params?.pageSize) || DEFAULT_PAGE_SIZE))
  return { page, pageSize }
}

/**
 * Gera skip/take para Prisma a partir de PaginationParams.
 */
export function paginationArgs(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  }
}

/**
 * Wrapper completo: recebe data[], total count, e params → retorna PaginatedResult.
 */
export function paginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  }
}
