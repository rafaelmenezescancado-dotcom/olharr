'use client'

import { useMemo } from 'react'
import { Briefcase, Clock, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Orcamento } from './orcamentos-types'

interface OrcamentoStatsProps {
  orcamentos: Orcamento[]
}

export function OrcamentoStats({ orcamentos }: OrcamentoStatsProps) {
  const stats = useMemo(() => {
    const total = orcamentos.length
    const emNegociacao = orcamentos
      .filter(o => o.status === 'RASCUNHO' || o.status === 'ENVIADO')
      .reduce((acc, o) => acc + Number(o.totalBruto), 0)
    const aprovados = orcamentos.filter(o => o.status === 'APROVADO').length
    const taxa = total > 0 ? Math.round((aprovados / total) * 100) : 0
    const valorTotal = orcamentos.reduce((acc, o) => acc + Number(o.totalBruto), 0)
    const ticket = total > 0 ? Math.round(valorTotal / total) : 0

    return [
      { title: 'Propostas', value: String(total), icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { title: 'Em Negociação', value: formatCurrency(emNegociacao), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
      { title: 'Taxa Aprovação', value: `${taxa}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { title: 'Ticket Médio', value: formatCurrency(ticket), icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
    ]
  }, [orcamentos])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className={`p-3 rounded-lg ${stat.bg} mr-4`}>
            <stat.icon size={22} className={stat.color} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{stat.title}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
