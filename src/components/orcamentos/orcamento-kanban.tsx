'use client'

import { Clock, Send, CheckCircle, XCircle, Calculator } from 'lucide-react'
import type { OrcamentoStatus } from '@/generated/prisma/client'
import { OrcamentoCard } from './orcamento-card'
import type { Orcamento } from './orcamentos-types'

interface OrcamentoKanbanProps {
  orcamentos: Orcamento[]
  onSelectOrcamento: (orc: Orcamento) => void
}

const KANBAN_COLUMNS: {
  id: OrcamentoStatus
  titulo: string
  icon: typeof Clock
  color: string
  border: string
  bg: string
}[] = [
  { id: 'RASCUNHO', titulo: 'Em Elaboração', icon: Calculator, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
  { id: 'ENVIADO', titulo: 'Aguardando Resposta', icon: Send, color: 'text-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50' },
  { id: 'APROVADO', titulo: 'Aprovados', icon: CheckCircle, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  { id: 'RECUSADO', titulo: 'Recusados', icon: XCircle, color: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50' },
]

export function OrcamentoKanban({ orcamentos, onSelectOrcamento }: OrcamentoKanbanProps) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(coluna => {
        const items = orcamentos.filter(o => o.status === coluna.id)
        return (
          <div key={coluna.id} className="flex-1 min-w-[280px] max-w-[340px] flex flex-col">
            {/* Column Header */}
            <div className={`px-4 py-3 rounded-t-xl border-t border-x ${coluna.border} ${coluna.bg} flex justify-between items-center shrink-0`}>
              <h3 className={`font-bold text-sm ${coluna.color} flex items-center`}>
                <coluna.icon size={16} className="mr-2" />
                {coluna.titulo}
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 text-slate-600">
                {items.length}
              </span>
            </div>

            {/* Column Body */}
            <div className={`flex-1 p-3 bg-slate-100/50 border-x border-b ${coluna.border} rounded-b-xl overflow-y-auto space-y-3 max-h-[600px]`}>
              {items.map(orc => (
                <OrcamentoCard
                  key={orc.id}
                  orcamento={orc}
                  onClick={() => onSelectOrcamento(orc)}
                />
              ))}

              {items.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-medium">
                  Nenhum orçamento aqui
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
