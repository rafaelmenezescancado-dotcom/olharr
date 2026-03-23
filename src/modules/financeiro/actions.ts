'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { z } from 'zod'

const transacaoSchema = z.object({
  contaId: z.string({ error: 'Conta é obrigatória' }),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  descricao: z.string({ error: 'Descrição é obrigatória' }).min(2),
  categoria: z.string().optional().nullable(),
  data: z.string(),
})

export async function criarTransacao(formData: FormData) {
  await requireRole(['ADMIN', 'FINANCEIRO'])

  const raw = {
    contaId: formData.get('contaId'),
    tipo: formData.get('tipo'),
    valor: formData.get('valor'),
    descricao: formData.get('descricao'),
    categoria: formData.get('categoria') || null,
    data: formData.get('data'),
  }

  const parsed = transacaoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.transaction.create({
      data: {
        contaId: d.contaId,
        tipo: d.tipo,
        valor: d.valor,
        descricao: d.descricao,
        categoria: d.categoria ?? null,
        data: new Date(d.data),
      },
    })
    revalidatePath('/financeiro')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar transação' }
  }
}

export async function deletarTransacao(id: string) {
  await requireRole(['ADMIN', 'FINANCEIRO'])
  try {
    await prisma.transaction.delete({ where: { id } })
    revalidatePath('/financeiro')
    return { success: true }
  } catch {
    return { error: 'Erro ao deletar transação' }
  }
}

const contaSchema = z.object({
  nome: z.string({ error: 'Nome é obrigatório' }).min(2),
  banco: z.string().optional().nullable(),
  tipo: z.string().default('CORRENTE'),
})

export async function criarConta(formData: FormData) {
  await requireRole(['ADMIN', 'FINANCEIRO'])
  const parsed = contaSchema.safeParse({
    nome: formData.get('nome'),
    banco: formData.get('banco') || null,
    tipo: formData.get('tipo') || 'CORRENTE',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    await prisma.financialAccount.create({ data: parsed.data })
    revalidatePath('/financeiro')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar conta' }
  }
}
