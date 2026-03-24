import { requireRole } from '@/lib/auth/require-role'
import { getProjetosKanban, getClientesForSelect, getUsersForSelect } from '@/modules/projetos/queries'
import { ProjetosKanban } from '@/components/projetos/projetos-kanban'

export const dynamic = 'force-dynamic'

export default async function ProjetosPage() {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])

  const [projetosByStage, clientes, users] = await Promise.all([
    getProjetosKanban(),
    getClientesForSelect(),
    getUsersForSelect(),
  ])

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <ProjetosKanban
        projetosByStage={projetosByStage}
        clientes={clientes}
        users={users}
      />
    </div>
  )
}
