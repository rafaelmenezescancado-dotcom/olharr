'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Filter,
  X,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  FileSignature,
  Calculator,
  CalendarDays,
  MapPin,
  Users,
  Users2,
  DollarSign,
  TrendingUp,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  CheckSquare,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { criarOrcamento, deletarOrcamento, atualizarStatusOrcamento } from '@/modules/orcamentos/actions'
import type { OrcamentoStatus } from '@/generated/prisma/client'
import Link from 'next/link'

type OrcamentoItem = {
  id: string
  descricao: string
  quantidade: number
  valorUnit: unknown
  categoria: string | null
}

type Orcamento = {
  id: string
  titulo: string
  status: OrcamentoStatus
  vertical: string | null
  validoAte: Date | null
  totalBruto: unknown
  margem: unknown
  observacoes: string | null
  createdAt: Date
  cliente: { id: string; name: string; company: string | null }
  itens: OrcamentoItem[]
}

interface OrcamentosListProps {
  orcamentos: Orcamento[]
  clientes: Array<{ id: string; name: string; company: string | null }>
}

const KANBAN_COLUMNS: {
  id: OrcamentoStatus
  titulo: string
  icon: typeof Clock
  color: string
  border: string
  bg: string
}[] = [
  { id: 'RASCUNHO', titulo: 'Em Elaboração', icon: Calculator, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
  { id: 'ENVIADO', titulo: 'Aguardando Resposta', icon: Send, color: 'text-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50' },
  { id: 'APROVADO', titulo: 'Aprovados', icon: CheckCircle, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  { id: 'RECUSADO', titulo: 'Recusados', icon: XCircle, color: 'text-rose-600', border: 'border-rose-200', bg: 'bg-rose-50' },
]

function getVerticalBadge(vertical: string | null) {
  switch (vertical?.toLowerCase()) {
    case 'casamento': case 'casamentos': return 'bg-rose-50 text-rose-600 border-rose-100'
    case 'formatura': case 'formaturas': return 'bg-indigo-50 text-indigo-600 border-indigo-100'
    case 'shows e festas': case 'festas': return 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100'
    case 'particular': return 'bg-teal-50 text-teal-600 border-teal-100'
    case 'corporativo': return 'bg-cyan-50 text-cyan-600 border-cyan-100'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function calcViabilidade(orc: Orcamento) {
  const totalBruto = Number(orc.totalBruto ?? 0)
  const margem = Number(orc.margem ?? 0)
  const custoItens = orc.itens.reduce((sum, i) => sum + Number(i.valorUnit) * i.quantidade, 0)
  const valorComMargem = totalBruto * (1 + margem / 100)
  const lucro = valorComMargem - custoItens
  const margemPct = valorComMargem > 0 ? (lucro / valorComMargem) * 100 : 0
  const pctCustos = valorComMargem > 0 ? (custoItens / valorComMargem) * 100 : 0
  return { custoItens, valorComMargem, lucro, margemPct, pctCustos }
}

export function OrcamentosList({ orcamentos, clientes }: OrcamentosListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroVertente, setFiltroVertente] = useState('Todas')
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter(orc => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase()
        if (!orc.titulo.toLowerCase().includes(s) && !orc.cliente.name.toLowerCase().includes(s) && !(orc.cliente.company ?? '').toLowerCase().includes(s)) return false
      }
      if (filtroVertente !== 'Todas' && orc.vertical?.toLowerCase() !== filtroVertente.toLowerCase()) return false
      return true
    })
  }, [orcamentos, searchTerm, filtroVertente])

  const stats = useMemo(() => {
    const total = filteredOrcamentos.length
    const emNegociacao = filteredOrcamentos
      .filter(o => o.status === 'RASCUNHO' || o.status === 'ENVIADO')
      .reduce((acc, o) => acc + Number(o.totalBruto), 0)
    const aprovados = filteredOrcamentos.filter(o => o.status === 'APROVADO').length
    const taxa = total > 0 ? Math.round((aprovados / total) * 100) : 0
    const valorTotal = filteredOrcamentos.reduce((acc, o) => acc + Number(o.totalBruto), 0)
    const ticket = total > 0 ? Math.round(valorTotal / total) : 0

    return [
      { title: 'Propostas', value: String(total), icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { title: 'Em Negociação', value: formatCurrency(emNegociacao), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
      { title: 'Taxa Aprovação', value: `${taxa}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { title: 'Ticket Médio', value: formatCurrency(ticket), icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
    ]
  }, [filteredOrcamentos])

  const verticals = useMemo(() => {
    const set = new Set(orcamentos.map(o => o.vertical).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [orcamentos])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await criarOrcamento(new FormData(e.currentTarget)) as { error?: string; success?: boolean; id?: string }
    if (result?.error) { setError(result.error); setLoading(false) }
    else { setFormOpen(false); setLoading(false) }
  }

  return (
    <div className="space-y-6 font-sans relative">

      {/* Header + Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Calculator className="mr-2 text-indigo-600" size={24} />
            Gestão de Orçamentos
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer"
            value={filtroVertente}
            onChange={(e) => setFiltroVertente(e.target.value)}
          >
            <option value="Todas">Todas as Vertentes</option>
            {verticals.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button
            onClick={() => setFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center cursor-pointer ml-auto xl:ml-0"
          >
            <Plus size={16} className="mr-1.5" />
            Novo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className={`p-3 rounded-lg ${stat.bg} mr-4`}>
              <stat.icon size={22} className={stat.color} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-5 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(coluna => {
          const items = filteredOrcamentos.filter(o => o.status === coluna.id)
          return (
            <div key={coluna.id} className="flex-1 min-w-[280px] max-w-[340px] flex flex-col">
              {/* Column Header */}
              <div className={`px-4 py-3 rounded-t-xl border-t border-x ${coluna.border} ${coluna.bg} flex justify-between items-center shrink-0`}>
                <h3 className={`font-bold text-sm ${coluna.color} flex items-center`}>
                  <coluna.icon size={16} className="mr-2" />
                  {coluna.titulo}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 text-slate-600">
                  {items.length}
                </span>
              </div>

              {/* Column Body */}
              <div className={`flex-1 p-3 bg-slate-100/50 border-x border-b ${coluna.border} rounded-b-xl overflow-y-auto space-y-3 max-h-[600px]`}>
                {items.map(orc => (
                  <div
                    key={orc.id}
                    onClick={() => setSelectedOrcamento(orc)}
                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group flex flex-col"
                  >
                    {/* Top badges */}
                    <div className="flex justify-between items-start mb-2">
                      {orc.vertical && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getVerticalBadge(orc.vertical)}`}>
                          {orc.vertical}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium ml-auto">
                        {formatShortDate(orc.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-700 transition-colors">
                      {orc.titulo}
                    </h4>

                    {/* Client */}
                    <Link
                      href={`/crm/${orc.cliente.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mb-3"
                    >
                      <Users size={12} className="mr-1.5 shrink-0" />
                      <span className="truncate">{orc.cliente.company || orc.cliente.name}</span>
                    </Link>

                    {/* Event info */}
                    {orc.validoAte && (
                      <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                        <CalendarDays size={12} className="shrink-0 text-slate-400" />
                        <span>Válido até {formatShortDate(orc.validoAte)}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(Number(orc.totalBruto))}
                      </span>
                      <span className="text-xs text-slate-400">
                        {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-medium">
                    Nenhum orçamento aqui
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedOrcamento && (() => {
        const orc = selectedOrcamento
        const via = calcViabilidade(orc)
        const margemColor = via.margemPct >= 40 ? 'text-emerald-600' : via.margemPct >= 25 ? 'text-amber-500' : 'text-rose-600'
        const barColor = via.margemPct >= 40 ? 'bg-emerald-500' : via.margemPct >= 25 ? 'bg-amber-400' : 'bg-rose-500'

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">

              {/* Modal Header */}
              <div className="px-6 md:px-8 py-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start shrink-0 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {orc.vertical && (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${getVerticalBadge(orc.vertical)}`}>
                        {orc.vertical}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      Criado em {formatShortDate(orc.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">{orc.titulo}</h2>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                    <Link
                      href={`/crm/${orc.cliente.id}`}
                      className="flex items-center font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded"
                    >
                      <Users size={14} className="mr-1.5" />
                      {orc.cliente.company || orc.cliente.name}
                      <ExternalLink size={12} className="ml-1" />
                    </Link>
                    {orc.validoAte && (
                      <span className="flex items-center">
                        <CalendarDays size={16} className="mr-1.5 text-slate-400" />
                        Válido até {formatShortDate(orc.validoAte)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Status selector */}
                  <select
                    value={orc.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as OrcamentoStatus
                      await atualizarStatusOrcamento(orc.id, newStatus)
                      setSelectedOrcamento({ ...orc, status: newStatus })
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="RECUSADO">Recusado</option>
                    <option value="EXPIRADO">Expirado</option>
                  </select>
                  <button
                    onClick={() => setSelectedOrcamento(null)}
                    className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-200 rounded-full p-2.5 transition-colors cursor-pointer shadow-sm border border-slate-200 shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                  {/* LEFT: Items + Viability */}
                  <div className="xl:col-span-2 space-y-6">

                    {/* Items Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-base font-bold text-slate-900 flex items-center">
                          <FileSignature size={20} className="mr-2 text-indigo-600" />
                          Composição do Orçamento
                        </h3>
                        <Link
                          href={`/orcamentos/${orc.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
                        >
                          <Plus size={16} className="mr-1" /> Editar Itens
                        </Link>
                      </div>

                      {orc.itens.length > 0 ? (
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-3">Item / Serviço</th>
                              <th className="px-6 py-3 text-center">Qtd</th>
                              <th className="px-6 py-3 text-right">Valor Unit.</th>
                              <th className="px-6 py-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orc.itens.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-700 font-medium">
                                  <div className="flex flex-col">
                                    <span>{item.descricao}</span>
                                    {item.categoria && (
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                                        {item.categoria}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center text-slate-600">{item.quantidade}</td>
                                <td className="px-6 py-4 text-right text-slate-600">
                                  {formatCurrency(Number(item.valorUnit))}
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                  {formatCurrency(Number(item.valorUnit) * item.quantidade)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-sm text-slate-400">
                          Nenhum item adicionado.{' '}
                          <Link href={`/orcamentos/${orc.id}`} className="text-indigo-600 hover:underline">
                            Adicionar itens
                          </Link>
                        </div>
                      )}

                      {/* Viability Analysis */}
                      {orc.itens.length > 0 && (
                        <div className="bg-slate-50/80 p-6 border-t border-slate-200">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                            <Calculator size={14} className="mr-1.5" /> Análise de Viabilidade
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">

                            {/* Left: Costs */}
                            <div className="space-y-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                              <h5 className="text-sm font-bold text-slate-800 mb-3">Resumo de Custos</h5>
                              <div className="space-y-2">
                                {orc.itens.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-slate-600 truncate mr-2">{item.descricao}</span>
                                    <span className="font-semibold text-rose-600 whitespace-nowrap">
                                      - {formatCurrency(Number(item.valorUnit) * item.quantidade)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-3 border-t border-slate-100 flex justify-between text-base">
                                <span className="font-bold text-slate-800">Total Custos</span>
                                <span className="font-bold text-rose-600">{formatCurrency(via.custoItens)}</span>
                              </div>
                            </div>

                            {/* Right: Revenue + Margin */}
                            <div className="space-y-5 md:pl-2">
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor de Venda</p>
                                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(via.valorComMargem)}</p>
                                {Number(orc.margem ?? 0) > 0 && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Total bruto {formatCurrency(Number(orc.totalBruto))} + {Number(orc.margem)}% margem
                                  </p>
                                )}
                              </div>

                              <div className="pt-2">
                                <div className="flex justify-between items-end mb-2">
                                  <span className="font-bold text-slate-700 text-sm">Margem de Lucro</span>
                                  <div className="text-right">
                                    <span className={`text-3xl font-extrabold ${margemColor} leading-none`}>
                                      {via.margemPct.toFixed(1)}%
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 mt-1 block">
                                      Lucro: {formatCurrency(via.lucro)}
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden shadow-inner">
                                  <div
                                    className="bg-rose-500 h-3 transition-all duration-500"
                                    style={{ width: `${Math.min(via.pctCustos, 100)}%` }}
                                  />
                                  <div
                                    className={`${barColor} h-3 transition-all duration-500`}
                                    style={{ width: `${Math.max(100 - via.pctCustos, 0)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 px-1">
                                  <span>Custos ({via.pctCustos.toFixed(1)}%)</span>
                                  <span>Margem ({Math.max(100 - via.pctCustos, 0).toFixed(1)}%)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Link
                        href={`/orcamentos/${orc.id}`}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <Edit2 size={18} className="mr-2 text-indigo-600" />
                        Editar Orçamento
                      </Link>
                      {(orc.status === 'RASCUNHO') && (
                        <button
                          onClick={async () => {
                            await atualizarStatusOrcamento(orc.id, 'ENVIADO')
                            setSelectedOrcamento({ ...orc, status: 'ENVIADO' })
                          }}
                          className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                        >
                          <Send size={18} className="mr-2" />
                          Marcar como Enviado
                        </button>
                      )}
                      {orc.status === 'ENVIADO' && (
                        <button
                          onClick={async () => {
                            await atualizarStatusOrcamento(orc.id, 'APROVADO')
                            setSelectedOrcamento({ ...orc, status: 'APROVADO' })
                          }}
                          className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
                        >
                          <CheckCircle size={18} className="mr-2" />
                          Marcar como Aprovado
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Info sidebar */}
                  <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center">
                        <FileText size={16} className="mr-2 text-indigo-600" />
                        Resumo
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Bruto</span>
                          <span className="font-bold text-slate-900">{formatCurrency(Number(orc.totalBruto))}</span>
                        </div>
                        {Number(orc.margem ?? 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Margem</span>
                            <span className="font-bold text-indigo-600">{Number(orc.margem)}%</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                          <span className="text-slate-500">Total com Margem</span>
                          <span className="font-bold text-lg text-indigo-700">{formatCurrency(via.valorComMargem)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Client Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center">
                        <Users size={16} className="mr-2 text-indigo-600" />
                        Cliente
                      </h3>
                      <div>
                        <p className="font-semibold text-slate-900">{orc.cliente.name}</p>
                        {orc.cliente.company && <p className="text-sm text-slate-500">{orc.cliente.company}</p>}
                      </div>
                      <Link
                        href={`/crm/${orc.cliente.id}`}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Ver no CRM <ExternalLink size={14} className="ml-1" />
                      </Link>
                    </div>

                    {/* Observações */}
                    {orc.observacoes && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2">
                        <h3 className="text-sm font-bold text-slate-900">Observações</h3>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{orc.observacoes}</p>
                      </div>
                    )}

                    {/* Danger Zone */}
                    <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-5">
                      <button
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja deletar este orçamento?')) {
                            await deletarOrcamento(orc.id)
                            setSelectedOrcamento(null)
                          }
                        }}
                        className="w-full flex items-center justify-center text-sm font-medium text-rose-600 hover:text-rose-700 py-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Deletar orçamento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Create Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border shadow-2xl bg-white border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Novo orçamento</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Cliente *</label>
                <select name="clienteId" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" required>
                  <option value="">Selecionar...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Título *</label>
                <input name="titulo" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Cobertura Casamento" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Vertical</label>
                  <input name="vertical" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Formaturas" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Válido até</label>
                  <input type="date" name="validoAte" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Margem (%)</label>
                <input type="number" step="0.01" name="margem" className="w-full px-3 py-2 rounded-xl border text-sm outline-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Ex: 30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Observações</label>
                <textarea name="observacoes" rows={2} className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
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
