'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle, XCircle, ArrowLeft } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  criarFormando,
  deletarFormando,
  criarParcela,
  atualizarStatusParcela,
  atualizarStatusTurma,
} from '@/modules/formaturas/actions'
import type { ParcelaStatus, TurmaStatus } from '@/generated/prisma/client'
import Link from 'next/link'

type Parcela = {
  id: string
  valor: unknown
  vencimento: Date
  status: ParcelaStatus
  paidAt: Date | null
}

type FormandoWithParcelas = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  parcelas: Parcela[]
}

type EventoTurma = {
  id: string
  nome: string
  data: Date
  local: string | null
  custos: { id: string; descricao: string; valor: unknown }[]
}

type TurmaDetail = {
  id: string
  nome: string
  status: TurmaStatus
  dataEvento: Date | null
  valorTotal: unknown
  observacoes: string | null
  cliente: { id: string; name: string; company: string | null }
  formandos: FormandoWithParcelas[]
  eventos: EventoTurma[]
}

const PARCELA_STATUS_LABELS: Record<ParcelaStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
}

const PARCELA_STATUS_COLORS: Record<ParcelaStatus, string> = {
  PENDENTE: '#F59E0B',
  PAGO: '#22C55E',
  ATRASADO: '#EF4444',
  CANCELADO: '#6B7280',
}

const PARCELA_STATUS_ICONS: Record<ParcelaStatus, React.ReactNode> = {
  PENDENTE: <Clock size={12} />,
  PAGO: <CheckCircle2 size={12} />,
  ATRASADO: <AlertCircle size={12} />,
  CANCELADO: <XCircle size={12} />,
}

interface TurmaDetailProps {
  turma: TurmaDetail
}

export function TurmaDetail({ turma }: TurmaDetailProps) {
  const [addFormandoOpen, setAddFormandoOpen] = useState(false)
  const [addParcelaFor, setAddParcelaFor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  const totalArrecadado = turma.formandos.reduce(
    (sum, f) =>
      sum + f.parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + Number(p.valor), 0),
    0
  )

  async function handleAddFormando(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await criarFormando(turma.id, new FormData(e.currentTarget))
    setAddFormandoOpen(false)
    setLoading(false)
  }

  async function handleAddParcela(formandoId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await criarParcela(formandoId, turma.id, new FormData(e.currentTarget))
    setAddParcelaFor(null)
    setLoading(false)
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/formaturas">
          <button className="p-2 rounded-xl hover:opacity-70 mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{turma.nome}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {turma.cliente.company || turma.cliente.name}
            {turma.dataEvento && ` · ${formatDate(turma.dataEvento)}`}
          </p>
        </div>
        <select
          defaultValue={turma.status}
          onChange={e => atualizarStatusTurma(turma.id, e.target.value as TurmaStatus)}
          className="px-3 py-2 rounded-xl border text-sm outline-none"
          style={inputStyle}
        >
          <option value="ATIVA">Ativa</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Formandos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{turma.formandos.length}</p>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Arrecadado</p>
          <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{formatCurrency(totalArrecadado)}</p>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Valor total</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {turma.valorTotal ? formatCurrency(Number(turma.valorTotal)) : '—'}
          </p>
        </div>
      </div>

      {/* Formandos */}
      <div className="rounded-2xl border overflow-hidden mb-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Formandos</h2>
          <button
            onClick={() => setAddFormandoOpen(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={12} /> Adicionar
          </button>
        </div>

        {turma.formandos.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Nenhum formando cadastrado
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {turma.formandos.map(f => {
              const parcelasPagas = f.parcelas.filter(p => p.status === 'PAGO')
              const totalPago = parcelasPagas.reduce((s, p) => s + Number(p.valor), 0)
              return (
                <div key={f.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{f.nome}</p>
                      {f.email && <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{f.email}</p>}
                      {f.telefone && <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{f.telefone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: '#22C55E' }}>{formatCurrency(totalPago)}</span>
                      <button
                        onClick={() => setAddParcelaFor(f.id)}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted-foreground)' }}
                      >
                        + Parcela
                      </button>
                      <button
                        onClick={() => deletarFormando(f.id, turma.id)}
                        className="p-1 rounded-lg"
                        style={{ color: '#EF4444' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {f.parcelas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {f.parcelas.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const next: ParcelaStatus = p.status === 'PAGO' ? 'PENDENTE' : 'PAGO'
                            atualizarStatusParcela(p.id, turma.id, next)
                          }}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                          style={{
                            background: `${PARCELA_STATUS_COLORS[p.status]}15`,
                            color: PARCELA_STATUS_COLORS[p.status],
                          }}
                        >
                          {PARCELA_STATUS_ICONS[p.status]}
                          {formatCurrency(Number(p.valor))} · {formatDate(p.vencimento)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Add parcela inline form */}
                  {addParcelaFor === f.id && (
                    <form onSubmit={e => handleAddParcela(f.id, e)} className="flex gap-2 mt-3">
                      <input
                        type="number"
                        step="0.01"
                        name="valor"
                        placeholder="Valor"
                        className="flex-1 px-2 py-1.5 rounded-lg border text-xs outline-none"
                        style={inputStyle}
                        required
                      />
                      <input
                        type="date"
                        name="vencimento"
                        className="flex-1 px-2 py-1.5 rounded-lg border text-xs outline-none"
                        style={inputStyle}
                        required
                      />
                      <button type="submit" disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                        Salvar
                      </button>
                      <button type="button" onClick={() => setAddParcelaFor(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        ✕
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add formando modal */}
      {addFormandoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Adicionar formando</h3>
              <button onClick={() => setAddFormandoOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleAddFormando} className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Nome *</label>
                <input name="nome" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Email</label>
                <input type="email" name="email" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-foreground)' }}>Telefone</label>
                <input name="telefone" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddFormandoOpen(false)} className="flex-1 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-primary)', color: '#fff' }}>
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
