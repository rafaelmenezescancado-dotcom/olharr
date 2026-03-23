'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, CheckCircle2, Clock, XCircle, Send } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { criarOrcamento, deletarOrcamento } from '@/modules/orcamentos/actions'
import type { OrcamentoStatus } from '@/generated/prisma/client'
import Link from 'next/link'

type Orcamento = {
  id: string
  titulo: string
  status: OrcamentoStatus
  vertical: string | null
  validoAte: Date | null
  totalBruto: unknown
  margem: unknown
  cliente: { id: string; name: string; company: string | null }
  itens: { id: string }[]
}

interface OrcamentosListProps {
  orcamentos: Orcamento[]
  clientes: Array<{ id: string; name: string; company: string | null }>
}

const STATUS_LABELS: Record<OrcamentoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
}

const STATUS_COLORS: Record<OrcamentoStatus, string> = {
  RASCUNHO: '#8B82A0',
  ENVIADO: '#F59E0B',
  APROVADO: '#22C55E',
  RECUSADO: '#EF4444',
  EXPIRADO: '#6B7280',
}

const STATUS_ICONS: Record<OrcamentoStatus, React.ReactNode> = {
  RASCUNHO: <FileText size={12} />,
  ENVIADO: <Send size={12} />,
  APROVADO: <CheckCircle2 size={12} />,
  RECUSADO: <XCircle size={12} />,
  EXPIRADO: <Clock size={12} />,
}

export function OrcamentosList({ orcamentos, clientes }: OrcamentosListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarOrcamento(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  const totalAprovado = orcamentos
    .filter(o => o.status === 'APROVADO')
    .reduce((sum, o) => sum + Number(o.totalBruto), 0)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Orçamentos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''} · {formatCurrency(totalAprovado)} aprovado{totalAprovado !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo orçamento
        </button>
      </div>

      {orcamentos.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', background: 'var(--color-surface)' }}>
          Nenhum orçamento cadastrado
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="grid px-5 py-3 text-xs font-semibold" style={{ gridTemplateColumns: '1fr 160px 100px 100px 80px 40px', color: 'var(--color-muted-foreground)' }}>
            <span>Título / Cliente</span>
            <span>Vertical</span>
            <span>Total</span>
            <span>Válido até</span>
            <span>Status</span>
            <span></span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {orcamentos.map(o => (
              <div key={o.id} className="grid items-center px-5 py-3.5 hover:bg-white/3 group" style={{ gridTemplateColumns: '1fr 160px 100px 100px 80px 40px' }}>
                <Link href={`/orcamentos/${o.id}`} className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{o.titulo}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>{o.cliente.company || o.cliente.name}</p>
                </Link>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{o.vertical || '—'}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(Number(o.totalBruto))}</span>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{o.validoAte ? formatDate(o.validoAte) : '—'}</span>
                <span
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit"
                  style={{ background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}
                >
                  {STATUS_ICONS[o.status]} {STATUS_LABELS[o.status]}
                </span>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm('Deletar este orçamento?')) deletarOrcamento(o.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo orçamento</h2>
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Título *</label>
                <input name="titulo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Cobertura de Formatura" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Vertical</label>
                  <input name="vertical" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Formaturas" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Válido até</label>
                  <input type="date" name="validoAte" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Margem (%)</label>
                <input type="number" step="0.01" name="margem" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: 30" />
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
