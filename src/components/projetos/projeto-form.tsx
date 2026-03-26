'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { criarProjeto, atualizarProjeto } from '@/modules/projetos/actions'
import { STAGE_LABELS, STAGE_ORDER } from '@/modules/projetos/types'
import type { ProjectWithRelations } from '@/modules/projetos/types'

interface ProjetoFormProps {
  clientes: Array<{ id: string; name: string; company: string | null }>
  users: Array<{ id: string; name: string; role: string }>
  projeto?: ProjectWithRelations
  onClose: () => void
}

export function ProjetoForm({ clientes, users, projeto, onClose }: ProjetoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = (projeto
      ? await atualizarProjeto(projeto.id, formData)
      : await criarProjeto(formData)) as { error?: string; success?: boolean }

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {projeto ? 'Editar projeto' : 'Novo projeto'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-muted-foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
              Título *
            </label>
            <input
              name="title"
              defaultValue={projeto?.title}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
              style={inputStyle}
              placeholder="Ex: Wedding Film — João & Maria"
              required
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
              Cliente *
            </label>
            <select
              name="clienteId"
              defaultValue={projeto?.clienteId}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
              style={inputStyle}
              required
            >
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável + Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                Responsável
              </label>
              <select
                name="responsavelId"
                defaultValue={projeto?.responsavelId ?? ''}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
                style={inputStyle}
              >
                <option value="">Sem responsável</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                Estágio
              </label>
              <select
                name="stage"
                defaultValue={projeto?.stage ?? 'OS_DISTRIBUICAO'}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
                style={inputStyle}
              >
                {STAGE_ORDER.map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vertical */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
              Vertical
            </label>
            <input
              name="vertical"
              defaultValue={projeto?.vertical ?? ''}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
              style={inputStyle}
              placeholder="Ex: Casamento, Formatura, Corporativo"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                Data do evento
              </label>
              <input
                type="date"
                name="dataEvento"
                defaultValue={projeto?.dataEvento ? new Date(projeto.dataEvento).toISOString().split('T')[0] : ''}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                Data de entrega
              </label>
              <input
                type="date"
                name="dataEntrega"
                defaultValue={projeto?.dataEntrega ? new Date(projeto.dataEntrega).toISOString().split('T')[0] : ''}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Receita */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
              Valor do contrato (R$)
            </label>
            <input
              type="number"
              name="revenueExpected"
              step="0.01"
              defaultValue={projeto?.revenueExpected ? String(projeto.revenueExpected) : ''}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)]"
              style={inputStyle}
              placeholder="0,00"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
              Observações
            </label>
            <textarea
              name="observacoes"
              defaultValue={projeto?.observacoes ?? ''}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-[var(--color-primary)] resize-none"
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              {loading ? 'Salvando...' : projeto ? 'Salvar' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
