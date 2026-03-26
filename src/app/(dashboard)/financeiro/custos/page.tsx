import { requireRole } from '@/lib/auth/require-role'
import { Receipt } from 'lucide-react'

export default async function CustosPage() {
  await requireRole(['ADMIN', 'FINANCEIRO'])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Receipt className="size-6" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Descrição de Custos
        </h1>
      </div>
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p style={{ color: 'var(--color-muted-foreground)' }}>
          Módulo em construção — catálogo de serviços e custos operacionais.
        </p>
      </div>
    </div>
  )
}
