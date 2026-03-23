'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { clienteSchema } from './schemas'
import type { CrmStage } from '@/generated/prisma/client'

export async function criarCliente(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const raw = {
    name: formData.get('name'),
    company: formData.get('company') || null,
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    instagram: formData.get('instagram') || null,
    document: formData.get('document') || null,
    stage: formData.get('stage') || 'NOVO_LEAD',
    retemISS: formData.get('retemISS') === 'true',
    comoChegou: formData.get('comoChegou') || null,
    observacoes: formData.get('observacoes') || null,
    opNome: formData.get('opNome') || null,
    opEmail: formData.get('opEmail') || null,
    opTelefone: formData.get('opTelefone') || null,
    opCargo: formData.get('opCargo') || null,
    opWhatsapp: formData.get('opWhatsapp') || null,
    finNome: formData.get('finNome') || null,
    finEmail: formData.get('finEmail') || null,
    finTelefone: formData.get('finTelefone') || null,
    finCargo: formData.get('finCargo') || null,
  }

  const parsed = clienteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  try {
    const d = parsed.data
    await prisma.client.create({
      data: {
        name: d.name,
        company: d.company ?? null,
        email: d.email || null,
        phone: d.phone ?? null,
        instagram: d.instagram ?? null,
        document: d.document ?? null,
        stage: d.stage,
        retemISS: d.retemISS,
        comoChegou: d.comoChegou ?? null,
        observacoes: d.observacoes ?? null,
        contatoOperacional: d.opNome ? {
          create: {
            nome: d.opNome,
            email: d.opEmail ?? null,
            telefone: d.opTelefone ?? null,
            cargo: d.opCargo ?? null,
            whatsapp: d.opWhatsapp ?? null,
          },
        } : undefined,
        contatoFinanceiro: d.finNome ? {
          create: {
            nome: d.finNome,
            email: d.finEmail ?? null,
            telefone: d.finTelefone ?? null,
            cargo: d.finCargo ?? null,
          },
        } : undefined,
      },
    })
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar cliente' }
  }
}

export async function atualizarClienteStage(id: string, stage: CrmStage) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  try {
    await prisma.client.update({ where: { id }, data: { stage } })
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { error: 'Erro ao mover cliente' }
  }
}

export async function atualizarCliente(id: string, formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const raw = {
    name: formData.get('name'),
    company: formData.get('company') || null,
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    instagram: formData.get('instagram') || null,
    document: formData.get('document') || null,
    stage: formData.get('stage') || 'NOVO_LEAD',
    retemISS: formData.get('retemISS') === 'true',
    comoChegou: formData.get('comoChegou') || null,
    observacoes: formData.get('observacoes') || null,
    opNome: formData.get('opNome') || null,
    opEmail: formData.get('opEmail') || null,
    opTelefone: formData.get('opTelefone') || null,
    opCargo: formData.get('opCargo') || null,
    opWhatsapp: formData.get('opWhatsapp') || null,
    finNome: formData.get('finNome') || null,
    finEmail: formData.get('finEmail') || null,
    finTelefone: formData.get('finTelefone') || null,
    finCargo: formData.get('finCargo') || null,
  }

  const parsed = clienteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  try {
    const d = parsed.data
    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id },
        data: {
          name: d.name,
          company: d.company ?? null,
          email: d.email || null,
          phone: d.phone ?? null,
          instagram: d.instagram ?? null,
          document: d.document ?? null,
          stage: d.stage,
          retemISS: d.retemISS,
          comoChegou: d.comoChegou ?? null,
          observacoes: d.observacoes ?? null,
        },
      })

      if (d.opNome) {
        await tx.clienteContatoOperacional.upsert({
          where: { clienteId: id },
          create: { clienteId: id, nome: d.opNome, email: d.opEmail ?? null, telefone: d.opTelefone ?? null, cargo: d.opCargo ?? null, whatsapp: d.opWhatsapp ?? null },
          update: { nome: d.opNome, email: d.opEmail ?? null, telefone: d.opTelefone ?? null, cargo: d.opCargo ?? null, whatsapp: d.opWhatsapp ?? null },
        })
      }

      if (d.finNome) {
        await tx.clienteContatoFinanceiro.upsert({
          where: { clienteId: id },
          create: { clienteId: id, nome: d.finNome, email: d.finEmail ?? null, telefone: d.finTelefone ?? null, cargo: d.finCargo ?? null },
          update: { nome: d.finNome, email: d.finEmail ?? null, telefone: d.finTelefone ?? null, cargo: d.finCargo ?? null },
        })
      }
    })
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { error: 'Erro ao atualizar cliente' }
  }
}

export async function deletarCliente(id: string) {
  await requireRole(['ADMIN'])
  try {
    await prisma.client.delete({ where: { id } })
    revalidatePath('/crm')
    return { success: true }
  } catch {
    return { error: 'Erro ao deletar cliente' }
  }
}
