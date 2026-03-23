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
    { label: 'Clientes', value: clientesTotal, icon: Users, color: '#8B5CF6' },
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Olá, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Aqui está o resumo do dia
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                  {stat.label}
                </span>
                <div
                  className="size-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <Icon className="size-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
