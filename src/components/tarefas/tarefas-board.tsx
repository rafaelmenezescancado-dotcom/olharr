'use client'

import { useState } from 'react'
import { Plus, Calendar, Trash2, Check, Clock, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { criarTarefa, atualizarStatusTarefa, deletarTarefa } from '@/modules/tarefas/actions'
import type { TaskStatus, TaskPriority } from '@/generated/prisma/client'

type Tarefa = {
  id: string
  titulo: string
  descricao: string | null
  status: TaskStatus
  prioridade: TaskPriority
  dataVencimento: Date | null
  projeto: { id: string; title: string } | null
  responsavel: { id: string; name: string } | null
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: 'Pendente', color: '#8B82A0', icon: <Clock size={14} /> },
  EM_ANDAMENTO: { label: 'Em andamento', color: '#1E7FCD', icon: <AlertCircle size={14} /> },
  CONCLUIDA: { label: 'Concluída', color: '#22C55E', icon: <Check size={14} /> },
  CANCELADA: { label: 'Cancelada', color: '#EF4444', icon: <Trash2 size={14} /> },
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  BAIXA: '#22C55E',
  MEDIA: '#F59E0B',
  ALTA: '#F97316',
  URGENTE: '#EF4444',
}

const PRIORIDADE_LABELS: Record<TaskPriority, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

interface TarefasBoardProps {
  byStatus: Record<TaskStatus, Tarefa[]>
  projetos: Array<{ id: string; title: string }>
  users: Array<{ id: string; name: string }>
}

export function TarefasBoard({ byStatus, projetos, users }: TarefasBoardProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusOrder: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA']

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarTarefa(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setFormOpen(false)
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  const totalAtivas = (byStatus.PENDENTE?.length ?? 0) + (byStatus.EM_ANDAMENTO?.length ?? 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Tarefas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {totalAtivas} tarefa{totalAtivas !== 1 ? 's' : ''} ativa{totalAtivas !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Nova tarefa
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {statusOrder.map(status => {
          const tarefas = byStatus[status] ?? []
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col">
              <div
                className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
                style={{ background: `${cfg.color}15` }}
              >
                <div className="flex items-center gap-2" style={{ color: cfg.color }}>
                  {cfg.icon}
                  <span className="text-xs font-semibold">{cfg.label}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}25`, color: cfg.color }}>
                  {tarefas.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {tarefas.map(t => (
                  <TarefaCard key={t.id} tarefa={t} />
                ))}
                {tarefas.length === 0 && (
                  <div
                    className="rounded-xl border border-dashed p-5 text-center text-xs"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-subtle)' }}
                  >
                    Nenhuma tarefa
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Nova tarefa</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Título *</label>
                <input name="titulo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Prioridade</label>
                  <select name="prioridade" defaultValue="MEDIA" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                    {(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as TaskPriority[]).map(p => (
                      <option key={p} value={p}>{PRIORIDADE_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Vencimento</label>
                  <input type="date" name="dataVencimento" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Projeto</label>
                <select name="projectId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                  <option value="">Sem projeto</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Responsável</label>
                <select name="responsavelId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                  <option value="">Sem responsável</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Descrição</label>
                <textarea name="descricao" rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} />
              </div>

              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Criando...' : 'Criar tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function TarefaCard({ tarefa }: { tarefa: Tarefa }) {
  const [moving, setMoving] = useState(false)

  const nextStatus: Record<TaskStatus, TaskStatus | null> = {
    PENDENTE: 'EM_ANDAMENTO',
    EM_ANDAMENTO: 'CONCLUIDA',
    CONCLUIDA: null,
    CANCELADA: null,
  }

  async function handleAdvance() {
    const next = nextStatus[tarefa.status]
    if (!next || moving) return
    setMoving(true)
    await atualizarStatusTarefa(tarefa.id, next)
    setMoving(false)
  }

  async function handleDelete() {
    if (!confirm('Deletar tarefa?')) return
    await deletarTarefa(tarefa.id)
  }

  const isOverdue = tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date() && tarefa.status !== 'CONCLUIDA'

  return (
    <div
      className="rounded-xl border p-3.5 group"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: PRIORITY_COLORS[tarefa.prioridade] }}
        />
        <p className="text-sm font-medium flex-1 leading-snug" style={{ color: 'var(--color-foreground)' }}>
          {tarefa.titulo}
        </p>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
          style={{ color: '#EF4444' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {tarefa.projeto && (
        <p className="text-xs mb-2 ml-3.5" style={{ color: 'var(--color-muted-foreground)' }}>
          {tarefa.projeto.title}
        </p>
      )}

      <div className="flex items-center justify-between ml-3.5">
        <div className="flex items-center gap-1.5">
          {tarefa.dataVencimento && (
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: isOverdue ? '#EF4444' : 'var(--color-muted-foreground)' }}
            >
              <Calendar size={11} />
              {formatDate(tarefa.dataVencimento)}
            </div>
          )}
        </div>
        {nextStatus[tarefa.status] && (
          <button
            onClick={handleAdvance}
            disabled={moving}
            className="text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted-foreground)' }}
          >
            {moving ? '...' : '→ Avançar'}
          </button>
        )}
      </div>
    </div>
  )
}
