'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronRight, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { criarPost, atualizarStatusPost, deletarPost } from '@/modules/calendario/actions'
import type { PostStatus } from '@/generated/prisma/client'

type Post = {
  id: string
  titulo: string
  legenda: string | null
  tipo: string
  status: PostStatus
  dataPublicacao: Date | null
}

interface CalendarioBoardProps {
  byStatus: Record<PostStatus, Post[]>
}

const STATUS_LABELS: Record<PostStatus, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  APROVADO: 'Aprovado',
  PUBLICADO: 'Publicado',
  REJEITADO: 'Rejeitado',
}

const STATUS_COLORS: Record<PostStatus, string> = {
  RASCUNHO: '#9B96B0',
  AGUARDANDO_APROVACAO: '#F59E0B',
  APROVADO: '#22C55E',
  PUBLICADO: '#1E7FCD',
  REJEITADO: '#EF4444',
}

const STATUS_FLOW: PostStatus[] = [
  'RASCUNHO',
  'AGUARDANDO_APROVACAO',
  'APROVADO',
  'PUBLICADO',
  'REJEITADO',
]

const VISIBLE_STATUSES: PostStatus[] = ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO']

const TIPO_LABELS: Record<string, string> = {
  FEED: 'Feed',
  STORIES: 'Stories',
  REELS: 'Reels',
  CARROSSEL: 'Carrossel',
}

export function CalendarioBoard({ byStatus }: CalendarioBoardProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarPost(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Calendário Social</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Pipeline de conteúdo</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo post
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {VISIBLE_STATUSES.map(status => {
          const posts = byStatus[status] ?? []
          const color = STATUS_COLORS[status]
          const nextIdx = STATUS_FLOW.indexOf(status) + 1
          const nextStatus = STATUS_FLOW[nextIdx] as PostStatus | undefined

          return (
            <div key={status} className="flex-shrink-0 w-72 flex flex-col">
              <div
                className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
                style={{ background: `${color}15` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold" style={{ color }}>{STATUS_LABELS[status]}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}25`, color }}>
                  {posts.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    nextStatus={nextStatus}
                    color={color}
                  />
                ))}
                {posts.length === 0 && (
                  <div className="rounded-xl border border-dashed p-5 text-center text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-subtle)' }}>
                    Nenhum post
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo post</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Título *</label>
                <input name="titulo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Ex: Case de casamento João & Ana" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Legenda</label>
                <textarea name="legenda" rows={3} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} placeholder="Texto do post..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Tipo</label>
                  <select name="tipo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                    {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Data publicação</label>
                  <input type="date" name="dataPublicacao" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function PostCard({ post, nextStatus, color }: { post: Post; nextStatus?: PostStatus; color: string }) {
  const [moving, setMoving] = useState(false)

  async function handleAdvance() {
    if (!nextStatus || moving) return
    setMoving(true)
    await atualizarStatusPost(post.id, nextStatus)
    setMoving(false)
  }

  const TIPO_LABELS: Record<string, string> = {
    FEED: 'Feed', STORIES: 'Stories', REELS: 'Reels', CARROSSEL: 'Carrossel',
  }

  return (
    <div
      className="rounded-xl border p-4 group"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold flex-1" style={{ color: 'var(--color-foreground)' }}>
          {post.titulo}
        </p>
        <button
          onClick={() => deletarPost(post.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded shrink-0"
          style={{ color: '#EF4444' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {post.legenda && (
        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--color-muted-foreground)' }}>
          {post.legenda}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}
        >
          {TIPO_LABELS[post.tipo] ?? post.tipo}
        </span>
        {post.dataPublicacao && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <Calendar size={10} /> {formatDate(post.dataPublicacao)}
          </span>
        )}
      </div>

      {nextStatus && nextStatus !== 'REJEITADO' && (
        <button
          onClick={handleAdvance}
          disabled={moving}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
        >
          {moving ? '...' : <>{STATUS_LABELS[nextStatus]} <ChevronRight size={12} /></>}
        </button>
      )}
    </div>
  )
}
