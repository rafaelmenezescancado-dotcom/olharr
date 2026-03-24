import { requireAuth } from '@/lib/auth/require-role'
import { prisma } from '@/lib/prisma'
import { ConfiguracoesView } from '@/components/configuracoes/configuracoes-view'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const currentUser = await requireAuth()

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: { name: 'asc' },
  })

  return (
    <ConfiguracoesView
      currentUser={{ name: currentUser.name, email: currentUser.email, role: currentUser.role }}
      usuarios={usuarios}
    />
  )
}
