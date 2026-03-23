import { requireRole } from '@/lib/auth/require-role'
import { getOrcamentos } from '@/modules/orcamentos/queries'
import { prisma } from '@/lib/prisma'
import { OrcamentosList } from '@/components/orcamentos/orcamentos-list'

export const dynamic = 'force-dynamic'

export default async function OrcamentosPage() {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const [orcamentos, clientes] = await Promise.all([
    getOrcamentos(),
    prisma.client.findMany({
      select: { id: true, name: true, company: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <OrcamentosList orcamentos={orcamentos} clientes={clientes} />
    </div>
  )
}
