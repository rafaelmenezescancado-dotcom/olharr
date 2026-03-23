import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function getTransacoesComResumo(mes?: Date) {
  const referencia = mes ?? new Date()
  const inicio = startOfMonth(referencia)
  const fim = endOfMonth(referencia)

  const [transacoes, contas] = await Promise.all([
    prisma.transaction.findMany({
      where: { data: { gte: inicio, lte: fim } },
      include: {
        conta: { select: { id: true, nome: true, banco: true } },
      },
      orderBy: { data: 'desc' },
    }),
    prisma.financialAccount.findMany({
      where: { ativa: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const entradas = transacoes
    .filter(t => t.tipo === 'ENTRADA')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const saidas = transacoes
    .filter(t => t.tipo === 'SAIDA')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  return { transacoes, contas, entradas, saidas }
}

export async function getContasBancarias() {
  return prisma.financialAccount.findMany({
    where: { ativa: true },
    orderBy: { nome: 'asc' },
  })
}

export async function getFluxoCaixa(meses = 6) {
  const resultado = []
  for (let i = meses - 1; i >= 0; i--) {
    const ref = subMonths(new Date(), i)
    const inicio = startOfMonth(ref)
    const fim = endOfMonth(ref)

    const transacoes = await prisma.transaction.findMany({
      where: { data: { gte: inicio, lte: fim } },
      select: { tipo: true, valor: true },
    })

    const entradas = transacoes.filter(t => t.tipo === 'ENTRADA').reduce((s, t) => s + Number(t.valor), 0)
    const saidas = transacoes.filter(t => t.tipo === 'SAIDA').reduce((s, t) => s + Number(t.valor), 0)

    resultado.push({
      mes: ref.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      entradas,
      saidas,
      saldo: entradas - saidas,
    })
  }
  return resultado
}
