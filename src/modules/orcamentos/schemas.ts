import { z } from 'zod/v4'

// ─── Orçamento CRUD ─────────────────────────────────────────────────────────

export const criarOrcamentoSchema = z.object({
  clienteId: z.string({ error: 'Selecione um cliente' }).min(1),
  titulo: z.string({ error: 'Título é obrigatório' }).min(1),
  vertente: z.enum(['CASAMENTO', 'EVENTO', 'CORPORATIVO', 'QUINZE_ANOS', 'ENSAIO', 'PUBLICITARIO']).optional(),
  vertical: z.string().optional(),
  validoAte: z.string().optional(),
  margem: z.coerce.number().optional(),
  margemPct: z.coerce.number().min(0).max(100).optional(),
  observacoes: z.string().optional(),
})

// ─── Item legado (OrcamentoItem) ────────────────────────────────────────────

export const adicionarItemSchema = z.object({
  descricao: z.string({ error: 'Descrição é obrigatória' }).min(1),
  quantidade: z.coerce.number().int().min(1).default(1),
  valorUnit: z.coerce.number({ error: 'Valor é obrigatório' }).positive(),
  categoria: z.string().optional(),
})

// ─── Cost Builder (ItemCustoOrcamento) ──────────────────────────────────────

export const adicionarItemCustoSchema = z.object({
  servicoId: z.string().optional(),
  opcaoId: z.string().optional(),
  descricao: z.string({ error: 'Descrição é obrigatória' }).min(1),
  horas: z.coerce.number().int().min(1).optional(),
  custoTotal: z.coerce.number({ error: 'Custo é obrigatório' }).positive(),
})

// ─── Versão ─────────────────────────────────────────────────────────────────

export const criarVersaoSchema = z.object({
  observacoes: z.string().optional(),
})

// ─── Tarefa vinculada ───────────────────────────────────────────────────────

export const vincularTarefaSchema = z.object({
  titulo: z.string({ error: 'Título é obrigatório' }).min(1),
  descricao: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  dataVencimento: z.string().optional(),
  urgente: z.coerce.boolean().default(false),
  importante: z.coerce.boolean().default(false),
})
