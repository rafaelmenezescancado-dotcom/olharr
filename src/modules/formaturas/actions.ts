'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { z } from 'zod'
import type { ParcelaStatus, TurmaStatus } from '@/generated/prisma/client'

const turmaSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  nome: z.string().min(2, 'Nome é obrigatório'),
  status: z.enum(['ATIVA', 'CONCLUIDA', 'CANCELADA']).default('ATIVA'),
  dataEvento: z.string().optional().nullable(),
  valorTotal: z.coerce.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function criarTurma(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const raw = {
    clienteId: formData.get('clienteId'),
    nome: formData.get('nome'),
    status: formData.get('status') || 'ATIVA',
    dataEvento: formData.get('dataEvento') || null,
    valorTotal: formData.get('valorTotal') || null,
    observacoes: formData.get('observacoes') || null,
  }
  const parsed = turmaSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  try {
    const d = parsed.data
    await prisma.turmaFormatura.create({
      data: {
        clienteId: d.clienteId,
        nome: d.nome,
        status: d.status as TurmaStatus,
        dataEvento: d.dataEvento ? new Date(d.dataEvento) : null,
        valorTotal: d.valorTotal ?? null,
        observacoes: d.observacoes ?? null,
      },
    })
    revalidatePath('/formaturas')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar turma' }
  }
}

export async function atualizarStatusTurma(id: string, status: TurmaStatus) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.turmaFormatura.update({ where: { id }, data: { status } })
    revalidatePath('/formaturas')
    revalidatePath(`/formaturas/${id}`)
    return { success: true }
  } catch {
    return { error: 'Erro ao atualizar status' }
  }
}

export async function criarFormando(turmaId: string, formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const nome = formData.get('nome') as string
  if (!nome?.trim()) return { error: 'Nome é obrigatório' }
  try {
    await prisma.formando.create({
      data: {
        turmaId,
        nome: nome.trim(),
        email: (formData.get('email') as string) || null,
        telefone: (formData.get('telefone') as string) || null,
      },
    })
    revalidatePath(`/formaturas/${turmaId}`)
    return { success: true }
  } catch {
    return { error: 'Erro ao adicionar formando' }
  }
}

export async function deletarFormando(id: string, turmaId: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.formando.delete({ where: { id } })
    revalidatePath(`/formaturas/${turmaId}`)
    return { success: true }
  } catch {
    return { error: 'Erro ao remover formando' }
  }
}

export async function criarParcela(formandoId: string, turmaId: string, formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])
  const valorRaw = formData.get('valor')
  const vencimentoRaw = formData.get('vencimento') as string
  const valor = Number(valorRaw)
  if (!valor || valor <= 0) return { error: 'Valor inválido' }
  if (!vencimentoRaw) return { error: 'Vencimento é obrigatório' }
  try {
    await prisma.parcelaFormando.create({
      data: {
        formandoId,
        valor,
        vencimento: new Date(vencimentoRaw),
        status: 'PENDENTE',
      },
    })
    revalidatePath(`/formaturas/${turmaId}`)
    return { success: true }
  } catch {
    return { error: 'Erro ao criar parcela' }
  }
}

export async function atualizarStatusParcela(id: string, turmaId: string, status: ParcelaStatus) {
  await requireRole(['ADMIN', 'FINANCEIRO'])
  try {
    await prisma.parcelaFormando.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAGO' ? new Date() : null,
      },
    })
    revalidatePath(`/formaturas/${turmaId}`)
    return { success: true }
  } catch {
    return { error: 'Erro ao atualizar parcela' }
  }
}
