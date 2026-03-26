import { requireRole } from '@/lib/auth/require-role'
import { getTransacoesComResumo } from '@/modules/financeiro/queries'
import { FinanceiroDashboard } from '@/components/financeiro/financeiro-dashboard'
import type { FinancialAccount, Transaction } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

interface TransacaoComConta extends Transaction {
  conta: Pick<FinancialAccount, 'id' | 'nome' | 'banco'>
}

export default async function FinanceiroPage() {
  await requireRole(['ADMIN', 'FINANCEIRO'])

  const { data: transacoes, contas, entradas, saidas } = await getTransacoesComResumo()

  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <FinanceiroDashboard
        transacoes={transacoes as TransacaoComConta[]}
        contas={contas}
        entradas={entradas}
        saidas={saidas}
      />
    </div>
  )
}
