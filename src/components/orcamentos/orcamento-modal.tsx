'use client'

import {
  X,
  Send,
  CheckCircle,
  FileSignature,
  CalendarDays,
  Users,
  ExternalLink,
  Edit2,
  Trash2,
  FileText,
  Plus,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { atualizarStatusOrcamento, deletarOrcamento } from '@/modules/orcamentos/actions'
import type { OrcamentoStatus } from '@/generated/prisma/client'
import Link from 'next/link'
import type { Orcamento } from './orcamentos-types'
import { OrcamentoViabilidade, calcViabilidade } from './orcamento-viabilidade'

interface OrcamentoModalProps {
  orcamento: Orcamento
  onClose: () => void
  onUpdate: (orc: Orcamento) => void
}

function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

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

export function OrcamentoModal({ orcamento: orc, onClose, onUpdate }: OrcamentoModalProps) {
  const via = calcViabilidade(orc)

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
            <select
              value={orc.status}
              onChange={async (e) => {
                const newStatus = e.target.value as OrcamentoStatus
                await atualizarStatusOrcamento(orc.id, newStatus)
                onUpdate({ ...orc, status: newStatus })
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
              onClick={onClose}
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

                <OrcamentoViabilidade orcamento={orc} />
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
                {orc.status === 'RASCUNHO' && (
                  <button
                    onClick={async () => {
                      await atualizarStatusOrcamento(orc.id, 'ENVIADO')
                      onUpdate({ ...orc, status: 'ENVIADO' })
                    }}
                    className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 cursor-pointer"
                  >
                    <Send size={18} className="mr-2" />
                    Marcar como Enviado
                  </button>
                )}
                {orc.status === 'ENVIADO' && (
                  <button
                    onClick={async () => {
                      await atualizarStatusOrcamento(orc.id, 'APROVADO')
                      onUpdate({ ...orc, status: 'APROVADO' })
                    }}
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 cursor-pointer"
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
                      onClose()
                    }
                  }}
                  className="w-full flex items-center justify-center text-sm font-medium text-rose-600 hover:text-rose-700 py-2 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
}
