import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type { PaginationParams } from '@/lib/pagination'
import { parsePagination, paginationArgs, paginatedResult } from '@/lib/pagination'

export async function getTransacoesComResumo(
  mes?: Date,
  pagination?: Partial<PaginationParams>
) {
  const referencia = mes ?? new Date()
  const inicio = startOfMonth(referencia)
  const fim = endOfMonth(referencia)
  const params = parsePagination(pagination)
  const { skip, take } = paginationArgs(params)

  const where = { data: { gte: inicio, lte: fim } }

  const [transacoes, total, contas] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        conta: { select: { id: true, nome: true, banco: true } },
      },
      orderBy: { data: 'desc' },
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
    prisma.financialAccount.findMany({
      where: { ativa: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // Aggregation via DB para evitar carregar tudo em memória
  const aggregation = await prisma.transaction.groupBy({
    by: ['tipo'],
    where,
    _sum: { valor: true },
  })

  const entradas = Number(aggregation.find(a => a.tipo === 'ENTRADA')?._sum.valor ?? 0)
  const saidas = Number(aggregation.find(a => a.tipo === 'SAIDA')?._sum.valor ?? 0)

  return {
    ...paginatedResult(transacoes, total, params),
    contas,
    entradas,
    saidas,
  }
}

export async function getContasBancarias() {
  return prisma.financialAccount.findMany({
    where: { ativa: true },
    orderBy: { nome: 'asc' },
  })
}

export async function getFluxoCaixa(meses = 6) {
  // Otimizado: uma única query com groupBy em vez de N queries em loop
  const inicio = startOfMonth(subMonths(new Date(), meses - 1))
  const fim = endOfMonth(new Date())

  const transacoes = await prisma.transaction.findMany({
    where: { data: { gte: inicio, lte: fim } },
    select: { tipo: true, valor: true, data: true },
  })

  // Agrupa manualmente por mês (evita N queries separadas)
  const mesesMap = new Map<string, { entradas: number; saidas: number }>()

  for (let i = meses - 1; i >= 0; i--) {
    const ref = subMonths(new Date(), i)
    const key = `${ref.getFullYear()}-${String(ref.getMonth()).padStart(2, '0')}`
    mesesMap.set(key, { entradas: 0, saidas: 0 })
  }

  for (const t of transacoes) {
    const d = new Date(t.data)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    const bucket = mesesMap.get(key)
    if (!bucket) continue
    const valor = Number(t.valor)
    if (t.tipo === 'ENTRADA') bucket.entradas += valor
    else if (t.tipo === 'SAIDA') bucket.saidas += valor
  }

  const resultado = []
  for (let i = meses - 1; i >= 0; i--) {
    const ref = subMonths(new Date(), i)
    const key = `${ref.getFullYear()}-${String(ref.getMonth()).padStart(2, '0')}`
    const bucket = mesesMap.get(key) ?? { entradas: 0, saidas: 0 }
    resultado.push({
      mes: ref.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      entradas: bucket.entradas,
      saidas: bucket.saidas,
      saldo: bucket.entradas - bucket.saidas,
    })
  }

  return resultado
}
