import type { Client, CrmStage } from '@/generated/prisma/client'

export type ClientWithContatos = Client & {
  contatoOperacional: {
    nome: string; email: string | null; telefone: string | null; cargo: string | null; whatsapp: string | null
  } | null
  contatoFinanceiro: {
    nome: string; email: string | null; telefone: string | null; cargo: string | null
  } | null
  _count?: { projetos: number; orcamentos: number }
}

export type ClientsByStage = Record<CrmStage, ClientWithContatos[]>

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  NOVO_LEAD: 'Novo Lead',
  PRIMEIRO_CONTATO: 'Primeiro Contato',
  PROPOSTA_ENVIADA: 'Proposta Enviada',
  NEGOCIACAO: 'Negociação',
  FECHADO_GANHO: 'Fechado Ganho',
  FECHADO_PERDIDO: 'Fechado Perdido',
  INATIVO: 'Inativo',
}

export const CRM_STAGE_ORDER: CrmStage[] = [
  'NOVO_LEAD',
  'PRIMEIRO_CONTATO',
  'PROPOSTA_ENVIADA',
  'NEGOCIACAO',
  'FECHADO_GANHO',
  'FECHADO_PERDIDO',
  'INATIVO',
]
