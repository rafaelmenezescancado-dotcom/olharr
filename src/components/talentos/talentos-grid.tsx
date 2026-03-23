'use client'

import { useState } from 'react'
import { Plus, Phone, Mail, Car, Trash2, DollarSign, Instagram } from 'lucide-react'
import { formatCurrency, getInitials } from '@/lib/utils'
import { criarFreelancer, deletarFreelancer } from '@/modules/talentos/actions'
import type { Freelancer } from '@/generated/prisma/client'

interface TalentosGridProps {
  freelancers: Freelancer[]
}

const PIX_TYPES = ['CPF', 'CNPJ', 'Email', 'Telefone', 'Aleatória']

export function TalentosGrid({ freelancers }: TalentosGridProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = freelancers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarFreelancer(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setFormOpen(false)
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este freelancer do banco de talentos?')) return
    await deletarFreelancer(id)
  }

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Talentos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {freelancers.length} freelancer{freelancers.length !== 1 ? 's' : ''} cadastrado{freelancers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo freelancer
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou especialidade..."
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(f => (
          <div
            key={f.id}
            className="rounded-2xl border p-5 group relative"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={() => handleDelete(f.id)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
              style={{ color: '#EF4444' }}
            >
              <Trash2 size={14} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {getInitials(f.name)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{f.name}</p>
                {f.fullName && f.fullName !== f.name && (
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{f.fullName}</p>
                )}
              </div>
            </div>

            {/* Especialidades */}
            {f.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {f.specialties.slice(0, 3).map(s => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(181,39,116,0.15)', color: 'var(--color-primary)' }}
                  >
                    {s}
                  </span>
                ))}
                {f.specialties.length > 3 && (
                  <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>+{f.specialties.length - 3}</span>
                )}
              </div>
            )}

            {/* Infos */}
            <div className="space-y-1.5">
              {f.email && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <Mail size={11} /> <span className="truncate">{f.email}</span>
                </div>
              )}
              {f.phone && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <Phone size={11} /> {f.phone}
                </div>
              )}
              {f.instagram && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <Instagram size={11} /> {f.instagram}
                </div>
              )}
              {f.dailyRate && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  <DollarSign size={11} /> {formatCurrency(Number(f.dailyRate))}/dia
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2 mt-3">
              {f.hasCar && (
                <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: '#22C55E22', color: '#22C55E' }}>
                  <Car size={10} /> Possui carro
                </div>
              )}
              {f.pixKey && (
                <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1E7FCD22', color: '#1E7FCD' }}>
                  PIX {f.pixType || ''}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            <p className="text-sm">{search ? 'Nenhum freelancer encontrado' : 'Nenhum freelancer cadastrado'}</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo freelancer</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Nome artístico *</label>
                  <input name="name" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Nome completo</label>
                  <input name="fullName" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Email</label>
                  <input type="email" name="email" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Telefone</label>
                  <input name="phone" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>CPF</label>
                  <input name="cpf" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Instagram</label>
                  <input name="instagram" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="@usuario" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Especialidades (separadas por vírgula)</label>
                <input name="specialties" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Câmera A, Drone, Iluminação" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Diária (R$)</label>
                  <input type="number" step="0.01" name="dailyRate" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Tipo PIX</label>
                  <select name="pixType" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                    <option value="">Sem PIX</option>
                    {PIX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Chave PIX</label>
                <input name="pixKey" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
              </div>

              <div className="flex items-center gap-3">
                <input type="hidden" name="hasCar" value="false" />
                <input type="checkbox" name="hasCar" value="true" id="hasCar" className="w-4 h-4 rounded" />
                <label htmlFor="hasCar" className="text-sm" style={{ color: 'var(--color-foreground)' }}>Possui carro</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Observações</label>
                <textarea name="observacoes" rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} />
              </div>

              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
