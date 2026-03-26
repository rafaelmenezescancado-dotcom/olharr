'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { handleActionError } from '@/lib/logger'
import type { OrcamentoStatus, Vertente, TaskPriority } from '@/generated/prisma/client'
import {
  criarOrcamentoSchema,
  adicionarItemCustoSchema,
  vincularTarefaSchema,
} from './schemas'

// ─── Orçamento CRUD ─────────────────────────────────────────────────────────

export async function criarOrcamento(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const raw = {
    clienteId: formData.get('clienteId'),
    titulo: formData.get('titulo'),
    vertente: formData.get('vertente') || undefined,
    vertical: formData.get('vertical') || undefined,
    validoAte: formData.get('validoAte') || undefined,
    margem: formData.get('margem') || undefined,
    margemPct: formData.get('margemPct') || undefined,
    observacoes: formData.get('observacoes') || undefined,
  }
  const parsed = criarOrcamentoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  try {
    const d = parsed.data
    const orcamento = await prisma.orcamento.create({
      data: {
        clienteId: d.clienteId,
        titulo: d.titulo,
        status: 'RASCUNHO' as OrcamentoStatus,
        vertente: (d.vertente as Vertente) ?? null,
        vertical: d.vertical ?? null,
        validoAte: d.validoAte ? new Date(d.validoAte) : null,
        margem: d.margem ?? null,
        margemPct: d.margemPct ?? null,
        observacoes: d.observacoes ?? null,
        totalBruto: 0,
      },
    })
    revalidatePath('/orcamentos')
    return { success: true, id: orcamento.id }
  } catch (e) {
    return handleActionError('criarOrcamento', e, 'Erro ao criar orçamento', { entityId: raw.clienteId as string })
  }
}

export async function atualizarStatusOrcamento(id: string, status: OrcamentoStatus) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.orcamento.update({ where: { id }, data: { status } })
    revalidatePath('/orcamentos')
    revalidatePath(`/orcamentos/${id}`)
    return { success: true }
  } catch (e) {
    return handleActionError('atualizarStatusOrcamento', e, 'Erro ao atualizar status', { entityId: id })
  }
}

export async function atualizarMargemOrcamento(id: string, margemPct: number) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.orcamento.update({ where: { id }, data: { margemPct } })
    revalidatePath('/orcamentos')
    revalidatePath(`/orcamentos/${id}`)
    return { success: true }
  } catch (e) {
    return handleActionError('atualizarMargemOrcamento', e, 'Erro ao atualizar margem', { entityId: id })
  }
}

export async function deletarOrcamento(id: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.orcamento.delete({ where: { id } })
    revalidatePath('/orcamentos')
    return { success: true }
  } catch (e) {
    return handleActionError('deletarOrcamento', e, 'Erro ao deletar orçamento', { entityId: id })
  }
}

// ─── Itens legados (OrcamentoItem) ──────────────────────────────────────────

export async function adicionarItem(orcamentoId: string, formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const descricao = (formData.get('descricao') as string)?.trim()
  const quantidade = Number(formData.get('quantidade')) || 1
  const valorUnit = Number(formData.get('valorUnit'))
  const categoria = (formData.get('categoria') as string) || null

  if (!descricao) return { error: 'Descrição é obrigatória' }
  if (!valorUnit || valorUnit <= 0) return { error: 'Valor inválido' }

  try {
    await prisma.$transaction(async tx => {
      await tx.orcamentoItem.create({
        data: { orcamentoId, descricao, quantidade, valorUnit, categoria },
      })
      const itens = await tx.orcamentoItem.findMany({ where: { orcamentoId } })
      const total = itens.reduce((sum, i) => sum + Number(i.valorUnit) * i.quantidade, 0)
      await tx.orcamento.update({ where: { id: orcamentoId }, data: { totalBruto: total } })
    })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    return { success: true }
  } catch (e) {
    return handleActionError('adicionarItem', e, 'Erro ao adicionar item', { entityId: orcamentoId })
  }
}

export async function removerItem(itemId: string, orcamentoId: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.$transaction(async tx => {
      await tx.orcamentoItem.delete({ where: { id: itemId } })
      const itens = await tx.orcamentoItem.findMany({ where: { orcamentoId } })
      const total = itens.reduce((sum, i) => sum + Number(i.valorUnit) * i.quantidade, 0)
      await tx.orcamento.update({ where: { id: orcamentoId }, data: { totalBruto: total } })
    })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    return { success: true }
  } catch (e) {
    return handleActionError('removerItem', e, 'Erro ao remover item', { entityId: itemId })
  }
}

// ─── Cost Builder (ItemCustoOrcamento) ──────────────────────────────────────

export async function adicionarItemCusto(orcamentoId: string, formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const raw = {
    servicoId: formData.get('servicoId') || undefined,
    opcaoId: formData.get('opcaoId') || undefined,
    descricao: formData.get('descricao'),
    horas: formData.get('horas') || undefined,
    custoTotal: formData.get('custoTotal'),
  }
  const parsed = adicionarItemCustoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.itemCustoOrcamento.create({
      data: {
        orcamentoId,
        servicoId: d.servicoId ?? null,
        opcaoId: d.opcaoId ?? null,
        descricao: d.descricao,
        horas: d.horas ?? null,
        custoTotal: d.custoTotal,
      },
    })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    revalidatePath('/orcamentos')
    return { success: true }
  } catch (e) {
    return handleActionError('adicionarItemCusto', e, 'Erro ao adicionar item de custo', { entityId: orcamentoId })
  }
}

export async function removerItemCusto(itemId: string, orcamentoId: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    await prisma.itemCustoOrcamento.delete({ where: { id: itemId } })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    revalidatePath('/orcamentos')
    return { success: true }
  } catch (e) {
    return handleActionError('removerItemCusto', e, 'Erro ao remover item de custo', { entityId: itemId })
  }
}

// ─── Versionamento ──────────────────────────────────────────────────────────

export async function criarVersao(orcamentoId: string, observacoes?: string) {
  const user = await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: {
        itens: true,
        itensCusto: {
          include: {
            servico: { select: { id: true, nome: true, tipo: true } },
            opcao: { select: { id: true, nome: true, custo: true } },
          },
        },
      },
    })
    if (!orcamento) return { error: 'Orçamento não encontrado' }

    // Determina próximo número de versão
    const ultimaVersao = await prisma.orcamentoVersao.findFirst({
      where: { orcamentoId },
      orderBy: { versao: 'desc' },
      select: { versao: true },
    })
    const proximaVersao = (ultimaVersao?.versao ?? 0) + 1

    // Cria snapshot com itens legados e itens de custo
    const snapshot = {
      itens: orcamento.itens.map(i => ({
        descricao: i.descricao,
        quantidade: i.quantidade,
        valorUnit: Number(i.valorUnit),
        categoria: i.categoria,
      })),
      itensCusto: orcamento.itensCusto.map(i => ({
        descricao: i.descricao,
        horas: i.horas,
        custoTotal: Number(i.custoTotal),
        servico: i.servico ? { nome: i.servico.nome, tipo: i.servico.tipo } : null,
        opcao: i.opcao ? { nome: i.opcao.nome, custo: Number(i.opcao.custo) } : null,
      })),
      margemPct: orcamento.margemPct ? Number(orcamento.margemPct) : null,
      vertente: orcamento.vertente,
    }

    await prisma.orcamentoVersao.create({
      data: {
        orcamentoId,
        versao: proximaVersao,
        snapshot,
        totalBruto: orcamento.totalBruto,
        margem: orcamento.margemPct,
        observacoes: observacoes ?? null,
        criadoPor: user.id,
      },
    })

    revalidatePath(`/orcamentos/${orcamentoId}`)
    return { success: true, versao: proximaVersao }
  } catch (e) {
    return handleActionError('criarVersao', e, 'Erro ao criar versão', { entityId: orcamentoId })
  }
}

export async function restaurarVersao(versaoId: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    const versao = await prisma.orcamentoVersao.findUnique({
      where: { id: versaoId },
    })
    if (!versao) return { error: 'Versão não encontrada' }

    const snapshot = versao.snapshot as {
      itens?: Array<{ descricao: string; quantidade: number; valorUnit: number; categoria: string | null }>
      itensCusto?: Array<{ descricao: string; horas: number | null; custoTotal: number; servico: { nome: string } | null; opcao: { nome: string } | null }>
      margemPct?: number | null
    }

    await prisma.$transaction(async tx => {
      // Remove itens atuais
      await tx.orcamentoItem.deleteMany({ where: { orcamentoId: versao.orcamentoId } })
      await tx.itemCustoOrcamento.deleteMany({ where: { orcamentoId: versao.orcamentoId } })

      // Restaura itens legados
      if (snapshot.itens?.length) {
        for (const item of snapshot.itens) {
          await tx.orcamentoItem.create({
            data: {
              orcamentoId: versao.orcamentoId,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valorUnit: item.valorUnit,
              categoria: item.categoria,
            },
          })
        }
      }

      // Restaura itens de custo (sem re-vincular serviço/opção — snapshot puro)
      if (snapshot.itensCusto?.length) {
        for (const item of snapshot.itensCusto) {
          await tx.itemCustoOrcamento.create({
            data: {
              orcamentoId: versao.orcamentoId,
              descricao: item.descricao,
              horas: item.horas,
              custoTotal: item.custoTotal,
            },
          })
        }
      }

      // Atualiza totalBruto e margem
      await tx.orcamento.update({
        where: { id: versao.orcamentoId },
        data: {
          totalBruto: versao.totalBruto,
          margemPct: snapshot.margemPct ?? null,
        },
      })
    })

    revalidatePath(`/orcamentos/${versao.orcamentoId}`)
    revalidatePath('/orcamentos')
    return { success: true }
  } catch (e) {
    return handleActionError('restaurarVersao', e, 'Erro ao restaurar versão', { entityId: versaoId })
  }
}

// ─── Tarefas vinculadas ─────────────────────────────────────────────────────

export async function vincularTarefa(orcamentoId: string, formData: FormData) {
  const user = await requireRole(['ADMIN', 'PRODUTOR'])
  const raw = {
    titulo: formData.get('titulo'),
    descricao: formData.get('descricao') || undefined,
    prioridade: formData.get('prioridade') || 'MEDIA',
    dataVencimento: formData.get('dataVencimento') || undefined,
    urgente: formData.get('urgente') === 'true',
    importante: formData.get('importante') === 'true',
  }
  const parsed = vincularTarefaSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  try {
    const d = parsed.data
    await prisma.tarefa.create({
      data: {
        titulo: d.titulo,
        descricao: d.descricao ?? null,
        prioridade: d.prioridade as TaskPriority,
        orcamentoId,
        responsavelId: user.id,
        urgente: d.urgente,
        importante: d.importante,
        dataVencimento: d.dataVencimento ? new Date(d.dataVencimento) : null,
      },
    })
    revalidatePath(`/orcamentos/${orcamentoId}`)
    return { success: true }
  } catch (e) {
    return handleActionError('vincularTarefa', e, 'Erro ao vincular tarefa', { entityId: orcamentoId })
  }
}

export async function concluirTarefa(tarefaId: string) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  try {
    const tarefa = await prisma.tarefa.update({
      where: { id: tarefaId },
      data: { status: 'CONCLUIDA', concluidaEm: new Date() },
    })
    if (tarefa.orcamentoId) {
      revalidatePath(`/orcamentos/${tarefa.orcamentoId}`)
    }
    revalidatePath('/tarefas')
    return { success: true }
  } catch (e) {
    return handleActionError('concluirTarefa', e, 'Erro ao concluir tarefa', { entityId: tarefaId })
  }
}

// ─── Serviços CRUD (para /servicos) ─────────────────────────────────────────

export async function criarServico(formData: FormData) {
  await requireRole(['ADMIN'])
  const nome = (formData.get('nome') as string)?.trim()
  const tipo = formData.get('tipo') as string
  const area = (formData.get('area') as string)?.trim()
  const icone = (formData.get('icone') as string) || null
  const cor = (formData.get('cor') as string) || null
  const custoPorHora = formData.get('custoPorHora') ? Number(formData.get('custoPorHora')) : null
  const ordem = Number(formData.get('ordem')) || 0

  if (!nome) return { error: 'Nome é obrigatório' }
  if (!tipo || !['HORA', 'OPCAO'].includes(tipo)) return { error: 'Tipo inválido' }
  if (!area) return { error: 'Área é obrigatória' }

  try {
    const servico = await prisma.servicoBase.create({
      data: {
        nome,
        tipo: tipo as 'HORA' | 'OPCAO',
        area,
        icone,
        cor,
        custoPorHora,
        ordem,
      },
    })
    revalidatePath('/servicos')
    return { success: true, id: servico.id }
  } catch (e) {
    return handleActionError('criarServico', e, 'Erro ao criar serviço')
  }
}

export async function atualizarServico(id: string, formData: FormData) {
  await requireRole(['ADMIN'])
  const nome = (formData.get('nome') as string)?.trim()
  const area = (formData.get('area') as string)?.trim()
  const icone = (formData.get('icone') as string) || null
  const cor = (formData.get('cor') as string) || null
  const custoPorHora = formData.get('custoPorHora') ? Number(formData.get('custoPorHora')) : null
  const ordem = Number(formData.get('ordem')) || 0
  const ativo = formData.get('ativo') !== 'false'

  if (!nome) return { error: 'Nome é obrigatório' }

  try {
    await prisma.servicoBase.update({
      where: { id },
      data: { nome, area: area ?? undefined, icone, cor, custoPorHora, ordem, ativo },
    })
    revalidatePath('/servicos')
    return { success: true }
  } catch (e) {
    return handleActionError('atualizarServico', e, 'Erro ao atualizar serviço', { entityId: id })
  }
}

export async function criarOpcaoServico(servicoId: string, formData: FormData) {
  await requireRole(['ADMIN'])
  const nome = (formData.get('nome') as string)?.trim()
  const custo = Number(formData.get('custo'))
  const ordem = Number(formData.get('ordem')) || 0

  if (!nome) return { error: 'Nome é obrigatório' }
  if (!custo || custo <= 0) return { error: 'Custo inválido' }

  try {
    await prisma.opcaoServico.create({
      data: { servicoId, nome, custo, ordem },
    })
    revalidatePath('/servicos')
    return { success: true }
  } catch (e) {
    return handleActionError('criarOpcaoServico', e, 'Erro ao criar opção', { entityId: servicoId })
  }
}

export async function removerOpcaoServico(opcaoId: string) {
  await requireRole(['ADMIN'])
  try {
    await prisma.opcaoServico.delete({ where: { id: opcaoId } })
    revalidatePath('/servicos')
    return { success: true }
  } catch (e) {
    return handleActionError('removerOpcaoServico', e, 'Erro ao remover opção', { entityId: opcaoId })
  }
}
