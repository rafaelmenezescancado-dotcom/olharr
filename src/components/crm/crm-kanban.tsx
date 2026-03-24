'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ClienteCard } from './cliente-card'
import { ClienteForm } from './cliente-form'
import { CRM_STAGE_LABELS, CRM_STAGE_ORDER } from '@/modules/crm/types'
import type { ClientsByStage, ClientWithContatos } from '@/modules/crm/types'
import type { CrmStage } from '@/generated/prisma/client'

const STAGE_COLORS: Record<CrmStage, string> = {
  NOVO_LEAD: '#9B96B0',
  PRIMEIRO_CONTATO: '#1E7FCD',
  PROPOSTA_ENVIADA: '#F59E0B',
  NEGOCIACAO: '#8B5CF6',
  FECHADO_GANHO: '#22C55E',
  FECHADO_PERDIDO: '#EF4444',
  INATIVO: '#9B96B0',
}

interface CrmKanbanProps {
  clientesByStage: ClientsByStage
}

export function CrmKanban({ clientesByStage }: CrmKanbanProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClientWithContatos | undefined>()

  function handleEdit(cliente: ClientWithContatos) {
    setEditingCliente(cliente)
    setFormOpen(true)
  }

  function handleClose() {
    setFormOpen(false)
    setEditingCliente(undefined)
  }

  const activeStages = CRM_STAGE_ORDER.filter(s => s !== 'INATIVO')

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>CRM</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            Pipeline de clientes e leads
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {activeStages.map(stage => {
          const clientes = clientesByStage[stage] ?? []
          const color = STAGE_COLORS[stage]
          return (
            <div key={stage} className="flex-shrink-0 w-64 flex flex-col">
              <div
                className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
                style={{ background: `${color}15` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold" style={{ color }}>
                    {CRM_STAGE_LABELS[stage]}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}25`, color }}>
                  {clientes.length}
                </span>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {clientes.map(c => (
                  <ClienteCard key={c.id} cliente={c} onEdit={handleEdit} />
                ))}
                {clientes.length === 0 && (
                  <div
                    className="rounded-xl border border-dashed p-5 text-center text-xs"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-subtle)' }}
                  >
                    Nenhum lead aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {formOpen && (
        <ClienteForm
          cliente={editingCliente}
          onClose={handleClose}
        />
      )}
    </>
  )
}
