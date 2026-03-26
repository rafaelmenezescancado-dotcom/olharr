'use client'

import { CalendarDays, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { Orcamento } from './orcamentos-types'

interface OrcamentoCardProps {
  orcamento: Orcamento
  onClick: () => void
}

function getVerticalBadge(vertical: string | null) {
  switch (vertical?.toLowerCase()) {
    case 'casamento': case 'casamentos': return 'bg-rose-50 text-rose-600 border-rose-100'
    case 'formatura': case 'formaturas': return 'bg-indigo-50 text-indigo-600 border-indigo-100'
    case 'shows e festas': case 'festas': return 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100'
    case 'particular': return 'bg-teal-50 text-teal-600 border-teal-100'
    case 'corporativo': return 'bg-cyan-50 text-cyan-600 border-cyan-100'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OrcamentoCard({ orcamento: orc, onClick }: OrcamentoCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group flex flex-col"
    >
      {/* Top badges */}
      <div className="flex justify-between items-start mb-2">
        {orc.vertical && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getVerticalBadge(orc.vertical)}`}>
            {orc.vertical}
          </span>
        )}
        <span className="text-xs text-slate-400 font-medium ml-auto">
          {formatShortDate(orc.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-700 transition-colors">
        {orc.titulo}
      </h4>

      {/* Client */}
      <Link
        href={`/crm/${orc.cliente.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mb-3"
      >
        <Users size={12} className="mr-1.5 shrink-0" />
        <span className="truncate">{orc.cliente.company || orc.cliente.name}</span>
      </Link>

      {/* Validity */}
      {orc.validoAte && (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
          <CalendarDays size={12} className="shrink-0 text-slate-400" />
          <span>Válido até {formatShortDate(orc.validoAte)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
        <span className="font-bold text-slate-900 text-sm">
          {formatCurrency(Number(orc.totalBruto))}
        </span>
        <span className="text-xs text-slate-400">
          {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}
        </span>
      </div>
    </div>
  )
}
