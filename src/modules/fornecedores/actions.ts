'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { handleActionError } from '@/lib/logger'
import { z } from 'zod'

const fornecedorSchema = z.object({
  nome: z.string({ error: 'Nome é obrigatório' }).min(2),
  servico: z.string({ error: 'Serviço é obrigatório' }).min(2),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  telefone: z.string().optional().nullable(),
  documento: z.string().optional().nullable(),
  valorHora: z.coerce.number().positive().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function criarFornecedor(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const raw = {
    nome: formData.get('nome'),
    servico: formData.get('servico'),
    email: formData.get('email') || null,
    telefone: formData.get('telefone') || null,
    documento: formData.get('documento') || null,
    valorHora: formData.get('valorHora') || null,
    observacoes: formData.get('observacoes') || null,
  }

  const parsed = fornecedorSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.fornecedor.create({
      data: {
        nome: d.nome,
        servico: d.servico,
        email: d.email || null,
        telefone: d.telefone ?? null,
        documento: d.documento ?? null,
        valorHora: d.valorHora ?? null,
        observacoes: d.observacoes ?? null,
      },
    })
    revalidatePath('/fornecedores')
    return { success: true }
  } catch (e) {
    return handleActionError('criarFornecedor', e, 'Erro ao criar fornecedor')
  }
}

export async function deletarFornecedor(id: string) {
  await requireRole(['ADMIN'])
  try {
    await prisma.fornecedor.delete({ where: { id } })
    revalidatePath('/fornecedores')
    return { success: true }
  } catch (e) {
    return handleActionError('deletarFornecedor', e, 'Erro ao deletar fornecedor', { entityId: id })
  }
}
