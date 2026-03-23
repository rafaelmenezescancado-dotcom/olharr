import { requireAuth } from '@/lib/auth/require-role'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Clapperboard, Users, CheckSquare, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()

  const [projetosAtivos, clientesTotal, tarefasPendentes, receitaPrevista] = await Promise.all([
    prisma.project.count({ where: { stage: { notIn: ['ENTREGUE', 'ARQUIVADO'] } } }),
    prisma.client.count(),
    prisma.tarefa.count({ where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
    prisma.project.aggregate({
      where: { stage: { notIn: ['ARQUIVADO'] } },
      _sum: { revenueExpected: true },
    }),
  ])

  const stats = [
    { label: 'Projetos Ativos', value: projetosAtivos, icon: Clapperboard, color: '#1E7FCD' },
    { label: 'Clientes', value: clientesTotal, icon: Users, color: '#B52774' },
    { label: 'Tarefas Pendentes', value: tarefasPendentes, icon: CheckSquare, color: '#F59E0B' },
    {
      label: 'Receita Prevista',
      value: formatCurrency(Number(receitaPrevista._sum.revenueExpected ?? 0)),
      icon: DollarSign,
      color: '#22C55E',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F0EDF5' }}>
          Olá, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8B82A0' }}>
          Aqui está o resumo do dia
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-lg p-4"
              style={{ background: '#252035', border: '1px solid #3A3550' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="size-4" style={{ color: stat.color }} />
                <span className="text-xs" style={{ color: '#8B82A0' }}>
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#F0EDF5' }}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
