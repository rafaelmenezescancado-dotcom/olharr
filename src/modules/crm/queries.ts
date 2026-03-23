import { prisma } from '@/lib/prisma'
import type { ClientsByStage, ClientWithContatos } from './types'
import { CRM_STAGE_ORDER } from './types'
import type { CrmStage } from '@/generated/prisma/client'

const clientSelect = {
  id: true,
  name: true,
  company: true,
  email: true,
  phone: true,
  instagram: true,
  document: true,
  stage: true,
  retemISS: true,
  possuiRegraPagamento: true,
  comoChegou: true,
  observacoes: true,
  createdAt: true,
  updatedAt: true,
  contatoOperacional: {
    select: { nome: true, email: true, telefone: true, cargo: true, whatsapp: true },
  },
  contatoFinanceiro: {
    select: { nome: true, email: true, telefone: true, cargo: true },
  },
} as const

export async function getClientesKanban(): Promise<ClientsByStage> {
  const clientes = await prisma.client.findMany({
    select: clientSelect,
    orderBy: { createdAt: 'desc' },
  })

  const byStage = CRM_STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = []
    return acc
  }, {} as ClientsByStage)

  for (const c of clientes) {
    byStage[c.stage as CrmStage].push(c as unknown as ClientWithContatos)
  }

  return byStage
}

export async function getClienteById(id: string): Promise<ClientWithContatos | null> {
  return prisma.client.findUnique({
    where: { id },
    select: clientSelect,
  }) as Promise<ClientWithContatos | null>
}
