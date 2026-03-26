import { requireRole } from '@/lib/auth/require-role'
import { getFreelancers } from '@/modules/talentos/queries'
import { TalentosGrid } from '@/components/talentos/talentos-grid'

export const dynamic = 'force-dynamic'

export default async function TalentosPage() {
  await requireRole(['ADMIN', 'PRODUTOR'])

  const result = await getFreelancers()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <TalentosGrid freelancers={result.data} />
    </div>
  )
}
