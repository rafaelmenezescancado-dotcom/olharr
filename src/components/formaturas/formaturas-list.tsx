'use client'

import { useState } from 'react'
import {
  GraduationCap,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  CalendarDays,
  Users,
  DollarSign,
  Camera,
  Clock,
  X,
  LayoutList,
  Gift,
  LinkIcon,
  Phone,
  Mail,
  CheckCircle,
  Circle,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { criarTurma } from '@/modules/formaturas/actions'
import type { TurmaStatus, ParcelaStatus } from '@/generated/prisma/client'

type Parcela = {
  id: string
  valor: unknown
  vencimento: Date
  status: ParcelaStatus
  paidAt: Date | null
}

type Formando = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  parcelas: Parcela[]
}

type Evento = {
  id: string
  nome: string
  data: Date
  local: string | null
  custos: { id: string; descricao: string; valor: unknown }[]
}

type Turma = {
  id: string
  nome: string
  status: TurmaStatus
  dataEvento: Date | null
  valorTotal: unknown
  observacoes: string | null
  cliente: { id: string; name: string; company: string | null }
  formandos: Formando[]
  eventos: Evento[]
}

interface FormaturasListProps {
  turmas: Turma[]
}

const STATUS_LABELS: Record<TurmaStatus, string> = {
  ATIVA: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

function getStatusBadge(status: TurmaStatus) {
  switch (status) {
    case 'CONCLUIDA': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'ATIVA': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'CANCELADA': return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function computeProgress(turma: Turma) {
  const valorTotal = Number(turma.valorTotal ?? 0)
  const totalArrecadado = turma.formandos.reduce(
    (sum, f) => sum + f.parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + Number(p.valor), 0),
    0
  )
  const progressoFinanceiro = valorTotal > 0 ? Math.round((totalArrecadado / valorTotal) * 100) : 0

  const totalEventos = turma.eventos.length
  const eventosConcluidos = turma.eventos.filter(e => new Date(e.data) < new Date()).length
  const progressoExecucao = totalEventos > 0 ? Math.round((eventosConcluidos / totalEventos) * 100) : 0

  return { totalArrecadado, progressoFinanceiro, progressoExecucao }
}

function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function FormaturasList({ turmas }: FormaturasListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)
  const [modalTab, setModalTab] = useState('resumo')
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Compute stats
  const turmasAtivas = turmas.filter(t => t.status === 'ATIVA').length
  const totalFormandos = turmas.reduce((sum, t) => sum + t.formandos.length, 0)
  const receitaPrevista = turmas.reduce((sum, t) => sum + Number(t.valorTotal ?? 0), 0)
  const proximosEventosAll = turmas
    .flatMap(t => t.eventos.map(e => ({ ...e, turmaNome: t.nome })))
    .filter(e => new Date(e.data) >= new Date())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 8)

  const stats = [
    { title: 'Turmas Ativas', value: String(turmasAtivas), icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Formandos Geridos', value: String(totalFormandos), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Receita Prevista', value: formatCurrency(receitaPrevista), icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
    { title: 'Eventos Pendentes', value: String(proximosEventosAll.length), icon: Camera, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const filteredTurmas = turmas.filter(t =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.cliente.company ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarTurma(new FormData(e.currentTarget)) as { error?: string; success?: boolean }
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  const inputStyle = {
    background: 'var(--color-background)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-foreground)',
  }

  return (
    <div className="space-y-6 font-sans relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <GraduationCap className="mr-3 text-indigo-600" size={28} />
            Gestão de Formaturas
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe turmas, contratos e eventos.</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center cursor-pointer"
        >
          <Plus size={18} className="mr-2" />
          Nova Turma
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className={`p-3 rounded-lg ${stat.bg} mr-4`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Turmas List */}
        <div className="lg:col-span-2 space-y-4">

          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar turma ou curso..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg transition-all flex items-center cursor-pointer whitespace-nowrap">
              <Filter size={16} className="mr-2" /> Filtros
            </button>
          </div>

          {/* Turma Cards */}
          {filteredTurmas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400 bg-white">
              Nenhuma turma encontrada
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTurmas.map((turma) => {
                const { totalArrecadado, progressoFinanceiro, progressoExecucao } = computeProgress(turma)
                const proximoEvento = turma.eventos.find(e => new Date(e.data) >= new Date())
                return (
                  <div key={turma.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{turma.nome}</h3>
                      </div>
                      <button className="text-slate-400 hover:text-indigo-600 cursor-pointer p-1 rounded-md hover:bg-slate-50 relative z-20">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-5 text-sm">
                      <div className="flex items-center text-slate-600">
                        <Users size={16} className="mr-1.5 text-slate-400" />
                        <span className="font-medium">{turma.formandos.length}</span> formandos
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${getStatusBadge(turma.status)}`}>
                        {STATUS_LABELS[turma.status]}
                      </span>
                    </div>

                    {/* Progress Bars */}
                    <div className="mb-5 space-y-3 mt-auto">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500 font-medium uppercase tracking-wider">Execução do Contrato</span>
                          <span className="text-indigo-700 font-bold">{progressoExecucao}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressoExecucao}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500 font-medium uppercase tracking-wider">Recebimento Financeiro</span>
                          <span className="text-emerald-700 font-bold">{progressoFinanceiro}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressoFinanceiro}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm relative z-20">
                      <div className="flex items-center text-slate-600">
                        <CalendarDays size={16} className="mr-2 text-indigo-400" />
                        <span className="truncate max-w-[150px]">{proximoEvento?.nome ?? 'Sem eventos'}</span>
                      </div>
                      <span className="text-slate-500 font-medium">
                        {proximoEvento ? formatShortDate(proximoEvento.data) : '—'}
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 bg-indigo-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                      onClick={() => { setSelectedTurma(turma); setModalTab('resumo') }}
                    >
                      <span className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg shadow-sm border border-indigo-100 transition-transform transform scale-95 group-hover:scale-100">
                        Ver Detalhes
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Próximos Eventos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 flex items-center">
              <CalendarDays className="mr-2 text-indigo-600" size={20} />
              Próximos Eventos
            </h2>
          </div>
          <div className="p-2 flex-1 overflow-y-auto max-h-[600px]">
            {proximosEventosAll.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Nenhum evento futuro
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 my-2">
                {proximosEventosAll.map((evento) => (
                  <div key={evento.id} className="mb-6 ml-6 relative">
                    <span className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 ring-4 ring-white" />
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:border-indigo-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900 text-sm">{evento.nome}</h4>
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                          {formatShortDate(evento.data)}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-600 font-medium mb-2">{evento.turmaNome}</p>
                      <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                        {evento.local && (
                          <div className="flex items-center">
                            <Clock size={14} className="mr-2 text-slate-400" /> Local: {evento.local}
                          </div>
                        )}
                        {evento.custos.length > 0 && (
                          <div className="flex items-center">
                            <DollarSign size={14} className="mr-2 text-slate-400" />
                            Custos: {formatCurrency(evento.custos.reduce((s, c) => s + Number(c.valor), 0))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL - Turma Detail */}
      {selectedTurma && (() => {
        const t = selectedTurma
        const { totalArrecadado, progressoFinanceiro, progressoExecucao } = computeProgress(t)
        const totalCustos = t.eventos.reduce((sum, e) => sum + e.custos.reduce((s, c) => s + Number(c.valor), 0), 0)

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">

              {/* Modal Header */}
              <div className="px-6 pt-5 border-b border-slate-100 bg-slate-50 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-slate-900">{t.nome}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${getStatusBadge(t.status)}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm flex items-center gap-4">
                      <span>{t.cliente.company || t.cliente.name}</span>
                      <span className="flex items-center"><Users size={14} className="mr-1" /> {t.formandos.length} formandos</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTurma(null)}
                    className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-200 rounded-full p-2 transition-colors cursor-pointer shadow-sm border border-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-2">
                  {[
                    { id: 'resumo', label: 'Resumo Geral' },
                    { id: 'formandos', label: 'Formandos & Financeiro' },
                    { id: 'eventos', label: 'Eventos & Custos' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id)}
                      className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        modalTab === tab.id
                          ? 'border-indigo-600 text-indigo-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">

                {/* TAB: RESUMO */}
                {modalTab === 'resumo' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Contract Status */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                          <LayoutList size={18} className="mr-2 text-indigo-600" />
                          Status do Contrato
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Execução de Eventos</span>
                              <span className="font-bold text-indigo-700">{progressoExecucao}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progressoExecucao}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Recebimento Financeiro</span>
                              <span className="font-bold text-emerald-700">{progressoFinanceiro}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progressoFinanceiro}%` }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 mt-2">
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Arrecadado</p>
                              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalArrecadado)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Meta</p>
                              <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(t.valorTotal ?? 0))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Custos Eventos</p>
                              <p className="text-lg font-bold text-rose-600">{formatCurrency(totalCustos)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Upcoming Events */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                          <CalendarDays size={18} className="mr-2 text-indigo-600" />
                          Eventos ({t.eventos.length})
                        </h3>
                        <div className="space-y-2">
                          {t.eventos.slice(0, 5).map(e => {
                            const isPast = new Date(e.data) < new Date()
                            return (
                              <div key={e.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                {isPast
                                  ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                  : <Circle size={16} className="text-slate-300 shrink-0" />
                                }
                                <span className={`text-sm flex-1 ${isPast ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                  {e.nome}
                                </span>
                                <span className="text-xs text-slate-500">{formatShortDate(e.data)}</span>
                              </div>
                            )
                          })}
                          {t.eventos.length === 0 && (
                            <p className="text-sm text-slate-400">Nenhum evento cadastrado.</p>
                          )}
                        </div>
                      </div>

                      {/* Observações */}
                      {t.observacoes && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                          <h3 className="text-sm font-semibold text-slate-900 mb-2">Observações</h3>
                          <p className="text-sm text-slate-600">{t.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: FORMANDOS */}
                {modalTab === 'formandos' && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-sm font-semibold text-slate-900">Lista de Formandos</h3>
                      <span className="text-xs px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-medium">
                        {t.formandos.length} formandos
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-semibold">
                          <tr>
                            <th className="px-4 py-3">Nome</th>
                            <th className="px-4 py-3">Contatos</th>
                            <th className="px-4 py-3 text-center">Parcelas</th>
                            <th className="px-4 py-3 text-right">Pago</th>
                            <th className="px-4 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {t.formandos.map((formando) => {
                            const pagas = formando.parcelas.filter(p => p.status === 'PAGO').length
                            const atrasadas = formando.parcelas.filter(p => p.status === 'ATRASADO').length
                            const totalPago = formando.parcelas
                              .filter(p => p.status === 'PAGO')
                              .reduce((s, p) => s + Number(p.valor), 0)
                            const isInadimplente = atrasadas > 0

                            return (
                              <tr key={formando.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-900">{formando.nome}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 space-y-1">
                                  {formando.telefone && (
                                    <div className="flex items-center"><Phone size={12} className="mr-1.5 text-slate-400" /> {formando.telefone}</div>
                                  )}
                                  {formando.email && (
                                    <div className="flex items-center"><Mail size={12} className="mr-1.5 text-slate-400" /> {formando.email}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 font-medium">
                                  {pagas}/{formando.parcelas.length}
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                  {formatCurrency(totalPago)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isInadimplente ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                                      <AlertTriangle size={12} className="mr-1" /> Inadimplente
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                      Ok
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                          {t.formandos.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                Nenhum formando associado a esta turma.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: EVENTOS */}
                {modalTab === 'eventos' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-slate-500">Detalhamento de custos por evento.</p>
                    </div>

                    {t.eventos.map((evento) => {
                      const custoPrevisto = evento.custos.reduce((s, c) => s + Number(c.valor), 0)
                      const isPast = new Date(evento.data) < new Date()
                      return (
                        <div key={evento.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                {isPast && <CheckCircle2 size={16} className="text-emerald-500" />}
                                {evento.nome}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                                <CalendarDays size={12} className="mr-1" /> {formatShortDate(evento.data)}
                                {evento.local && <span className="ml-3">Local: {evento.local}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="p-5">
                            {evento.custos.length > 0 ? (
                              <div className="space-y-2">
                                {evento.custos.map(c => (
                                  <div key={c.id} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{c.descricao}</span>
                                    <span className="font-semibold text-slate-900">{formatCurrency(Number(c.valor))}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm pt-3 border-t border-slate-100 mt-2">
                                  <span className="font-semibold text-slate-700">Total</span>
                                  <span className="font-bold text-indigo-700">{formatCurrency(custoPrevisto)}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">Nenhum custo cadastrado.</p>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {t.eventos.length === 0 && (
                      <div className="py-8 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        Nenhum evento cadastrado ainda.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Create Turma Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border shadow-2xl bg-white border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Nova turma</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Curso *</label>
                <input name="curso" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Medicina" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Faculdade *</label>
                <input name="faculdade" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: UFMG" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Previsão de formatura *</label>
                <select name="semestre" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" required>
                  <option value="">Selecionar semestre...</option>
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = new Date().getFullYear() + Math.floor(i / 2)
                    const half = (i % 2) + 1
                    return `${year}.${half}`
                  }).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium border-slate-200 text-slate-500 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
