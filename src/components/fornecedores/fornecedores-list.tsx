'use client'

import { useState } from 'react'
import { Plus, Phone, Mail, Trash2, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { criarFornecedor, deletarFornecedor } from '@/modules/fornecedores/actions'
import type { Fornecedor } from '@/generated/prisma/client'

interface FornecedoresListProps {
  fornecedores: Fornecedor[]
}

export function FornecedoresList({ fornecedores }: FornecedoresListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarFornecedor(new FormData(e.currentTarget)) as { error?: string; success?: boolean }
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar este fornecedor?')) return
    await deletarFornecedor(id)
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Fornecedores</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
            {fornecedores.length} fornecedor{fornecedores.length !== 1 ? 'es' : ''} cadastrado{fornecedores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          <Plus size={16} /> Novo fornecedor
        </button>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {fornecedores.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Nenhum fornecedor cadastrado
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <div
              className="grid grid-cols-5 px-5 py-3 text-xs font-semibold"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <span>Nome</span>
              <span>Serviço</span>
              <span>Contato</span>
              <span>Valor/hora</span>
              <span></span>
            </div>
            {fornecedores.map(f => (
              <div key={f.id} className="grid grid-cols-5 items-center px-5 py-4 hover:bg-white/3 group">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{f.nome}</p>
                  {f.documento && <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{f.documento}</p>}
                </div>
                <span className="text-sm px-2 py-1 rounded-lg w-fit" style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted-foreground)' }}>
                  {f.servico}
                </span>
                <div className="space-y-1">
                  {f.email && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      <Mail size={11} /> {f.email}
                    </div>
                  )}
                  {f.telefone && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      <Phone size={11} /> {f.telefone}
                    </div>
                  )}
                </div>
                <div>
                  {f.valorHora ? (
                    <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-foreground)' }}>
                      <DollarSign size={14} /> {formatCurrency(Number(f.valorHora))}/h
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>—</span>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>Novo fornecedor</h2>
              <button onClick={() => setFormOpen(false)} style={{ color: 'var(--color-muted-foreground)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Nome *</label>
                  <input name="nome" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Serviço *</label>
                  <input name="servico" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required placeholder="Ex: Aluguel de lente" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Email</label>
                  <input type="email" name="email" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Telefone</label>
                  <input name="telefone" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>CPF/CNPJ</label>
                  <input name="documento" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Valor/hora (R$)</label>
                  <input type="number" step="0.01" name="valorHora" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
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
