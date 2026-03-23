import { requireAuth } from '@/lib/auth/require-role'
import { getPostsKanban } from '@/modules/calendario/queries'
import { CalendarioBoard } from '@/components/calendario/calendario-board'

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  await requireAuth()
  const byStatus = await getPostsKanban()

  return <CalendarioBoard byStatus={byStatus} />
}
