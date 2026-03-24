'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/require-role'

export async function criarEvento(formData: FormData) {
  await requireAuth()
  const titulo = (formData.get('titulo') as string)?.trim()
  const inicio = formData.get('inicio') as string
  if (!titulo || !inicio) return { error: 'Título e data de início são obrigatórios' }

  try {
    await prisma.agendaEvent.create({
      data: {
        titulo,
        descricao: (formData.get('descricao') as string) || null,
        tipo: (formData.get('tipo') as string) || 'EVENTO',
        inicio: new Date(inicio),
        fim: formData.get('fim') ? new Date(formData.get('fim') as string) : null,
        allDay: formData.get('allDay') === 'true',
        projectId: (formData.get('projectId') as string) || null,
      },
    })
    revalidatePath('/agenda')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar evento' }
  }
}

export async function deletarEvento(id: string) {
  await requireAuth()
  try {
    await prisma.agendaEvent.delete({ where: { id } })
    revalidatePath('/agenda')
    return { success: true }
  } catch {
    return { error: 'Erro ao deletar evento' }
  }
}
