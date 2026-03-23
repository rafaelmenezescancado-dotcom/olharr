'use client'

import { useState } from 'react'
import { Calendar, DollarSign, User, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { ProjectWithRelations } from '@/modules/projetos/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/modules/projetos/types'
import { moverProjetoStage, deletarProjeto } from '@/modules/projetos/actions'
import type { ProjectStage } from '@/generated/prisma/client'

interface ProjetoCardProps {
  projeto: ProjectWithRelations
  onEdit: (projeto: ProjectWithRelations) => void
}

export function ProjetoCard({ projeto, onEdit }: ProjetoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const currentIndex = STAGE_ORDER.indexOf(projeto.stage as ProjectStage)
  const nextStage = STAGE_ORDER[currentIndex + 1]

  const totalCustos = projeto.custos.reduce((sum, c) => sum + Number(c.amount), 0)
  const margem = projeto.revenueExpected
    ? Number(projeto.revenueExpected) - totalCustos
    : null

  async function handleMoveNext() {
    if (!nextStage || moving) return
    setMoving(true)
    await moverProjetoStage(projeto.id, nextStage)
    setMoving(false)
  }

  async function handleDelete() {
    if (!confirm('Deletar este projeto? Esta ação não pode ser desfeita.')) return
    await deletarProjeto(projeto.id)
    setMenuOpen(false)
  }

  return (
    <div
      className="rounded-xl border p-4 cursor-pointer group"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2 flex-1"
          style={{ color: 'var(--color-foreground)' }}
        >
          {projeto.title}
        </h3>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-10 rounded-xl border shadow-xl min-w-[140px] py-1"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(projeto); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                style={{ color: 'var(--color-foreground)' }}
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                style={{ color: '#EF4444' }}
              >
                <Trash2 size={14} /> Deletar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cliente */}
      <p className="text-xs mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
        {projeto.cliente.company || projeto.cliente.name}
      </p>

      {/* Labels */}
      {projeto.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {projeto.labels.map(({ label }) => (
            <span
              key={label.id}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${label.cor}22`, color: label.cor }}
            >
              {label.nome}
            </span>
          ))}
        </div>
      )}

      {/* Infos */}
      <div className="space-y-1.5">
        {projeto.dataEvento && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <Calendar size={12} />
            <span>Evento: {formatDate(projeto.dataEvento)}</span>
          </div>
        )}
        {projeto.revenueExpected && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <DollarSign size={12} />
            <span>{formatCurrency(Number(projeto.revenueExpected))}</span>
            {margem !== null && margem > 0 && (
              <span style={{ color: '#22C55E' }}>
                (+{formatCurrency(margem)})
              </span>
            )}
          </div>
        )}
        {projeto.responsavel && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <User size={12} />
            <span>{projeto.responsavel.name}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {nextStage && (
        <button
          onClick={handleMoveNext}
          disabled={moving}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border transition-colors opacity-0 group-hover:opacity-100"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-muted-foreground)',
          }}
        >
          {moving ? 'Movendo...' : (
            <>Mover para {STAGE_LABELS[nextStage]} <ChevronRight size={12} /></>
          )}
        </button>
      )}
    </div>
  )
}
