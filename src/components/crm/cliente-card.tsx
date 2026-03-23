'use client'

import { useState } from 'react'
import { Phone, Mail, Instagram, MoreHorizontal, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { ClientWithContatos } from '@/modules/crm/types'
import { CRM_STAGE_LABELS, CRM_STAGE_ORDER } from '@/modules/crm/types'
import { atualizarClienteStage, deletarCliente } from '@/modules/crm/actions'
import type { CrmStage } from '@/generated/prisma/client'

interface ClienteCardProps {
  cliente: ClientWithContatos
  onEdit: (cliente: ClientWithContatos) => void
}

export function ClienteCard({ cliente, onEdit }: ClienteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const currentIndex = CRM_STAGE_ORDER.indexOf(cliente.stage as CrmStage)
  const nextStage = CRM_STAGE_ORDER[currentIndex + 1]
  const hasNext = nextStage && nextStage !== 'FECHADO_PERDIDO' && nextStage !== 'INATIVO'

  async function handleMoveNext() {
    if (!nextStage || moving) return
    setMoving(true)
    await atualizarClienteStage(cliente.id, nextStage)
    setMoving(false)
  }

  async function handleDelete() {
    if (!confirm('Deletar este cliente? Todos os projetos vinculados serão afetados.')) return
    await deletarCliente(cliente.id)
    setMenuOpen(false)
  }

  const initials = getInitials(cliente.name)

  return (
    <div
      className="rounded-xl border p-4 group"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-foreground)' }}>
            {cliente.name}
          </p>
          {cliente.company && (
            <p className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
              {cliente.company}
            </p>
          )}
        </div>
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
                onClick={() => { onEdit(cliente); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5"
                style={{ color: 'var(--color-foreground)' }}
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5"
                style={{ color: '#EF4444' }}
              >
                <Trash2 size={14} /> Deletar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contatos */}
      <div className="space-y-1">
        {cliente.email && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <Mail size={11} />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
        {cliente.phone && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <Phone size={11} />
            <span>{cliente.phone}</span>
          </div>
        )}
        {cliente.instagram && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <Instagram size={11} />
            <span>{cliente.instagram}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-3">
        {cliente.comoChegou && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted-foreground)' }}
          >
            {cliente.comoChegou}
          </span>
        )}
        {cliente.retemISS && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: '#F59E0B22', color: '#F59E0B' }}
          >
            Retém ISS
          </span>
        )}
      </div>

      {/* Move button */}
      {hasNext && (
        <button
          onClick={handleMoveNext}
          disabled={moving}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border transition-colors opacity-0 group-hover:opacity-100"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
        >
          {moving ? 'Movendo...' : (
            <>Mover para {CRM_STAGE_LABELS[nextStage]} <ChevronRight size={12} /></>
          )}
        </button>
      )}
    </div>
  )
}
