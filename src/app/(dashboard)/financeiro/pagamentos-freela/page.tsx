import { requireRole } from '@/lib/auth/require-role'
import { getPagamentosKanban } from '@/modules/pagamentos-freela/queries'
import { getFreelancers } from '@/modules/talentos/queries'
import { getProjetosList } from '@/modules/projetos/queries'
import { PagamentosKanban } from '@/components/pagamentos-freela/pagamentos-kanban'

export const dynamic = 'force-dynamic'

export default async function PagamentosFreelaPage() {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])

  const [byFase, freelancersResult, projetos] = await Promise.all([
    getPagamentosKanban(),
    getFreelancers(),
    getProjetosList(),
  ])

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <PagamentosKanban byFase={byFase} freelancers={freelancersResult.data} projetos={projetos} />
    </div>
  )
}
