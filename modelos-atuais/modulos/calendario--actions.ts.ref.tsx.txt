'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import type { PostStatus } from '@/generated/prisma/client'

export async function criarPost(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const titulo = (formData.get('titulo') as string)?.trim()
  if (!titulo) return { error: 'Título é obrigatório' }

  try {
    await prisma.post.create({
      data: {
        titulo,
        legenda: (formData.get('legenda') as string) || null,
        tipo: (formData.get('tipo') as string) || 'FEED',
        status: 'RASCUNHO',
        dataPublicacao: formData.get('dataPublicacao')
          ? new Date(formData.get('dataPublicacao') as string)
          : null,
      },
    })
    revalidatePath('/calendario')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar post' }
  }
}

export async function atualizarStatusPost(id: string, status: PostStatus) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.post.update({ where: { id }, data: { status } })
    revalidatePath('/calendario')
    return { success: true }
  } catch {
    return { error: 'Erro ao atualizar status' }
  }
}

export async function deletarPost(id: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.post.delete({ where: { id } })
    revalidatePath('/calendario')
    return { success: true }
  } catch {
    return { error: 'Erro ao deletar post' }
  }
}
