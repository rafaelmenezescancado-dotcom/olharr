import { requireRole } from '@/lib/auth/require-role'
import { getFluxoCaixa } from '@/modules/financeiro/queries'
import { FluxoCaixaView } from '@/components/financeiro/fluxo-caixa-view'

export const dynamic = 'force-dynamic'

export default async function FluxoCaixaPage() {
  await requireRole(['ADMIN', 'FINANCEIRO'])
  const dados = await getFluxoCaixa(6)

  return <FluxoCaixaView dados={dados} />
}
