'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { z } from 'zod'

const freelancerSchema = z.object({
  name: z.string({ error: 'Nome é obrigatório' }).min(2),
  fullName: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  pixType: z.string().optional().nullable(),
  hasCar: z.coerce.boolean().default(false),
  specialties: z.string().optional().nullable(), // CSV
  instagram: z.string().optional().nullable(),
  portfolio: z.string().optional().nullable(),
  dailyRate: z.coerce.number().positive().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export async function criarFreelancer(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const specialtiesRaw = formData.get('specialties') as string
  const specialties = specialtiesRaw ? specialtiesRaw.split(',').map(s => s.trim()).filter(Boolean) : []

  const raw = {
    name: formData.get('name'),
    fullName: formData.get('fullName') || null,
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    cpf: formData.get('cpf') || null,
    pixKey: formData.get('pixKey') || null,
    pixType: formData.get('pixType') || null,
    hasCar: formData.get('hasCar') === 'true',
    instagram: formData.get('instagram') || null,
    portfolio: formData.get('portfolio') || null,
    dailyRate: formData.get('dailyRate') || null,
    observacoes: formData.get('observacoes') || null,
  }

  const parsed = freelancerSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.freelancer.create({
      data: {
        name: d.name,
        fullName: d.fullName ?? null,
        email: d.email || null,
        phone: d.phone ?? null,
        cpf: d.cpf ?? null,
        pixKey: d.pixKey ?? null,
        pixType: d.pixType ?? null,
        hasCar: d.hasCar,
        specialties,
        instagram: d.instagram ?? null,
        portfolio: d.portfolio ?? null,
        dailyRate: d.dailyRate ?? null,
        observacoes: d.observacoes ?? null,
      },
    })
    revalidatePath('/talentos')
    return { success: true }
  } catch {
    return { error: 'Erro ao criar freelancer' }
  }
}

export async function deletarFreelancer(id: string) {
  await requireRole(['ADMIN'])
  try {
    await prisma.freelancer.update({ where: { id }, data: { active: false } })
    revalidatePath('/talentos')
    return { success: true }
  } catch {
    return { error: 'Erro ao remover freelancer' }
  }
}
