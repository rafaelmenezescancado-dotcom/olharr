'use client'

import { useState } from 'react'
import { Plus, Trash2, ArrowLeft, FileText, CheckCircle2, Send, XCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { adicionarItem, removerItem, atualizarStatusOrcamento } from '@/modules/orcamentos/actions'
import type { OrcamentoStatus } from '@/generated/prisma/client'
import Link from 'next/link'

type Item = {
  id: string
  descricao: string
  quantidade: number
  valorUnit: unknown
  categoria: string | null
}

type OrcamentoDetail = {
  id: string
  titulo: string
  status: OrcamentoStatus
  vertical: string | null
  validoAte: Date | null
  totalBruto: unknown
  margem: unknown
  observacoes: string | null
  cliente: { id: string; name: string; company: string | null }
  itens: Item[]
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

interface OrcamentoDetailProps {
  orcamento: OrcamentoDetail
}

export function OrcamentoDetail({ orcamento }: OrcamentoDetailProps) {
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  const totalBruto = Number(orcamento.totalBruto)
  const margem = orcamento.margem ? Number(orcamento.margem) : null
  const totalComMargem = margem ? totalBruto * (1 + margem / 100) : null

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await adicionarItem(orcamento.id, new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setAddItemOpen(false); setLoading(false); (e.target as HTMLFormElement).reset() }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/orcamentos">
          <button className="p-2 rounded-xl hover:opacity-70 mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{orcamento.titulo}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {orcamento.cliente.company || orcamento.cliente.name}
            {orcamento.vertical && ` · ${orcamento.vertical}`}
            {orcamento.validoAte && ` · Válido até ${formatDate(orcamento.validoAte)}`}
          </p>
        </div>
        <select
          defaultValue={orcamento.status}
          onChange={e => atualizarStatusOrcamento(orcamento.id, e.target.value as OrcamentoStatus)}
          className="px-3 py-2 rounded-xl border text-sm outline-none"
          style={inputStyle}
        >
          {(Object.keys(STATUS_LABELS) as OrcamentoStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Status badge + totals */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted-foreground)' }}>Status</p>
          <span
            className="flex items-center gap-1.5 text-sm font-medium w-fit px-3 py-1.5 rounded-full"
            style={{ background: `${STATUS_COLORS[orcamento.status]}20`, color: STATUS_COLORS[orcamento.status] }}
          >
            {STATUS_ICONS[orcamento.status]} {STATUS_LABELS[orcamento.status]}
          </span>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Total bruto</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(totalBruto)}</p>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
            {margem ? `Com margem (${margem}%)` : 'Margem'}
          </p>
          <p className="text-2xl font-bold" style={{ color: margem ? '#22C55E' : 'var(--color-muted-foreground)' }}>
            {totalComMargem ? formatCurrency(totalComMargem) : '—'}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Itens ({orcamento.itens.length})
          </h2>
          <button
            onClick={() => setAddItemOpen(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={12} /> Adicionar item
          </button>
        </div>

        {orcamento.itens.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Nenhum item adicionado
          </div>
        ) : (
          <>
            <div
              className="grid px-5 py-3 text-xs font-semibold"
              style={{ gridTemplateColumns: '1fr 100px 120px 120px 40px', color: 'var(--color-muted-foreground)' }}
            >
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Qtd × Valor</span>
              <span>Subtotal</span>
              <span></span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {orcamento.itens.map(item => {
                const subtotal = item.quantidade * Number(item.valorUnit)
                return (
                  <div
                    key={item.id}
                    className="grid items-center px-5 py-3.5 group hover:bg-white/3"
                    style={{ gridTemplateColumns: '1fr 100px 120px 120px 40px' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>{item.descricao}</p>
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{item.categoria || '—'}</span>
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {item.quantidade}× {formatCurrency(Number(item.valorUnit))}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(subtotal)}</span>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removerItem(item.id, orcamento.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                        style={{ color: '#EF4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              className="flex items-center justify-between px-5 py-4 border-t"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Total</span>
              <span className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>{formatCurrency(totalBruto)}</span>
            </div>
          </>
        )}
      </div>

      {/* Add item modal */}
      {addItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Adicionar item</h3>
              <button onClick={() => setAddItemOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Descrição *</label>
                <input name="descricao" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Filmagem do baile" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Qtd</label>
                  <input type="number" name="quantidade" defaultValue={1} min={1} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Valor unitário *</label>
                  <input type="number" step="0.01" name="valorUnit" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Categoria</label>
                <input name="categoria" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Vídeo, Foto, Sonorização" />
              </div>
              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddItemOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
