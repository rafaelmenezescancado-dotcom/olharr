'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { handleActionError } from '@/lib/logger'
import { z } from 'zod'
import type { FasePagamentoFreelancer } from '@/generated/prisma/client'

const pagamentoSchema = z.object({
  freelancerId: z.string({ error: 'Freelancer é obrigatório' }),
  projectId: z.string().optional().nullable(),
  escopo: z.string({ error: 'Escopo é obrigatório' }).min(2),
  valorCombinado: z.coerce.number().positive('Valor deve ser positivo'),
  combinadoNF: z.coerce.boolean().default(false),
  dataProjeto: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function criarPagamentoFreela(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const raw = {
    freelancerId: formData.get('freelancerId'),
    projectId: formData.get('projectId') || null,
    escopo: formData.get('escopo'),
    valorCombinado: formData.get('valorCombinado'),
    combinadoNF: formData.get('combinadoNF') === 'true',
    dataProjeto: formData.get('dataProjeto') || null,
    observacoes: formData.get('observacoes') || null,
  }

  const parsed = pagamentoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.pagamentoFreelancer.create({
      data: {
        freelancerId: d.freelancerId,
        projectId: d.projectId ?? null,
        escopo: d.escopo,
        valorCombinado: d.valorCombinado,
        combinadoNF: d.combinadoNF,
        dataProjeto: d.dataProjeto ? new Date(d.dataProjeto) : null,
        observacoes: d.observacoes ?? null,
      },
    })
    revalidatePath('/financeiro/pagamentos-freela')
    return { success: true }
  } catch (e) {
    return handleActionError('criarPagamentoFreela', e, 'Erro ao criar pagamento')
  }
}

export async function avancarFasePagamento(id: string, fase: FasePagamentoFreelancer) {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])
  try {
    await prisma.pagamentoFreelancer.update({
      where: { id },
      data: {
        fase,
        dataPagamento: fase === 'PAGO' ? new Date() : undefined,
      },
    })
    revalidatePath('/financeiro/pagamentos-freela')
    return { success: true }
  } catch (e) {
    return handleActionError('avancarFasePagamento', e, 'Erro ao atualizar fase', { entityId: id })
  }
}
