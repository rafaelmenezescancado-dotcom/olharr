import { prisma } from '@/lib/prisma'
import type { FasePagamentoFreelancer } from '@/generated/prisma/client'

const FASES: FasePagamentoFreelancer[] = [
  'CONTRATACAO',
  'AGUARDANDO_EVENTO',
  'LANCAMENTO_DRE',
  'PAGO',
  'ARQUIVADO',
]

export async function getPagamentosKanban() {
  const pagamentos = await prisma.pagamentoFreelancer.findMany({
    where: { fase: { not: 'ARQUIVADO' } },
    include: {
      freelancer: { select: { id: true, name: true } },
      projeto: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const byFase = FASES.reduce((acc, fase) => {
    acc[fase] = []
    return acc
  }, {} as Record<FasePagamentoFreelancer, typeof pagamentos>)

  for (const p of pagamentos) {
    byFase[p.fase].push(p)
  }

  return byFase
}

export { FASES }
