'use client'

import { useState } from 'react'
import { Plus, Trash2, Calendar, Clock, Tag, Folder } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { criarEvento, deletarEvento } from '@/modules/agenda/actions'

type Evento = {
  id: string
  titulo: string
  descricao: string | null
  tipo: string
  inicio: Date
  fim: Date | null
  allDay: boolean
  projeto: { id: string; title: string } | null
}

interface AgendaListProps {
  eventos: Evento[]
  projetos: Array<{ id: string; title: string }>
}

const TIPO_COLORS: Record<string, string> = {
  EVENTO: '#1E7FCD',
  REUNIAO: '#8B5CF6',
  ENTREGA: '#22C55E',
  PRAZO: '#EF4444',
  OUTRO: '#F59E0B',
}

const TIPOS = ['EVENTO', 'REUNIAO', 'ENTREGA', 'PRAZO', 'OUTRO']
const TIPO_LABELS: Record<string, string> = {
  EVENTO: 'Evento',
  REUNIAO: 'Reunião',
  ENTREGA: 'Entrega',
  PRAZO: 'Prazo',
  OUTRO: 'Outro',
}

export function AgendaList({ eventos, projetos }: AgendaListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarEvento(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  // Agrupar eventos por mês
  const filtrados = filtroTipo ? eventos.filter(e => e.tipo === filtroTipo) : eventos
  const agrupados = filtrados.reduce((acc, ev) => {
    const mes = new Date(ev.inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!acc[mes]) acc[mes] = []
    acc[mes].push(ev)
    return acc
  }, {} as Record<string, Evento[]>)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Agenda</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {eventos.length} evento{eventos.length !== 1 ? 's' : ''} cadastrado{eventos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo evento
        </button>
      </div>

      {/* Filtros por tipo */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFiltroTipo(null)}
          className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
          style={{
            background: filtroTipo === null ? 'var(--color-primary)' : 'transparent',
            borderColor: filtroTipo === null ? 'var(--color-primary)' : 'var(--color-border)',
            color: filtroTipo === null ? '#fff' : 'var(--color-muted-foreground)',
          }}
        >
          Todos
        </button>
        {TIPOS.map(tipo => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(filtroTipo === tipo ? null : tipo)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
            style={{
              background: filtroTipo === tipo ? `${TIPO_COLORS[tipo]}20` : 'transparent',
              borderColor: filtroTipo === tipo ? TIPO_COLORS[tipo] : 'var(--color-border)',
              color: filtroTipo === tipo ? TIPO_COLORS[tipo] : 'var(--color-muted-foreground)',
            }}
          >
            {TIPO_LABELS[tipo]}
          </button>
        ))}
      </div>

      {Object.keys(agrupados).length === 0 ? (
        <div className="rounded-2xl border p-12 text-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', background: 'var(--color-surface)' }}>
          Nenhum evento encontrado
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(agrupados).map(([mes, evs]) => (
            <div key={mes}>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 capitalize" style={{ color: 'var(--color-muted-foreground)' }}>
                {mes}
              </h2>
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {evs.map(ev => {
                    const color = TIPO_COLORS[ev.tipo] ?? '#8B82A0'
                    return (
                      <div key={ev.id} className="flex items-start gap-4 px-5 py-4 group hover:bg-white/3">
                        {/* Color bar */}
                        <div className="w-1 h-10 rounded-full shrink-0 mt-0.5" style={{ background: color }} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{ev.titulo}</p>
                            <button
                              onClick={() => deletarEvento(ev.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shrink-0"
                              style={{ color: '#EF4444' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {ev.descricao && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{ev.descricao}</p>
                          )}
                          <div className="flex items-center flex-wrap gap-3 mt-1.5">
                            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                              <Calendar size={11} />
                              {ev.allDay ? formatDate(ev.inicio) : formatDateTime(ev.inicio)}
                            </div>
                            {ev.fim && (
                              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                <Clock size={11} />
                                até {ev.allDay ? formatDate(ev.fim) : formatDateTime(ev.fim)}
                              </div>
                            )}
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{ background: `${color}20`, color }}
                            >
                              <Tag size={10} /> {TIPO_LABELS[ev.tipo] ?? ev.tipo}
                            </span>
                            {ev.projeto && (
                              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                                <Folder size={10} /> {ev.projeto.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo evento</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Título *</label>
                <input name="titulo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Tipo</label>
                  <select name="tipo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                    {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Projeto</label>
                  <select name="projectId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                    <option value="">Nenhum</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Início *</label>
                  <input type="datetime-local" name="inicio" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Fim</label>
                  <input type="datetime-local" name="fim" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Descrição</label>
                <textarea name="descricao" rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} />
              </div>
              <div className="flex items-center gap-2">
                <input type="hidden" name="allDay" value="false" />
                <input type="checkbox" name="allDay" value="true" id="allDay" className="w-4 h-4 rounded" />
                <label htmlFor="allDay" className="text-sm" style={{ color: 'var(--color-foreground)' }}>Dia inteiro</label>
              </div>
              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Salvando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
