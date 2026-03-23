import type { Project, Client, User, ProjectCost, ProjectStage } from '@/generated/prisma/client'

export type ProjectWithRelations = Project & {
  cliente: Pick<Client, 'id' | 'name' | 'company'>
  responsavel: Pick<User, 'id' | 'name' | 'avatarUrl'> | null
  custos: ProjectCost[]
  labels: Array<{ label: { id: string; nome: string; cor: string } }>
}

export type ProjetosByStage = Record<ProjectStage, ProjectWithRelations[]>

export const STAGE_LABELS: Record<ProjectStage, string> = {
  OS_DISTRIBUICAO: 'OS / Distribuição',
  PRE_PRODUCAO: 'Pré-produção',
  DIA_DO_EVENTO: 'Dia do evento',
  POS_PRODUCAO: 'Pós-produção',
  EDICAO: 'Edição',
  REVISAO: 'Revisão',
  ENTREGUE: 'Entregue',
  ARQUIVADO: 'Arquivado',
}

export const STAGE_ORDER: ProjectStage[] = [
  'OS_DISTRIBUICAO',
  'PRE_PRODUCAO',
  'DIA_DO_EVENTO',
  'POS_PRODUCAO',
  'EDICAO',
  'REVISAO',
  'ENTREGUE',
  'ARQUIVADO',
]
