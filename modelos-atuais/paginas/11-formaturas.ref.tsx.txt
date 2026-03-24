import { requireRole } from '@/lib/auth/require-role'
import { getTurmas } from '@/modules/formaturas/queries'
import { FormaturasList } from '@/components/formaturas/formaturas-list'

export const dynamic = 'force-dynamic'

export default async function FormaturasPage() {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])

  const turmas = await getTurmas()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <FormaturasList turmas={turmas} />
    </div>
  )
}
