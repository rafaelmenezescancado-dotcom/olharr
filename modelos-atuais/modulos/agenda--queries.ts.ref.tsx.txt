import { prisma } from '@/lib/prisma'

export async function getEventos() {
  return prisma.agendaEvent.findMany({
    include: {
      projeto: { select: { id: true, title: true } },
    },
    orderBy: { inicio: 'asc' },
  })
}

export async function getProximosEventos(limit = 10) {
  return prisma.agendaEvent.findMany({
    where: { inicio: { gte: new Date() } },
    include: {
      projeto: { select: { id: true, title: true } },
    },
    orderBy: { inicio: 'asc' },
    take: limit,
  })
}
