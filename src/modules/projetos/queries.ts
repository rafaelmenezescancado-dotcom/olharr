import { prisma } from '@/lib/prisma'
import type { ProjectWithRelations, ProjetosByStage } from './types'
import { STAGE_ORDER } from './types'
import type { ProjectStage } from '@/generated/prisma/client'

const projectSelect = {
  id: true,
  title: true,
  clienteId: true,
  responsavelId: true,
  stage: true,
  vertical: true,
  dataEvento: true,
  dataEntrega: true,
  revenueExpected: true,
  observacoes: true,
  createdAt: true,
  updatedAt: true,
  cliente: { select: { id: true, name: true, company: true } },
  responsavel: { select: { id: true, name: true, avatarUrl: true } },
  custos: true,
  labels: {
    include: {
      label: { select: { id: true, nome: true, cor: true } },
    },
  },
} as const

export async function getProjetosKanban(): Promise<ProjetosByStage> {
  const projetos = await prisma.project.findMany({
    where: { stage: { not: 'ARQUIVADO' } },
    select: projectSelect,
    orderBy: { createdAt: 'desc' },
  })

  const byStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = []
    return acc
  }, {} as ProjetosByStage)

  for (const p of projetos) {
    byStage[p.stage as ProjectStage].push(p as unknown as ProjectWithRelations)
  }

  return byStage
}

export async function getProjetoById(id: string): Promise<ProjectWithRelations | null> {
  return prisma.project.findUnique({
    where: { id },
    select: projectSelect,
  }) as Promise<ProjectWithRelations | null>
}

export async function getProjetosList() {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      stage: true,
      cliente: { select: { name: true } },
      dataEvento: true,
      revenueExpected: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getClientesForSelect() {
  return prisma.client.findMany({
    select: { id: true, name: true, company: true },
    orderBy: { name: 'asc' },
  })
}

export async function getUsersForSelect() {
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  })
}
