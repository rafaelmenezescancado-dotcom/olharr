import { z } from 'zod'

export const clienteSchema = z.object({
  name: z.string({ error: 'Nome é obrigatório' }).min(2, 'Mínimo 2 caracteres'),
  company: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  stage: z.enum([
    'NOVO_LEAD', 'PRIMEIRO_CONTATO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO',
    'FECHADO_GANHO', 'FECHADO_PERDIDO', 'INATIVO',
  ]).default('NOVO_LEAD'),
  retemISS: z.coerce.boolean().default(false),
  comoChegou: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  // Contato operacional
  opNome: z.string().optional().nullable(),
  opEmail: z.string().optional().nullable(),
  opTelefone: z.string().optional().nullable(),
  opCargo: z.string().optional().nullable(),
  opWhatsapp: z.string().optional().nullable(),
  // Contato financeiro
  finNome: z.string().optional().nullable(),
  finEmail: z.string().optional().nullable(),
  finTelefone: z.string().optional().nullable(),
  finCargo: z.string().optional().nullable(),
})

export type ClienteInput = z.infer<typeof clienteSchema>
