import { prisma } from '@/lib/prisma'

export async function getOrcamentos() {
  return prisma.orcamento.findMany({
    include: {
      cliente: { select: { id: true, name: true, company: true } },
      itens: true,
      itensCusto: {
        include: {
          servico: { select: { id: true, nome: true, tipo: true, icone: true, cor: true } },
          opcao: { select: { id: true, nome: true, custo: true } },
        },
      },
      _count: { select: { versoes: true, tarefas: true } },
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
      itensCusto: {
        include: {
          servico: { select: { id: true, nome: true, tipo: true, icone: true, cor: true, area: true, custoPorHora: true } },
          opcao: { select: { id: true, nome: true, custo: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      versoes: { orderBy: { versao: 'desc' } },
      tarefas: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function getVersoes(orcamentoId: string) {
  return prisma.orcamentoVersao.findMany({
    where: { orcamentoId },
    orderBy: { versao: 'desc' },
  })
}

export async function getTarefasDoOrcamento(orcamentoId: string) {
  return prisma.tarefa.findMany({
    where: { orcamentoId },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Catálogo de Serviços (para o Cost Builder) ─────────────────────────────

export async function getServicosAtivos() {
  return prisma.servicoBase.findMany({
    where: { ativo: true },
    include: {
      opcoes: {
        where: { ativo: true },
        orderBy: { ordem: 'asc' },
      },
    },
    orderBy: { ordem: 'asc' },
  })
}

export async function getServicoById(id: string) {
  return prisma.servicoBase.findUnique({
    where: { id },
    include: {
      opcoes: { orderBy: { ordem: 'asc' } },
    },
  })
}

// ─── Catálogo CRUD (para /servicos) ─────────────────────────────────────────

export async function getServicos() {
  return prisma.servicoBase.findMany({
    include: {
      opcoes: { orderBy: { ordem: 'asc' } },
      _count: { select: { itens: true } },
    },
    orderBy: { ordem: 'asc' },
  })
}
