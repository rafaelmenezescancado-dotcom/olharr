import { prisma } from '@/lib/prisma'
import type { TaskStatus } from '@/generated/prisma/client'

export async function getTarefas(userId?: string) {
  return prisma.tarefa.findMany({
    where: userId ? { responsavelId: userId } : undefined,
    include: {
      projeto: { select: { id: true, title: true } },
      responsavel: { select: { id: true, name: true } },
    },
    orderBy: [
      { prioridade: 'desc' },
      { dataVencimento: 'asc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getTarefasByStatus() {
  const tarefas = await prisma.tarefa.findMany({
    where: { status: { not: 'CANCELADA' } },
    include: {
      projeto: { select: { id: true, title: true } },
      responsavel: { select: { id: true, name: true } },
    },
    orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
  })

  const statuses: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA']
  const byStatus = statuses.reduce((acc, s) => {
    acc[s] = tarefas.filter(t => t.status === s)
    return acc
  }, {} as Record<TaskStatus, typeof tarefas>)

  return byStatus
}
