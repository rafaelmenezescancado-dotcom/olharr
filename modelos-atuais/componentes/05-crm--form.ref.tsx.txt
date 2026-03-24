'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { criarCliente, atualizarCliente } from '@/modules/crm/actions'
import { CRM_STAGE_LABELS, CRM_STAGE_ORDER } from '@/modules/crm/types'
import type { ClientWithContatos } from '@/modules/crm/types'

interface ClienteFormProps {
  cliente?: ClientWithContatos
  onClose: () => void
}

export function ClienteForm({ cliente, onClose }: ClienteFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'principal' | 'contatos'>('principal')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = cliente
      ? await atualizarCliente(cliente.id, formData)
      : await criarCliente(formData)
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
            {cliente ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-muted-foreground)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
          {(['principal', 'contatos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{
                color: tab === t ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              {t === 'principal' ? 'Dados principais' : 'Contatos'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'principal' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                    Nome *
                  </label>
                  <input name="name" defaultValue={cliente?.name} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>
                    Empresa
                  </label>
                  <input name="company" defaultValue={cliente?.company ?? ''} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Email</label>
                  <input type="email" name="email" defaultValue={cliente?.email ?? ''} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Telefone</label>
                  <input name="phone" defaultValue={cliente?.phone ?? ''} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Instagram</label>
                  <input name="instagram" defaultValue={cliente?.instagram ?? ''} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="@usuario" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>CPF/CNPJ</label>
                  <input name="document" defaultValue={cliente?.document ?? ''} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Stage</label>
                  <select name="stage" defaultValue={cliente?.stage ?? 'NOVO_LEAD'} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle}>
                    {CRM_STAGE_ORDER.map(s => <option key={s} value={s}>{CRM_STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Como chegou</label>
                  <input name="comoChegou" defaultValue={cliente?.comoChegou ?? ''} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} placeholder="Instagram, indicação..." />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="hidden" name="retemISS" value="false" />
                <input
                  type="checkbox"
                  name="retemISS"
                  value="true"
                  id="retemISS"
                  defaultChecked={cliente?.retemISS}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="retemISS" className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                  Retém ISS
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-foreground)' }}>Observações</label>
                <textarea name="observacoes" defaultValue={cliente?.observacoes ?? ''} rows={3} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputStyle} />
              </div>
            </>
          )}

          {tab === 'contatos' && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>Contato Operacional</h3>
                <div className="space-y-3">
                  <input name="opNome" defaultValue={cliente?.contatoOperacional?.nome ?? ''} placeholder="Nome" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="opEmail" defaultValue={cliente?.contatoOperacional?.email ?? ''} placeholder="Email" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                    <input name="opTelefone" defaultValue={cliente?.contatoOperacional?.telefone ?? ''} placeholder="Telefone" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="opCargo" defaultValue={cliente?.contatoOperacional?.cargo ?? ''} placeholder="Cargo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                    <input name="opWhatsapp" defaultValue={cliente?.contatoOperacional?.whatsapp ?? ''} placeholder="WhatsApp" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>Contato Financeiro</h3>
                <div className="space-y-3">
                  <input name="finNome" defaultValue={cliente?.contatoFinanceiro?.nome ?? ''} placeholder="Nome" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="finEmail" defaultValue={cliente?.contatoFinanceiro?.email ?? ''} placeholder="Email" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                    <input name="finTelefone" defaultValue={cliente?.contatoFinanceiro?.telefone ?? ''} placeholder="Telefone" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                  </div>
                  <input name="finCargo" defaultValue={cliente?.contatoFinanceiro?.cargo ?? ''} placeholder="Cargo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputStyle} />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-white/5" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: '#fff' }}>
              {loading ? 'Salvando...' : cliente ? 'Salvar' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
