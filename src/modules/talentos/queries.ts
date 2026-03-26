import { prisma } from '@/lib/prisma'
import type { PaginationParams } from '@/lib/pagination'
import { parsePagination, paginationArgs, paginatedResult } from '@/lib/pagination'

export async function getFreelancers(
  search?: string,
  pagination?: Partial<PaginationParams>
) {
  const params = parsePagination(pagination)
  const { skip, take } = paginationArgs(params)

  const where = {
    active: true,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { specialties: { hasSome: [search] } },
      ],
    } : undefined),
  }

  const [data, total] = await Promise.all([
    prisma.freelancer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.freelancer.count({ where }),
  ])

  return paginatedResult(data, total, params)
}
