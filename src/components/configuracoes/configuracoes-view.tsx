'use client'

import { useState } from 'react'
import { User, Shield, Users, Plus } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { UserRole } from '@/generated/prisma/client'

type UsuarioItem = {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

interface ConfiguracoesViewProps {
  currentUser: { name: string; email: string; role: UserRole }
  usuarios: UsuarioItem[]
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PRODUTOR: 'Produtor',
  FINANCEIRO: 'Financeiro',
  EXTERNO: 'Externo',
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#EF4444',
  PRODUTOR: '#8B5CF6',
  FINANCEIRO: '#22C55E',
  EXTERNO: '#F59E0B',
}

export function ConfiguracoesView({ currentUser, usuarios }: ConfiguracoesViewProps) {
  const [tab, setTab] = useState<'perfil' | 'equipe'>('perfil')
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  const isAdmin = currentUser.role === 'ADMIN'

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Configurações</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Gerencie sua conta e equipe</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--color-surface)' }}>
        {([['perfil', 'Perfil', User], ...(isAdmin ? [['equipe', 'Equipe', Users]] : [])] as [string, string, React.ElementType][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key as 'perfil' | 'equipe')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: tab === key ? 'var(--color-primary)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--color-muted-foreground)',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div className="max-w-lg">
          <div className="rounded-2xl border p-6" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {getInitials(currentUser.name)}
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>{currentUser.name}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{currentUser.email}</p>
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                  style={{
                    background: `${ROLE_COLORS[currentUser.role]}20`,
                    color: ROLE_COLORS[currentUser.role],
                  }}
                >
                  <Shield size={10} /> {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>Nome</label>
                <div className="px-3 py-2.5 rounded-xl border text-sm" style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                  {currentUser.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>Email</label>
                <div className="px-3 py-2.5 rounded-xl border text-sm" style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                  {currentUser.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-muted-foreground)' }}>Perfil de acesso</label>
                <div className="px-3 py-2.5 rounded-xl border text-sm" style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}>
                  {ROLE_LABELS[currentUser.role]}
                </div>
              </div>
            </div>

            {success && (
              <p className="text-sm mt-4" style={{ color: '#22C55E' }}>Salvo com sucesso!</p>
            )}
          </div>
        </div>
      )}

      {tab === 'equipe' && isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {usuarios.length} membro{usuarios.length !== 1 ? 's' : ''} na equipe
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <Plus size={13} /> Adicionar membro
            </button>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {usuarios.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: `${ROLE_COLORS[u.role]}30`, color: ROLE_COLORS[u.role] }}
                  >
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{u.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{u.email}</p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role] }}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                  {!u.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EF444420', color: '#EF4444' }}>
                      Inativo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal adicionar membro */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo membro</h3>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Para adicionar um membro, crie o usuário no Supabase Auth e ele será vinculado automaticamente ao primeiro login.
              </p>
              <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--color-background)', color: 'var(--color-muted-foreground)', borderColor: 'var(--color-border)', border: '1px solid' }}>
                Acesse: <strong>supabase.com → Authentication → Users → Invite user</strong>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium mt-2"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
