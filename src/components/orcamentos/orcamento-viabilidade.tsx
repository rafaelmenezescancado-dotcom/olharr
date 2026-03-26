'use client'

import { Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Orcamento } from './orcamentos-types'

interface OrcamentoViabilidadeProps {
  orcamento: Orcamento
}

export function calcViabilidade(orc: Orcamento) {
  const totalBruto = Number(orc.totalBruto ?? 0)
  const margem = Number(orc.margem ?? 0)
  const custoItens = orc.itens.reduce((sum, i) => sum + Number(i.valorUnit) * i.quantidade, 0)
  const valorComMargem = totalBruto * (1 + margem / 100)
  const lucro = valorComMargem - custoItens
  const margemPct = valorComMargem > 0 ? (lucro / valorComMargem) * 100 : 0
  const pctCustos = valorComMargem > 0 ? (custoItens / valorComMargem) * 100 : 0
  return { custoItens, valorComMargem, lucro, margemPct, pctCustos }
}

export function OrcamentoViabilidade({ orcamento: orc }: OrcamentoViabilidadeProps) {
  if (orc.itens.length === 0) return null

  const via = calcViabilidade(orc)
  const margemColor = via.margemPct >= 40 ? 'text-emerald-600' : via.margemPct >= 25 ? 'text-amber-500' : 'text-rose-600'
  const barColor = via.margemPct >= 40 ? 'bg-emerald-500' : via.margemPct >= 25 ? 'bg-amber-400' : 'bg-rose-500'

  return (
    <div className="bg-slate-50/80 p-6 border-t border-slate-200">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
        <Calculator size={14} className="mr-1.5" /> Análise de Viabilidade
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        {/* Left: Costs */}
        <div className="space-y-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
          <h5 className="text-sm font-bold text-slate-800 mb-3">Resumo de Custos</h5>
          <div className="space-y-2">
            {orc.itens.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600 truncate mr-2">{item.descricao}</span>
                <span className="font-semibold text-rose-600 whitespace-nowrap">
                  - {formatCurrency(Number(item.valorUnit) * item.quantidade)}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between text-base">
            <span className="font-bold text-slate-800">Total Custos</span>
            <span className="font-bold text-rose-600">{formatCurrency(via.custoItens)}</span>
          </div>
        </div>

        {/* Right: Revenue + Margin */}
        <div className="space-y-5 md:pl-2">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor de Venda</p>
            <p className="text-2xl font-bold text-indigo-700">{formatCurrency(via.valorComMargem)}</p>
            {Number(orc.margem ?? 0) > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Total bruto {formatCurrency(Number(orc.totalBruto))} + {Number(orc.margem)}% margem
              </p>
            )}
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-slate-700 text-sm">Margem de Lucro</span>
              <div className="text-right">
                <span className={`text-3xl font-extrabold ${margemColor} leading-none`}>
                  {via.margemPct.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-slate-400 mt-1 block">
                  Lucro: {formatCurrency(via.lucro)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden shadow-inner">
              <div
                className="bg-rose-500 h-3 transition-all duration-500"
                style={{ width: `${Math.min(via.pctCustos, 100)}%` }}
              />
              <div
                className={`${barColor} h-3 transition-all duration-500`}
                style={{ width: `${Math.max(100 - via.pctCustos, 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 px-1">
              <span>Custos ({via.pctCustos.toFixed(1)}%)</span>
              <span>Margem ({Math.max(100 - via.pctCustos, 0).toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
