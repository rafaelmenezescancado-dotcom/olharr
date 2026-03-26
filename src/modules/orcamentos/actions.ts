'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { handleActionError } from '@/lib/logger'
import { z } from 'zod'
import type { OrcamentoStatus } from '@/generated/prisma/client'

const orcamentoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  titulo: z.string().min(2, 'Título é obrigatório'),
  status: z.enum(['RASCUNHO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'EXPIRADO']).default('RASCUNHO'),
  vertical: z.string().optional().nullable(),
  validoAte: z.string().optional().nullable(),
  margem: z.coerce.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function criarOrcamento(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const raw = {
    clienteId: formData.get('clienteId'),
    titulo: formData.get('titulo'),
    status: formData.get('status') || 'RASCUNHO',
    vertical: formData.get('vertical') || null,
    validoAte: formData.get('validoAte') || null,
    margem: formData.get('margem') || null,
    observacoes: formData.get('observacoes') || null,
  }
  const parsed = orcamentoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  try {
    const d = parsed.data
    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: d.clienteId,
        titulo: d.titulo,
        status: d.status as OrcamentoStatus,
        vertical: d.vertical ?? null,
        validoAte: d.validoAte ? new Date(d.validoAte) : null,
        margem: d.margem ?? null,
        observacoes: d.observacoes ?? null,
        totalBruto: 0,
      },
    })
    revalidatePath('/orcamentos')
    return { success: true, id: orcamento.id }
  } catch (e) {
    return handleActionError('criarOrcamento', e, 'Erro ao criar orçamento', { entityId: raw.clienteId as string })
  }
}

export async function atualizarStatusOrcamento(id: string, status: OrcamentoStatus) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.orcamento.update({ where: { id }, data: { status } })
    revalidatePath('/orcamentos')
    revalidatePath(`/orcamentos/${id}`)
    return { success: true }
  } catch (e) {
    return handleActionError('atualizarStatusOrcamento', e, 'Erro ao atualizar status', { entityId: id })
  }
}

export async function adicionarItem(orcamentoId: string, formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const descricao = (formData.get('descricao') as string)?.trim()
  const quantidade = Number(formData.get('quantidade')) || 1
  const valorUnit = Number(formData.get('valorUnit'))
  const categoria = (formData.get('categoria') as string) || null

  if (!descricao) return { error: 'Descrição é obrigatória' }
  if (!valorUnit || valorUnit <= 0) return { error: 'Valor inválido' }

  try {
    await prisma.$transaction(async tx => {
      await tx.orcamentoItem.create({
        data: { orcamentoId, descricao, quantidade, valorUnit, categoria },
      })
      // Recalculate totalBruto
      const itens = await tx.orcamentoItem.findMany({ where: { orcamentoId } })
      const total = itens.reduce((sum, i) => sum + Number(i.valorUnit) * i.quantidade, 0)
      await tx.orcamento.update({ where: { id: orcamentoId }, data: { totalBruto: total } })
    })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    return { success: true }
  } catch (e) {
    return handleActionError('adicionarItem', e, 'Erro ao adicionar item', { entityId: orcamentoId })
  }
}

export async function removerItem(itemId: string, orcamentoId: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.$transaction(async tx => {
      await tx.orcamentoItem.delete({ where: { id: itemId } })
      const itens = await tx.orcamentoItem.findMany({ where: { orcamentoId } })
      const total = itens.reduce((sum, i) => sum + Number(i.valorUnit) * i.quantidade, 0)
      await tx.orcamento.update({ where: { id: orcamentoId }, data: { totalBruto: total } })
    })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    return { success: true }
  } catch (e) {
    return handleActionError('removerItem', e, 'Erro ao remover item', { entityId: itemId })
  }
}

export async function deletarOrcamento(id: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.orcamento.delete({ where: { id } })
    revalidatePath('/orcamentos')
    return { success: true }
  } catch (e) {
    return handleActionError('deletarOrcamento', e, 'Erro ao deletar orçamento', { entityId: id })
  }
}
