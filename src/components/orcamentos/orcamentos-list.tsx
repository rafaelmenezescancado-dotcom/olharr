'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Calculator } from 'lucide-react'
import type { Orcamento, ClienteSimples } from './orcamentos-types'
import { OrcamentoStats } from './orcamento-stats'
import { OrcamentoKanban } from './orcamento-kanban'
import { OrcamentoModal } from './orcamento-modal'
import { OrcamentoForm } from './orcamento-form'

interface OrcamentosListProps {
  orcamentos: Orcamento[]
  clientes: ClienteSimples[]
}

export function OrcamentosList({ orcamentos, clientes }: OrcamentosListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroVertente, setFiltroVertente] = useState('Todas')
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter(orc => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase()
        if (
          !orc.titulo.toLowerCase().includes(s) &&
          !orc.cliente.name.toLowerCase().includes(s) &&
          !(orc.cliente.company ?? '').toLowerCase().includes(s)
        ) return false
      }
      if (filtroVertente !== 'Todas' && orc.vertical?.toLowerCase() !== filtroVertente.toLowerCase()) return false
      return true
    })
  }, [orcamentos, searchTerm, filtroVertente])

  const verticals = useMemo(() => {
    const set = new Set(orcamentos.map(o => o.vertical).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [orcamentos])

  return (
    <div className="space-y-6 font-sans relative">

      {/* Header + Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Calculator className="mr-2 text-indigo-600" size={24} />
            Gestão de Orçamentos
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer"
            value={filtroVertente}
            onChange={(e) => setFiltroVertente(e.target.value)}
          >
            <option value="Todas">Todas as Vertentes</option>
            {verticals.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center cursor-pointer ml-auto xl:ml-0"
          >
            <Plus size={16} className="mr-1.5" />
            Novo
          </button>
        </div>
      </div>

      {/* Stats */}
      <OrcamentoStats orcamentos={filteredOrcamentos} />

      {/* Kanban Board */}
      <OrcamentoKanban
        orcamentos={filteredOrcamentos}
        onSelectOrcamento={setSelectedOrcamento}
      />

      {/* Detail Modal */}
      {selectedOrcamento && (
        <OrcamentoModal
          orcamento={selectedOrcamento}
          onClose={() => setSelectedOrcamento(null)}
          onUpdate={setSelectedOrcamento}
        />
      )}

      {/* Create Modal */}
      {formOpen && (
        <OrcamentoForm
          clientes={clientes}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
