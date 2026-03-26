'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { criarTransacao, deletarTransacao } from '@/modules/financeiro/actions'
import type { FinancialAccount, Transaction } from '@/generated/prisma/client'

interface TransacaoComConta extends Transaction {
  conta: Pick<FinancialAccount, 'id' | 'nome' | 'banco'>
}

interface FinanceiroDashboardProps {
  transacoes: TransacaoComConta[]
  contas: FinancialAccount[]
  entradas: number
  saidas: number
}

const CATEGORIES = [
  'Contrato', 'Sinal', 'Parcela', 'Equipamento', 'Freelancer',
  'Marketing', 'Software', 'Transporte', 'Alimentação', 'Outros',
]

export function FinanceiroDashboard({
  transacoes, contas, entradas, saidas,
}: FinanceiroDashboardProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarTransacao(new FormData(e.currentTarget)) as { error?: string; success?: boolean }
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setFormOpen(false)
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta transação?')) return
    await deletarTransacao(id)
  }

  const saldo = entradas - saidas

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Financeiro</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Controle de entradas e saídas</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Nova transação
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: '#22C55E22' }}>
              <TrendingUp size={18} style={{ color: '#22C55E' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Entradas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{formatCurrency(entradas)}</p>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: '#EF444422' }}>
              <TrendingDown size={18} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Saídas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{formatCurrency(saidas)}</p>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(181,39,116,0.15)' }}>
              <Wallet size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Saldo do mês</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: saldo >= 0 ? '#22C55E' : '#EF4444' }}>
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      {/* Contas */}
      {contas.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>CONTAS</h2>
          <div className="flex gap-3 flex-wrap">
            {contas.map(c => (
              <div
                key={c.id}
                className="px-4 py-3 rounded-xl border flex items-center gap-4"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{c.nome}</p>
                  {c.banco && <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{c.banco}</p>}
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted-foreground)' }}
                >
                  {c.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transações */}
      <div>
        <h2 className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>TRANSAÇÕES DO MÊS</h2>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {transacoes.length === 0 ? (
            <div className="p-12 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Nenhuma transação neste mês
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {transacoes.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 group">
                  <div
                    className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ background: t.tipo === 'ENTRADA' ? '#22C55E' : t.tipo === 'SAIDA' ? '#EF4444' : '#F59E0B' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{t.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t.conta.nome}</span>
                      {t.categoria && (
                        <>
                          <span style={{ color: 'var(--color-border)' }}>·</span>
                          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{t.categoria}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                    {formatDate(t.data)}
                  </p>
                  <p
                    className="text-sm font-bold w-28 text-right"
                    style={{ color: t.tipo === 'ENTRADA' ? '#22C55E' : t.tipo === 'SAIDA' ? '#EF4444' : '#F59E0B' }}
                  >
                    {t.tipo === 'SAIDA' ? '-' : '+'}{formatCurrency(Number(t.valor))}
                  </p>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal nova transação */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Nova transação</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['ENTRADA', 'SAIDA', 'TRANSFERENCIA'] as const).map(tipo => (
                  <label key={tipo} className="cursor-pointer">
                    <input type="radio" name="tipo" value={tipo} defaultChecked={tipo === 'ENTRADA'} className="sr-only peer" />
                    <div
                      className="text-center py-2.5 rounded-xl border text-xs font-medium peer-checked:border-current transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: tipo === 'ENTRADA' ? '#22C55E' : tipo === 'SAIDA' ? '#EF4444' : '#F59E0B',
                      }}
                    >
                      {tipo === 'ENTRADA' ? '+ Entrada' : tipo === 'SAIDA' ? '− Saída' : '↔ Transf.'}
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Conta *</label>
                <select name="contaId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required>
                  <option value="">Selecionar conta...</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.nome} {c.banco ? `(${c.banco})` : ''}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Valor (R$) *</label>
                  <input type="number" name="valor" step="0.01" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="0,00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Data *</label>
                  <input type="date" name="data" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Descrição *</label>
                <input name="descricao" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Categoria</label>
                <select name="categoria" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                  <option value="">Sem categoria</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Salvando...' : 'Criar transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
