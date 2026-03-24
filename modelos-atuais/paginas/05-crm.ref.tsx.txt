import { requireRole } from '@/lib/auth/require-role'
import { getClientesKanban } from '@/modules/crm/queries'
import { CrmKanban } from '@/components/crm/crm-kanban'

export const dynamic = 'force-dynamic'

export default async function CrmPage() {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const clientesByStage = await getClientesKanban()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <CrmKanban clientesByStage={clientesByStage} />
    </div>
  )
}
