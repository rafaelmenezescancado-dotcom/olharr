'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { z } from 'zod'
import type { ParcelaStatus, TurmaStatus } from '@/generated/prisma/client'

const turmaSchema = z.object({
  curso: z.string().min(2, 'Curso é obrigatório'),
  faculdade: z.string().min(2, 'Faculdade é obrigatória'),
  semestre: z.string().min(1, 'Previsão de formatura é obrigatória'),
})

export async function criarTurma(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const raw = {
    curso: formData.get('curso'),
    faculdade: formData.get('faculdade'),
    semestre: formData.get('semestre'),
  }
  const parsed = turmaSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  try {
    const d = parsed.data
    const nome = `${d.curso} ${d.faculdade} ${d.semestre}`

    // Compute dataEvento from semestre (e.g. "2026.1" → July 2026, "2026.2" → Dec 2026)
    const [yearStr, halfStr] = d.semestre.split('.')
    const year = parseInt(yearStr)
    const month = halfStr === '1' ? 6 : 11 // July or December
    const dataEvento = new Date(year, month, 1)

    // Find or skip clienteId — use first client as placeholder
    const firstClient = await prisma.client.findFirst({ select: { id: true } })
    if (!firstClient) return { error: 'Cadastre um cliente antes de criar uma turma' }

    await prisma.turmaFormatura.create({
      data: {
        clienteId: firstClient.id,
        nome,
        status: 'ATIVA',
        dataEvento,
        observacoes: `Curso: ${d.curso} | Faculdade: ${d.faculdade} | Previsão: ${d.semestre}`,
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
