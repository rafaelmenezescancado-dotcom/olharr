import { requireRole } from '@/lib/auth/require-role'
import { Package } from 'lucide-react'

export default async function InsumosPage() {
  await requireRole(['ADMIN', 'PRODUTOR'])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Package className="size-6" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Insumos
        </h1>
      </div>
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p style={{ color: 'var(--color-muted-foreground)' }}>
          Módulo em construção — gestão de insumos e materiais.
        </p>
      </div>
    </div>
  )
}
