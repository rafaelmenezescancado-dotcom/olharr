import { requireRole } from '@/lib/auth/require-role'
import { getOrcamentoById } from '@/modules/orcamentos/queries'
import { OrcamentoDetail } from '@/components/orcamentos/orcamento-detail'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrcamentoPage({ params }: Props) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const { id } = await params
  const orcamento = await getOrcamentoById(id)
  if (!orcamento) notFound()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <OrcamentoDetail orcamento={orcamento} />
    </div>
  )
}
