'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ProjetoCard } from './projeto-card'
import { ProjetoForm } from './projeto-form'
import { STAGE_LABELS, STAGE_ORDER } from '@/modules/projetos/types'
import type { ProjetosByStage, ProjectWithRelations } from '@/modules/projetos/types'
import type { ProjectStage } from '@/generated/prisma/client'

const STAGE_COLORS: Record<ProjectStage, string> = {
  OS_DISTRIBUICAO: '#8B82A0',
  PRE_PRODUCAO: '#1E7FCD',
  DIA_DO_EVENTO: '#F59E0B',
  POS_PRODUCAO: '#B52774',
  EDICAO: '#8B5CF6',
  REVISAO: '#EC4899',
  ENTREGUE: '#22C55E',
  ARQUIVADO: '#6B6280',
}

interface ProjetosKanbanProps {
  projetosByStage: ProjetosByStage
  clientes: Array<{ id: string; name: string; company: string | null }>
  users: Array<{ id: string; name: string; role: string }>
}

export function ProjetosKanban({ projetosByStage, clientes, users }: ProjetosKanbanProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<ProjectWithRelations | undefined>()

  function handleEdit(projeto: ProjectWithRelations) {
    setEditingProjeto(projeto)
    setFormOpen(true)
  }

  function handleClose() {
    setFormOpen(false)
    setEditingProjeto(undefined)
  }

  const visibleStages = STAGE_ORDER.filter(s => s !== 'ARQUIVADO')

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Projetos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            Acompanhe o progresso dos seus projetos
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo projeto
        </button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {visibleStages.map(stage => {
          const projetos = projetosByStage[stage] ?? []
          const color = STAGE_COLORS[stage]
          return (
            <div
              key={stage}
              className="flex-shrink-0 w-72 flex flex-col"
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
                style={{ background: `${color}15` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold" style={{ color }}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${color}25`, color }}
                >
                  {projetos.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 flex-1">
                {projetos.map(p => (
                  <ProjetoCard key={p.id} projeto={p} onEdit={handleEdit} />
                ))}
                {projetos.length === 0 && (
                  <div
                    className="rounded-xl border border-dashed p-6 text-center text-xs"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-subtle)' }}
                  >
                    Nenhum projeto aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {formOpen && (
        <ProjetoForm
          clientes={clientes}
          users={users}
          projeto={editingProjeto}
          onClose={handleClose}
        />
      )}
    </>
  )
}
