'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/require-role'
import { z } from 'zod'
import type { TaskStatus } from '@/generated/prisma/client'

const tarefaSchema = z.object({
  titulo: z.string({ error: 'Título é obrigatório' }).min(2),
  descricao: z.string().optional().nullable(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('PENDENTE'),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  projectId: z.string().optional().nullable(),
  responsavelId: z.string().optional().nullable(),
  dataVencimento: z.string().optional().nullable(),
})

export async function criarTarefa(formData: FormData) {
  await requireAuth()

  const raw = {
    titulo: formData.get('titulo'),
    descricao: formData.get('descricao') || null,
    status: formData.get('status') || 'PENDENTE',
    prioridade: formData.get('prioridade') || 'MEDIA',
    projectId: formData.get('projectId') || null,
    responsavelId: formData.get('responsavelId') || null,
    dataVencimento: formData.get('dataVencimento') || null,
  }

  const parsed = tarefaSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.tarefa.create({
      data: {
        titulo: d.titulo,
        descricao: d.descricao ?? null,
        status: d.status,
        prioridade: d.prioridade,
        projectId: d.projectId ?? null,
        responsavelId: d.responsavelId ?? null,
        dataVencimento: d.dataVencimento ? new Date(d.dataVencimento) : null,
      },
    })
    revalidatePath('/tarefas')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar tarefa' }
  }
}

export async function atualizarStatusTarefa(id: string, status: TaskStatus) {
  await requireAuth()
  try {
    await prisma.tarefa.update({
      where: { id },
      data: {
        status,
        concluidaEm: status === 'CONCLUIDA' ? new Date() : null,
      },
    })
    revalidatePath('/tarefas')
    return { success: true }
  } catch {
    return { error: 'Erro ao atualizar tarefa' }
  }
}

export async function deletarTarefa(id: string) {
  await requireAuth()
  try {
    await prisma.tarefa.delete({ where: { id } })
    revalidatePath('/tarefas')
    return { success: true }
  } catch {
    return { error: 'Erro ao deletar tarefa' }
  }
}
