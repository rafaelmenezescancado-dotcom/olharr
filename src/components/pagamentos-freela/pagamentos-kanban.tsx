'use client'

import { useState } from 'react'
import { Plus, ChevronRight, DollarSign, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { criarPagamentoFreela, avancarFasePagamento } from '@/modules/pagamentos-freela/actions'
import { FASES } from '@/modules/pagamentos-freela/queries'
import type { FasePagamentoFreelancer } from '@/generated/prisma/client'

const FASE_LABELS: Record<FasePagamentoFreelancer, string> = {
  CONTRATACAO: 'Contratação',
  AGUARDANDO_EVENTO: 'Aguardando Evento',
  LANCAMENTO_DRE: 'Lançamento DRE',
  PAGO: 'Pago',
  ARQUIVADO: 'Arquivado',
}

const FASE_COLORS: Record<FasePagamentoFreelancer, string> = {
  CONTRATACAO: '#8B82A0',
  AGUARDANDO_EVENTO: '#F59E0B',
  LANCAMENTO_DRE: '#1E7FCD',
  PAGO: '#22C55E',
  ARQUIVADO: '#6B6280',
}

type Pagamento = {
  id: string
  escopo: string
  valorCombinado: unknown
  combinadoNF: boolean
  dataProjeto: Date | null
  dataPagamento: Date | null
  fase: FasePagamentoFreelancer
  freelancer: { id: string; name: string }
  projeto: { id: string; title: string } | null
}

interface PagamentosKanbanProps {
  byFase: Record<FasePagamentoFreelancer, Pagamento[]>
  freelancers: Array<{ id: string; name: string }>
  projetos: Array<{ id: string; title: string }>
}

export function PagamentosKanban({ byFase, freelancers, projetos }: PagamentosKanbanProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleFases = FASES.filter(f => f !== 'ARQUIVADO')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarPagamentoFreela(new FormData(e.currentTarget))
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Pagamentos Freelancer</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Kanban de pagamentos</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo pagamento
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {visibleFases.map(fase => {
          const pagamentos = byFase[fase] ?? []
          const color = FASE_COLORS[fase]
          const faseIndex = FASES.indexOf(fase)
          const nextFase = FASES[faseIndex + 1]

          return (
            <div key={fase} className="flex-shrink-0 w-72 flex flex-col">
              <div
                className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
                style={{ background: `${color}15` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold" style={{ color }}>{FASE_LABELS[fase]}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}25`, color }}>
                  {pagamentos.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {pagamentos.map(p => (
                  <PagamentoCard key={p.id} pagamento={p} nextFase={nextFase} />
                ))}
                {pagamentos.length === 0 && (
                  <div className="rounded-xl border border-dashed p-5 text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-subtle)' }}>
                    Nenhum pagamento
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo pagamento</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Freelancer *</label>
                <select name="freelancerId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required>
                  <option value="">Selecionar...</option>
                  {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Escopo *</label>
                <input name="escopo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Câmera A — Casamento João & Ana" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Valor (R$) *</label>
                  <input type="number" step="0.01" name="valorCombinado" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Data do evento</label>
                  <input type="date" name="dataProjeto" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Projeto</label>
                <select name="projectId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                  <option value="">Sem projeto</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="hidden" name="combinadoNF" value="false" />
                <input type="checkbox" name="combinadoNF" value="true" id="combinadoNF" className="w-4 h-4 rounded" />
                <label htmlFor="combinadoNF" className="text-sm" style={{ color: 'var(--color-foreground)' }}>Combinado com NF</label>
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

function PagamentoCard({ pagamento, nextFase }: { pagamento: Pagamento; nextFase?: FasePagamentoFreelancer }) {
  const [moving, setMoving] = useState(false)

  async function handleAdvance() {
    if (!nextFase || moving) return
    setMoving(true)
    await avancarFasePagamento(pagamento.id, nextFase)
    setMoving(false)
  }

  return (
    <div
      className="rounded-xl border p-4 group"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-foreground)' }}>
        {pagamento.freelancer.name}
      </p>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>
        {pagamento.escopo}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#22C55E' }}>
          <DollarSign size={14} />
          {formatCurrency(Number(pagamento.valorCombinado))}
        </div>
        {pagamento.combinadoNF && (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#F59E0B' }}>
            <FileText size={11} /> NF
          </div>
        )}
      </div>

      {pagamento.dataProjeto && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {formatDate(pagamento.dataProjeto)}
        </p>
      )}

      {pagamento.projeto && (
        <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-muted-foreground)' }}>
          {pagamento.projeto.title}
        </p>
      )}

      {nextFase && nextFase !== 'ARQUIVADO' && (
        <button
          onClick={handleAdvance}
          disabled={moving}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
        >
          {moving ? '...' : <>{FASE_LABELS[nextFase]} <ChevronRight size={12} /></>}
        </button>
      )}
    </div>
  )
}
