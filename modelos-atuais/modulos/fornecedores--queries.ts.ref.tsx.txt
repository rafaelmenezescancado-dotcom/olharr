import { prisma } from '@/lib/prisma'

export async function getFornecedores() {
  return prisma.fornecedor.findMany({
    orderBy: { nome: 'asc' },
  })
}
