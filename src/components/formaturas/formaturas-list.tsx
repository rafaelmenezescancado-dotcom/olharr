'use client'

import { useState } from 'react'
import { Plus, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { criarTurma } from '@/modules/formaturas/actions'
import type { TurmaStatus } from '@/generated/prisma/client'
import Link from 'next/link'

type Turma = {
  id: string
  nome: string
  status: TurmaStatus
  dataEvento: Date | null
  valorTotal: unknown
  cliente: { id: string; name: string; company: string | null }
  formandos: { id: string }[]
}

interface FormaturasListProps {
  turmas: Turma[]
  clientes: Array<{ id: string; name: string; company: string | null }>
}

const STATUS_LABELS: Record<TurmaStatus, string> = {
  ATIVA: 'Ativa',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

const STATUS_COLORS: Record<TurmaStatus, string> = {
  ATIVA: '#22C55E',
  CONCLUIDA: '#1E7FCD',
  CANCELADA: '#EF4444',
}

const STATUS_ICONS: Record<TurmaStatus, React.ReactNode> = {
  ATIVA: <Clock size={12} />,
  CONCLUIDA: <CheckCircle2 size={12} />,
  CANCELADA: <XCircle size={12} />,
}

export function FormaturasList({ turmas, clientes }: FormaturasListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarTurma(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Formaturas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {turmas.length} turma{turmas.length !== 1 ? 's' : ''} cadastrada{turmas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Nova turma
        </button>
      </div>

      {turmas.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', background: 'var(--color-surface)' }}>
          Nenhuma turma cadastrada
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map(t => (
            <Link key={t.id} href={`/formaturas/${t.id}`}>
              <div
                className="rounded-2xl border p-5 hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>{t.nome}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                      {t.cliente.company || t.cliente.name}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0"
                    style={{ background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status] }}
                  >
                    {STATUS_ICONS[t.status]} {STATUS_LABELS[t.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{t.formandos.length} formando{t.formandos.length !== 1 ? 's' : ''}</span>
                  </div>
                  {t.dataEvento && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(t.dataEvento)}</span>
                    </div>
                  )}
                </div>

                {t.valorTotal != null && (
                  <p className="text-sm font-bold mt-2" style={{ color: '#22C55E' }}>
                    {formatCurrency(Number(t.valorTotal))}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Nova turma</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Cliente *</label>
                <select name="clienteId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required>
                  <option value="">Selecionar...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Nome da turma *</label>
                <input name="nome" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Medicina UFBA 2025.1" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Data do evento</label>
                  <input type="date" name="dataEvento" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Valor total (R$)</label>
                  <input type="number" step="0.01" name="valorTotal" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Observações</label>
                <textarea name="observacoes" rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} />
              </div>
              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
