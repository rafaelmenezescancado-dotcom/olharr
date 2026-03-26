'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { handleActionError } from '@/lib/logger'
import { checkOwnership } from '@/lib/auth/check-ownership'
import { projetoSchema, updateStageSchema } from './schemas'

export async function criarProjeto(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const raw = {
    title: formData.get('title'),
    clienteId: formData.get('clienteId'),
    responsavelId: formData.get('responsavelId') || null,
    stage: formData.get('stage') || 'OS_DISTRIBUICAO',
    vertical: formData.get('vertical') || null,
    dataEvento: formData.get('dataEvento') || null,
    dataEntrega: formData.get('dataEntrega') || null,
    revenueExpected: formData.get('revenueExpected') || null,
    observacoes: formData.get('observacoes') || null,
  }

  const parsed = projetoSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  try {
    const data = parsed.data
    await prisma.project.create({
      data: {
        title: data.title,
        clienteId: data.clienteId,
        responsavelId: data.responsavelId ?? null,
        stage: data.stage,
        vertical: data.vertical ?? null,
        dataEvento: data.dataEvento ? new Date(data.dataEvento) : null,
        dataEntrega: data.dataEntrega ? new Date(data.dataEntrega) : null,
        revenueExpected: data.revenueExpected ?? null,
        observacoes: data.observacoes ?? null,
      },
    })
    revalidatePath('/projetos')
    return { success: true }
  } catch (e) {
    return handleActionError('criarProjeto', e, 'Erro ao criar projeto')
  }
}

export async function atualizarProjeto(id: string, formData: FormData) {
  const user = await requireRole(['ADMIN', 'PRODUTOR'])

  // Verifica se o usuário pode editar este projeto
  const projeto = await prisma.project.findUnique({ where: { id }, select: { responsavelId: true } })
  const denied = checkOwnership(user, projeto?.responsavelId, 'Sem permissão para editar este projeto')
  if (denied) return denied

  const raw = {
    title: formData.get('title'),
    clienteId: formData.get('clienteId'),
    responsavelId: formData.get('responsavelId') || null,
    stage: formData.get('stage') || 'OS_DISTRIBUICAO',
    vertical: formData.get('vertical') || null,
    dataEvento: formData.get('dataEvento') || null,
    dataEntrega: formData.get('dataEntrega') || null,
    revenueExpected: formData.get('revenueExpected') || null,
    observacoes: formData.get('observacoes') || null,
  }

  const parsed = projetoSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  try {
    const data = parsed.data
    await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        clienteId: data.clienteId,
        responsavelId: data.responsavelId ?? null,
        stage: data.stage,
        vertical: data.vertical ?? null,
        dataEvento: data.dataEvento ? new Date(data.dataEvento) : null,
        dataEntrega: data.dataEntrega ? new Date(data.dataEntrega) : null,
        revenueExpected: data.revenueExpected ?? null,
        observacoes: data.observacoes ?? null,
      },
    })
    revalidatePath('/projetos')
    return { success: true }
  } catch (e) {
    return handleActionError('atualizarProjeto', e, 'Erro ao atualizar projeto', { entityId: id })
  }
}

export async function moverProjetoStage(id: string, stage: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const parsed = updateStageSchema.safeParse({ id, stage })
  if (!parsed.success) return { error: 'Stage inválido' }

  try {
    await prisma.project.update({
      where: { id: parsed.data.id },
      data: { stage: parsed.data.stage },
    })
    revalidatePath('/projetos')
    return { success: true }
  } catch (e) {
    return handleActionError('moverProjetoStage', e, 'Erro ao mover projeto', { entityId: id })
  }
}

export async function deletarProjeto(id: string) {
  const user = await requireRole(['ADMIN'])

  // Double-check: só ADMIN pode deletar, mas log quem fez
  const projeto = await prisma.project.findUnique({ where: { id }, select: { title: true } })
  if (!projeto) return { error: 'Projeto não encontrado' }

  try {
    await prisma.project.delete({ where: { id } })
    revalidatePath('/projetos')
    return { success: true }
  } catch (e) {
    return handleActionError('deletarProjeto', e, 'Erro ao deletar projeto', { entityId: id })
  }
}
