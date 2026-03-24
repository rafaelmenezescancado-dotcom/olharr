import { prisma } from '@/lib/prisma'

export async function getTurmas() {
  return prisma.turmaFormatura.findMany({
    include: {
      cliente: { select: { id: true, name: true, company: true } },
      formandos: {
        include: {
          parcelas: { orderBy: { vencimento: 'asc' } },
        },
      },
      eventos: {
        include: { custos: true },
        orderBy: { data: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTurmaById(id: string) {
  return prisma.turmaFormatura.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, name: true, company: true } },
      formandos: {
        include: {
          parcelas: { orderBy: { vencimento: 'asc' } },
        },
        orderBy: { nome: 'asc' },
      },
      eventos: {
        include: { custos: true },
        orderBy: { data: 'asc' },
      },
    },
  })
}
