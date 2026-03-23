'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type MesFluxo = {
  mes: string
  entradas: number
  saidas: number
  saldo: number
}

interface FluxoCaixaViewProps {
  dados: MesFluxo[]
}

export function FluxoCaixaView({ dados }: FluxoCaixaViewProps) {
  const totalEntradas = dados.reduce((s, d) => s + d.entradas, 0)
  const totalSaidas = dados.reduce((s, d) => s + d.saidas, 0)
  const saldoAcumulado = totalEntradas - totalSaidas

  const maxValor = Math.max(...dados.flatMap(d => [d.entradas, d.saidas]), 1)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Fluxo de Caixa</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            Últimos {dados.length} meses
          </p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: '#22C55E' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Total entradas</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} style={{ color: '#EF4444' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Total saídas</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{formatCurrency(totalSaidas)}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Minus size={16} style={{ color: saldoAcumulado >= 0 ? '#22C55E' : '#EF4444' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Saldo acumulado</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: saldoAcumulado >= 0 ? '#22C55E' : '#EF4444' }}>
            {formatCurrency(saldoAcumulado)}
          </p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold mb-6" style={{ color: 'var(--color-foreground)' }}>Entradas vs Saídas</h2>
        <div className="flex items-end gap-3" style={{ height: 200 }}>
          {dados.map(d => (
            <div key={d.mes} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-1" style={{ height: 160 }}>
                {/* Entradas */}
                <div
                  className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${(d.entradas / maxValor) * 100}%`,
                    minHeight: d.entradas > 0 ? 4 : 0,
                    background: '#22C55E',
                    opacity: 0.85,
                  }}
                />
                {/* Saídas */}
                <div
                  className="flex-1 rounded-t-md transition-all"
                  style={{
                    height: `${(d.saidas / maxValor) * 100}%`,
                    minHeight: d.saidas > 0 ? 4 : 0,
                    background: '#EF4444',
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="text-xs capitalize whitespace-nowrap" style={{ color: 'var(--color-muted-foreground)' }}>
                {d.mes}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} /> Entradas
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: '#EF4444' }} /> Saídas
          </div>
        </div>
      </div>

      {/* Tabela detalhada */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div
          className="grid px-5 py-3 text-xs font-semibold"
          style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', color: 'var(--color-muted-foreground)', borderBottom: '1px solid var(--color-border)' }}
        >
          <span>Mês</span>
          <span>Entradas</span>
          <span>Saídas</span>
          <span>Saldo</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {dados.map((d, i) => {
            const saldoAcum = dados.slice(0, i + 1).reduce((s, m) => s + m.saldo, 0)
            return (
              <div
                key={d.mes}
                className="grid px-5 py-3.5 items-center"
                style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}
              >
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--color-foreground)' }}>{d.mes}</span>
                <span className="text-sm font-medium" style={{ color: '#22C55E' }}>
                  {d.entradas > 0 ? formatCurrency(d.entradas) : '—'}
                </span>
                <span className="text-sm font-medium" style={{ color: '#EF4444' }}>
                  {d.saidas > 0 ? formatCurrency(d.saidas) : '—'}
                </span>
                <span className="text-sm font-semibold" style={{ color: d.saldo >= 0 ? '#22C55E' : '#EF4444' }}>
                  {formatCurrency(saldoAcum)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
