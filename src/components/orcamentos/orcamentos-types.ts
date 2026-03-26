import type { OrcamentoStatus } from '@/generated/prisma/client'

export type OrcamentoItem = {
  id: string
  descricao: string
  quantidade: number
  valorUnit: unknown
  categoria: string | null
}

export type Orcamento = {
  id: string
  titulo: string
  status: OrcamentoStatus
  vertical: string | null
  validoAte: Date | null
  totalBruto: unknown
  margem: unknown
  observacoes: string | null
  createdAt: Date
  cliente: { id: string; name: string; company: string | null }
  itens: OrcamentoItem[]
}

export type ClienteSimples = {
  id: string
  name: string
  company: string | null
}
