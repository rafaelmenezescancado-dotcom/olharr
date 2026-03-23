import { requireAuth } from '@/lib/auth/require-role'

export default async function FinanceiroPage() {
  await requireAuth()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: '#F0EDF5' }}>Financeiro</h1>
      <p style={{ color: '#8B82A0' }}>Em construção...</p>
    </div>
  )
}
