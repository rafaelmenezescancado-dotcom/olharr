import { requireAuth } from '@/lib/auth/require-role'
import { getTarefasByStatus } from '@/modules/tarefas/queries'
import { getProjetosList, getUsersForSelect } from '@/modules/projetos/queries'
import { TarefasBoard } from '@/components/tarefas/tarefas-board'

export const dynamic = 'force-dynamic'

export default async function TarefasPage() {
  await requireAuth()

  const [byStatus, projetos, users] = await Promise.all([
    getTarefasByStatus(),
    getProjetosList(),
    getUsersForSelect(),
  ])

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <TarefasBoard byStatus={byStatus} projetos={projetos} users={users} />
    </div>
  )
}
