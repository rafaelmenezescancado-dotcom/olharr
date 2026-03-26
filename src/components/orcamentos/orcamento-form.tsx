'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { criarOrcamento } from '@/modules/orcamentos/actions'
import type { ClienteSimples } from './orcamentos-types'

interface OrcamentoFormProps {
  clientes: ClienteSimples[]
  onClose: () => void
}

export function OrcamentoForm({ clientes, onClose }: OrcamentoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarOrcamento(new FormData(e.currentTarget)) as { error?: string; success?: boolean; id?: string }
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border shadow-2xl bg-white border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Novo orçamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Cliente *</label>
            <select name="clienteId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" required>
              <option value="">Selecionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Título *</label>
            <input name="titulo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Cobertura Casamento" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700">Vertical</label>
              <input name="vertical" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Formaturas" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700">Válido até</label>
              <input type="date" name="validoAte" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Margem (%)</label>
            <input type="number" step="0.01" name="margem" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: 30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Observações</label>
            <textarea name="observacoes" rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
