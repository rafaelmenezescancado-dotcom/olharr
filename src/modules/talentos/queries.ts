import { prisma } from '@/lib/prisma'

export async function getFreelancers(search?: string) {
  return prisma.freelancer.findMany({
    where: {
      active: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { specialties: { hasSome: [search] } },
        ],
      } : undefined),
    },
    orderBy: { name: 'asc' },
  })
}
