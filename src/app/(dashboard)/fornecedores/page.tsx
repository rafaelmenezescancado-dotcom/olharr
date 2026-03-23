import { requireRole } from '@/lib/auth/require-role'
import { getFornecedores } from '@/modules/fornecedores/queries'
import { FornecedoresList } from '@/components/fornecedores/fornecedores-list'

export const dynamic = 'force-dynamic'

export default async function FornecedoresPage() {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const fornecedores = await getFornecedores()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <FornecedoresList fornecedores={fornecedores} />
    </div>
  )
}
