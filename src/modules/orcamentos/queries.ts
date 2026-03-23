import { prisma } from '@/lib/prisma'

export async function getOrcamentos() {
  return prisma.orcamento.findMany({
    include: {
      cliente: { select: { id: true, name: true, company: true } },
      itens: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrcamentoById(id: string) {
  return prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, name: true, company: true } },
      itens: { orderBy: { descricao: 'asc' } },
    },
  })
}
