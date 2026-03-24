import { requireRole } from '@/lib/auth/require-role'
import { getTurmaById } from '@/modules/formaturas/queries'
import { TurmaDetail } from '@/components/formaturas/turma-detail'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TurmaPage({ params }: Props) {
  await requireRole(['ADMIN', 'PRODUTOR', 'FINANCEIRO'])
  const { id } = await params
  const turma = await getTurmaById(id)
  if (!turma) notFound()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <TurmaDetail turma={turma} />
    </div>
  )
}
