import type {
  OrcamentoStatus,
  TaskStatus,
  TaskPriority,
  Vertente,
  TipoServico,
} from '@/generated/prisma/client'

// ─── Orçamento ──────────────────────────────────────────────────────────────

export type OrcamentoItem = {
  id: string
  descricao: string
  quantidade: number
  valorUnit: unknown // Decimal vem como unknown do Prisma
  categoria: string | null
}

export type OrcamentoVersaoType = {
  id: string
  versao: number
  snapshot: unknown // JSON
  totalBruto: unknown
  margem: unknown
  observacoes: string | null
  criadoPor: string | null
  createdAt: Date
}

export type OrcamentoTarefa = {
  id: string
  titulo: string
  descricao: string | null
  status: TaskStatus
  prioridade: TaskPriority
  dataVencimento: Date | null
  concluidaEm: Date | null
}

export type ClienteSimples = {
  id: string
  name: string
  company: string | null
}

export type OrcamentoFull = {
  id: string
  titulo: string
  status: OrcamentoStatus
  vertente: Vertente | null
  vertical: string | null
  validoAte: Date | null
  totalBruto: unknown
  margem: unknown
  margemPct: unknown
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
  cliente: ClienteSimples
  itens: OrcamentoItem[]
  itensCusto: ItemCustoOrcamentoType[]
  versoes: OrcamentoVersaoType[]
  tarefas: OrcamentoTarefa[]
}

// ─── Cost Builder ───────────────────────────────────────────────────────────

export type ItemCustoOrcamentoType = {
  id: string
  descricao: string
  horas: number | null
  custoTotal: unknown // Decimal
  servicoId: string | null
  opcaoId: string | null
  createdAt: Date
  servico?: ServicoBaseType | null
  opcao?: OpcaoServicoType | null
}

export type ServicoBaseType = {
  id: string
  nome: string
  tipo: TipoServico
  icone: string | null
  cor: string | null
  area: string
  custoPorHora: unknown // Decimal
  ativo: boolean
  ordem: number
  opcoes?: OpcaoServicoType[]
}

export type OpcaoServicoType = {
  id: string
  servicoId: string
  nome: string
  custo: unknown // Decimal
  ordem: number
  ativo: boolean
}
