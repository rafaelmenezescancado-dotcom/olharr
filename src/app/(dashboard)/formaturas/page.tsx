import { requireRole } from '@/lib/auth/require-role'
import { getTurmas } from '@/modules/formaturas/queries'
import { prisma } from '@/lib/prisma'
import { FormaturasList } from '@/components/formaturas/formaturas-list'

export const dynamic = 'force-dynamic'

export default async function FormaturasPage() {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])

  const [turmas, clientes] = await Promise.all([
    getTurmas(),
    prisma.client.findMany({
      select: { id: true, name: true, company: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <FormaturasList turmas={turmas} clientes={clientes} />
    </div>
  )
}
