import { z } from 'zod'

export const projetoSchema = z.object({
  title: z.string({ error: 'Título é obrigatório' }).min(2, 'Mínimo 2 caracteres'),
  clienteId: z.string({ error: 'Cliente é obrigatório' }),
  responsavelId: z.string().optional().nullable(),
  stage: z.enum([
    'OS_DISTRIBUICAO', 'PRE_PRODUCAO', 'DIA_DO_EVENTO', 'POS_PRODUCAO',
    'EDICAO', 'REVISAO', 'ENTREGUE', 'ARQUIVADO',
  ]).default('OS_DISTRIBUICAO'),
  vertical: z.string().optional().nullable(),
  dataEvento: z.string().optional().nullable(),
  dataEntrega: z.string().optional().nullable(),
  revenueExpected: z.coerce.number().positive().optional().nullable(),
  observacoes: z.string().optional().nullable(),
})

export const updateStageSchema = z.object({
  id: z.string(),
  stage: z.enum([
    'OS_DISTRIBUICAO', 'PRE_PRODUCAO', 'DIA_DO_EVENTO', 'POS_PRODUCAO',
    'EDICAO', 'REVISAO', 'ENTREGUE', 'ARQUIVADO',
  ]),
})

export type ProjetoInput = z.infer<typeof projetoSchema>
