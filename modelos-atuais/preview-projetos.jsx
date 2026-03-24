import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Camera,
  DollarSign,
  Calendar,
  CheckSquare,
  Settings,
  Bell,
  Search,
  GraduationCap,
  FileText,
  Truck,
  CalendarDays,
  Star,
  Plus,
  Filter,
  MoreHorizontal,
  X,
  Clock,
  Send,
  CheckCircle,
  Video,
  MonitorPlay,
  HardDrive,
  Cloud,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  Briefcase,
  AlertCircle,
  Paperclip,
  MessageSquare,
  AlignLeft,
  User,
  FileSpreadsheet,
  ArrowRight,
  MoreVertical,
  Info,
  Check,
  Sparkles
} from 'lucide-react';
// Mock Data focado no estilo Pipefy
const hoje = new Date();
const dataDiasAtras = (dias) => new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000);
const dataDiasAFrente = (dias) => new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);
const mockProjetos = [
  {
    id: 'COMED-168',
    nome: 'Evento Tema Anos 2000',
    tipo: 'Eventos Corporativos',
    cliente: {
      nome: 'COMED 168',
      email: 'rafa@comed168.com.br',
      telefone: '+55 31 99999-7788',
      criadoEm: '03 de Março de 2026'
    },
    dataEvento: '27/03',
    horario: '22h às 04h',
    local: 'Cine Teatro Brasil - Av. Amazonas, 315',
    briefing: 'C1 Mobile\nC1 Editor de fotos real time\nC2 Fotógrafos\nC2 Cinegrafistas\nC1 Assistente Geral\n\nEntregas:\nÁlbum de fotos\nStories com entrevistas\nC1 Aftermovie de até 1:30 - formato a definir',
    valorProducao: 16000.00,
    status: 'distribuicao',
    tempoNaFase: '22h',
    concluidoSla: true,
    tarefas: [
      { desc: 'Fazer reunião de kick off com equipe comercial', concluida: true },
      { desc: 'Atendimento entrar em contato com o cliente e se apresentar', concluida: false },
      { desc: 'Marcar reunião de briefing com o cliente', concluida: false }
    ]
  },
  {
    id: 'ADV-092',
    nome: 'Escritório Pinto & Soares Advogados',
    tipo: 'Eventos Corporativos',
    cliente: {
      nome: 'Pinto & Soares Adv',
      email: 'contato@psadv.com.br',
      telefone: '+55 31 98888-1122',
      criadoEm: '15 de Março de 2026'
    },
    dataEvento: '10/04',
    horario: '19h às 23h',
    local: 'Sede do Escritório',
    briefing: 'Cobertura fotográfica do coquetel de inauguração da nova ala.\nC2 Fotógrafos\nEntrega expressa de 20 fotos no dia seguinte.',
    valorProducao: 4500.00,
    status: 'producao',
    tempoNaFase: '2 dias',
    concluidoSla: true,
    tarefas: [
      { desc: 'Confirmar equipamentos e baterias', concluida: true },
      { desc: 'Cobertura do evento', concluida: false },
      { desc: 'Backup dos arquivos', concluida: false }
    ]
  },
  {
    id: 'CAS-405',
    nome: 'Casamento Mariana & Pedro',
    tipo: 'Casamentos',
    cliente: {
      nome: 'Mariana Silva',
      email: 'mariana@email.com',
      telefone: '+55 31 97777-3344',
      criadoEm: '10 de Janeiro de 2026'
    },
    dataEvento: '12/09',
    horario: '16h às 02h',
    local: 'Fazenda Vila Rica',
    briefing: 'Cobertura completa.\nC2 Fotógrafos\nC2 Cinegrafistas\nDrone',
    valorProducao: 12500.00,
    status: 'fila_edicao',
    tempoNaFase: '5 dias',
    concluidoSla: false,
    tarefas: [
      { desc: 'Descarregar cartões no NAS', concluida: true },
      { desc: 'Sincronizar áudio da cerimônia', concluida: false },
      { desc: 'Criar proxies de vídeo', concluida: false }
    ]
  },
  {
    id: 'FOT-88',
    nome: 'Ensaio Gestante Clara',
    tipo: 'Ensaios',
    cliente: {
      nome: 'Clara Martins',
      email: 'clara@email.com',
      telefone: '+55 31 96666-5555',
      criadoEm: '20 de Março de 2026'
    },
    dataEvento: 'A definir',
    horario: '15h',
    local: 'Jardim Botânico',
    briefing: 'Sessão externa (2h).\nEntrega de 30 fotos editadas em alta resolução.',
    valorProducao: 1200.00,
    status: 'aprovacao',
    tempoNaFase: '1 dia',
    concluidoSla: true,
    tarefas: [
      { desc: 'Exportar galeria do Lightroom', concluida: true },
      { desc: 'Revisão do diretor de arte (Olharr)', concluida: false },
      { desc: 'Upload para o Pic-Time', concluida: false }
    ]
  }
];
// Fases exatas do print
const colunasKanban = [
  { id: 'distribuicao', titulo: 'OS - DISTRIBUIÇÃO', color: 'border-yellow-400', textColor: 'text-yellow-600' },
  { id: 'producao', titulo: 'PRODUÇÃO', color: 'border-blue-500', textColor: 'text-blue-600' },
  { id: 'fila_edicao', titulo: 'FILA PARA EDIÇÃO', color: 'border-emerald-500', textColor: 'text-emerald-600' },
  { id: 'edicao', titulo: 'EDIÇÃO', color: 'border-emerald-400', textColor: 'text-emerald-500' },
  { id: 'aprovacao', titulo: 'APROVAÇÃO OLHARR', color: 'border-rose-500', textColor: 'text-rose-600' },
  { id: 'entrega', titulo: 'ENTREGA CLIENTE', color: 'border-orange-400', textColor: 'text-orange-500' },
  { id: 'alteracoes', titulo: 'ALTERAÇÕES CLIENTE', color: 'border-teal-400', textColor: 'text-teal-500' },
  { id: 'finalizado', titulo: 'APROVADO/FINALIZADO', color: 'border-slate-400', textColor: 'text-slate-500' },
];
export default function App() {
  const [activeMenu, setActiveMenu] = useState('Projetos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjeto, setSelectedProjeto] = useState(null);
  const [filtroVertente, setFiltroVertente] = useState('Todas');
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'CRM', icon: Users },
    { name: 'Projetos', icon: Camera },
    { name: 'Formaturas', icon: GraduationCap },
    { name: 'Orçamentos', icon: FileText },
    { name: 'Financeiro', icon: DollarSign },
  ];
  const toggleTarefa = (projetoId, tarefaIndex) => {
    if (selectedProjeto && selectedProjeto.id === projetoId) {
      const novasTarefas = [...selectedProjeto.tarefas];
      novasTarefas[tarefaIndex].concluida = !novasTarefas[tarefaIndex].concluida;
      setSelectedProjeto({ ...selectedProjeto, tarefas: novasTarefas });
    }
  };
  const getBorderColor = (tipo) => {
    switch(tipo) {
      case 'Casamentos': return 'border-l-rose-500';
      case 'Formaturas': return 'border-l-indigo-500';
      case 'Ensaios': return 'border-l-teal-500';
      case 'Eventos Corporativos': return 'border-l-cyan-500';
      default: return 'border-l-slate-400';
    }
  };
  const getBadgeStyle = (tipo) => {
    switch(tipo) {
      case 'Casamentos': return 'bg-rose-50 text-rose-600';
      case 'Formaturas': return 'bg-indigo-50 text-indigo-600';
      case 'Ensaios': return 'bg-teal-50 text-teal-600';
      case 'Eventos Corporativos': return 'bg-cyan-50 text-cyan-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };
  const getSlaStyle = (sla) => {
    switch(sla) {
      case 'No Prazo': return 'bg-emerald-50 text-emerald-600';
      case 'Atenção': return 'bg-amber-50 text-amber-600';
      case 'Atrasado': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };
  // Lógica de Filtragem
  const projetosFiltrados = useMemo(() => {
    return mockProjetos.filter(proj => {
      if (searchTerm && !proj.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filtroVertente !== 'Todas' && proj.tipo !== filtroVertente) return false;
      return true;
    });
  }, [searchTerm, filtroVertente]);
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex font-sans text-slate-800 relative overflow-hidden">

      {/* Sidebar Compacta estilo Pipefy */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 z-20 shrink-0">
        <div className="mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded text-white flex items-center justify-center font-bold text-lg">
            o
          </div>
        </div>
        <nav className="flex-1 space-y-4 w-full">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`w-full flex justify-center py-2 relative group cursor-pointer ${activeMenu === item.name ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title={item.name}
            >
              {activeMenu === item.name && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-md"></div>
              )}
              <item.icon size={20} />
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-[#f4f5f7]">

        {/* Header Topo */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Briefcase className="text-indigo-600" size={20} />
            <span className="text-base font-bold text-slate-800">GESTÃO DE PROJETOS/EVENTOS</span>
            <Info size={14} className="text-slate-400 cursor-pointer" />
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Procurar cards"
                className="pl-8 pr-4 py-1.5 bg-slate-100 border-transparent rounded text-sm focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition-all outline-none w-56"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="text-slate-500 hover:text-slate-700 cursor-pointer"><Filter size={16}/></button>
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-xs shrink-0 cursor-pointer">
              RM
            </div>
          </div>
        </header>
        {/* Board Tabs (Kanban, Lista, Relatórios) */}
        <div className="bg-white border-b border-slate-200 px-6 flex items-center shrink-0 z-10">
          <button className="px-4 py-3 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 cursor-pointer">Kanban</button>
          <button className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Lista</button>
          <button className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Relatórios</button>
          <button className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Formulário</button>
        </div>
        {/* Toolbar do Pipe */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer outline-none"
              value={filtroVertente}
              onChange={(e) => setFiltroVertente(e.target.value)}
            >
              <option value="Todas">Todas as Vertentes</option>
              <option value="Casamentos">Casamentos</option>
              <option value="Formaturas">Formaturas</option>
              <option value="Eventos Corporativos">Corporativo</option>
              <option value="Ensaios">Ensaios</option>
            </select>
            <button className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center transition-colors cursor-pointer">
              <Filter size={14} className="mr-2" />
              Filtrar
            </button>
          </div>

          <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded shadow-sm transition-colors flex items-center cursor-pointer">
            <Plus size={16} className="mr-1.5" />
            Novo Card
          </button>
        </div>
        {/* Board Horizontal (Estilo Pipefy) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex items-start">
          {colunasKanban.map(coluna => {
            const projetosColuna = projetosFiltrados.filter(p => p.status === coluna.id);

            return (
              <div key={coluna.id} className="flex flex-col w-[300px] max-h-full shrink-0 mr-4">

                {/* Header da Coluna com linha superior */}
                <div className={`border-t-4 ${coluna.color} bg-slate-50/50 px-3 py-2.5 flex justify-between items-center rounded-t-sm`}>
                  <div className="flex items-center gap-2 truncate">
                    <CheckSquare size={14} className={coluna.textColor} />
                    <h3 className={`font-bold text-[11px] uppercase tracking-wide truncate ${coluna.textColor}`}>
                      {coluna.titulo}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 ml-1">{projetosColuna.length}</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 cursor-pointer"><Plus size={14}/></button>
                </div>

                {/* Cartões da Coluna */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-2 space-y-2 pb-12 scrollbar-thin scrollbar-thumb-slate-300">
                  {projetosColuna.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-slate-400 font-medium italic mt-4 px-4 text-center">
                        Nenhum card nesta fase
                      </p>
                    </div>
                  )}
                  {projetosColuna.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProjeto(proj)}
                      className={`bg-white rounded border border-slate-200 p-3.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-colors group relative border-l-4 ${getBorderColor(proj.tipo)}`}
                    >
                      {/* Tag do Tipo */}
                      <span className="inline-block px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase tracking-wider mb-2">
                        {proj.tipo}
                      </span>

                      {/* Título */}
                      <h4 className="font-bold text-slate-800 text-[13px] leading-snug mb-3">
                        {proj.id} - {proj.nome}
                      </h4>

                      {/* Lista de Campos Estilo Pipefy */}
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                          <FileSpreadsheet size={12} className="text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase leading-none mb-0.5">Nº do Orçamento - Nome do Evento</p>
                            <p className="text-[11px] text-slate-600 leading-tight">{proj.id} - {proj.nome}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <User size={12} className="text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase leading-none mb-0.5">Cliente</p>
                            <p className="text-[11px] text-slate-600">{proj.cliente.nome}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <DollarSign size={12} className="text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase leading-none mb-0.5">Valor de Produção</p>
                            <p className="text-[11px] text-slate-600">R$ {proj.valorProducao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                          </div>
                        </div>
                      </div>
                      {/* Footer do Card */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          {proj.concluidoSla ? (
                            <div className="flex items-center text-emerald-500">
                              <CheckCircle2 size={12} className="mr-1" />
                              <span>{proj.tempoNaFase}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              <span>{proj.tempoNaFase}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <MessageSquare size={12} className="mr-1" />
                            <span>1</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Botão + Nova Tarefa no final da coluna se tiver itens */}
                  {projetosColuna.length > 0 && (
                     <button className="w-full mt-2 py-1.5 flex items-center justify-center text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm cursor-pointer">
                       <Plus size={14} className="mr-1.5" /> Nova tarefa
                     </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      {/* MODAL CENTRAL ESTILO PIPEFY */}
      {selectedProjeto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 sm:p-8 transition-all">

          <div className="relative w-full max-w-[1200px] h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header do Modal */}
            <div className="px-8 py-5 border-b border-slate-200 shrink-0 bg-white z-10">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-slate-900 pr-8">{selectedProjeto.id} - {selectedProjeto.nome}</h2>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors cursor-pointer"><MoreVertical size={20}/></button>
                  <button onClick={() => setSelectedProjeto(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors cursor-pointer"><X size={20}/></button>
                </div>
              </div>

              {/* Botões de Ação Rapida */}
              <div className="flex gap-4 mb-4 text-sm font-medium text-slate-600">
                <button className="flex items-center hover:text-indigo-600 cursor-pointer"><User size={14} className="mr-1.5"/> Adic. a um responsável</button>
                <button className="flex items-center hover:text-indigo-600 cursor-pointer"><CalendarDays size={14} className="mr-1.5"/> Vencimento</button>
                <button className="flex items-center hover:text-indigo-600 cursor-pointer"><Star size={14} className="mr-1.5"/> Adicionar etiquetas</button>
              </div>
              {/* Tabs */}
              <div className="flex gap-6 border-b border-slate-200 -mx-8 px-8 overflow-x-auto">
                <button className="pb-3 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 flex items-center whitespace-nowrap cursor-pointer">
                  <span className={`w-2 h-2 rounded-full mr-2 ${colunasKanban.find(c => c.id === selectedProjeto.status)?.color.replace('border-', 'bg-')}`}></span>
                  {colunasKanban.find(c => c.id === selectedProjeto.status)?.titulo}
                </button>
                <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Atividades</button>
                <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Anexos</button>
                <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap cursor-pointer">Checklists <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">{selectedProjeto.tarefas.length}</span></button>
                <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Comentários</button>
                <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">Email</button>
                <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">PDF</button>
              </div>
            </div>
            {/* Grid 3 Colunas (Corpo) */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-white relative">

              {/* 1. Formulário Inicial (Esquerda) */}
              <div className="w-full md:w-5/12 p-8 border-r border-slate-200 bg-white">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Formulário Inicial</h3>
                    <p className="text-xs text-slate-500 mt-1">Criado por Rafael M. • há {selectedProjeto.tempoNaFase}</p>
                  </div>
                  <Info size={18} className="text-slate-400 cursor-pointer" />
                </div>
                <div className="space-y-6">
                  {/* Campo de Texto Simples */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 mr-1">*</span> Nº do orçamento - Nome do Evento
                    </p>
                    <p className="text-sm text-slate-800 bg-slate-50/50 p-2 rounded border border-transparent hover:border-slate-300 transition-colors">{selectedProjeto.id} - {selectedProjeto.nome}</p>
                  </div>
                  {/* Card de Base de Dados (Cliente) */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 mr-1">*</span> Cliente
                    </p>
                    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm relative group cursor-pointer hover:border-indigo-300 transition-colors">
                      <button className="absolute top-3 right-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                      <h4 className="font-bold text-slate-800 mb-4">{selectedProjeto.cliente.nome}</h4>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-slate-500 mb-1">Database</p>
                          <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-medium">
                            <Users size={10} className="mr-1" /> CLIENTES
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Contato</p>
                          <p className="font-medium text-slate-800">Rafa</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">E-mail do contato</p>
                          <p className="font-medium text-slate-800">{selectedProjeto.cliente.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Telefone do contato</p>
                          <p className="font-medium text-slate-800">{selectedProjeto.cliente.telefone}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-slate-400 text-[10px]">Criado em<br/>{selectedProjeto.cliente.criadoEm}</p>
                      </div>
                    </div>
                  </div>
                  {/* Campo Briefing (Long Text) */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 mr-1">*</span> Briefing
                    </p>
                    <div className="text-sm text-slate-800 bg-slate-50/50 p-3 rounded border border-slate-100 whitespace-pre-wrap leading-relaxed hover:border-slate-300 transition-colors">
                      <strong>Evento da turma {selectedProjeto.cliente.nome}</strong><br/>
                      Data: {selectedProjeto.dataEvento}<br/>
                      Horário: {selectedProjeto.horario}<br/>
                      Local: {selectedProjeto.local}<br/><br/>
                      Equipe vendida:<br/>
                      {selectedProjeto.briefing}
                    </div>
                  </div>
                  {/* Valor Produção */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 mr-1">*</span> Valor de Produção
                    </p>
                    <p className="text-sm font-medium text-slate-800 bg-slate-50/50 p-2 rounded border border-transparent hover:border-slate-300 transition-colors">
                      R$ {selectedProjeto.valorProducao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
              {/* 2. Fase Atual / Checklist (Meio) */}
              <div className="w-full md:w-4/12 p-8 border-r border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    Fase atual <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colunasKanban.find(c => c.id === selectedProjeto.status)?.color} ${colunasKanban.find(c => c.id === selectedProjeto.status)?.textColor}`}>{colunasKanban.find(c => c.id === selectedProjeto.status)?.titulo}</span>
                  </h3>
                  <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center cursor-pointer">
                    <LinkIcon size={12} className="mr-1"/> Compartilhar
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tarefas nesta fase</p>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                         <input type="checkbox" className="peer sr-only" />
                         <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                           <Check size={12} className="text-white" />
                         </div>
                      </div>
                      <span className="text-sm font-medium text-slate-500 line-through">Marcar todas</span>
                    </label>
                    {selectedProjeto.tarefas.map((tarefa, idx) => (
                      <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                           <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={tarefa.concluida}
                              onChange={() => toggleTarefa(selectedProjeto.id, idx)}
                           />
                           <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${tarefa.concluida ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 peer-hover:border-blue-400'}`}>
                             {tarefa.concluida && <Check size={12} className="text-white" />}
                           </div>
                        </div>
                        <span className={`text-sm ${tarefa.concluida ? 'text-slate-500 font-medium line-through' : 'text-slate-800 font-medium'}`}>
                          {tarefa.desc.toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {/* 3. Ações / Mover Card (Direita) */}
              <div className="w-full md:w-3/12 p-8 bg-slate-50/30 relative">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Mover card para fase</h3>

                <div className="space-y-3 mb-8">
                  {/* Simulação dos botões de mudança de fase */}
                  <button className="w-full py-2.5 px-4 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-bold shadow-sm hover:bg-blue-50 flex justify-between items-center transition-colors cursor-pointer">
                    PRODUÇÃO <ArrowRight size={14} />
                  </button>
                  <button className="w-full py-2.5 px-4 bg-white border border-rose-200 text-rose-600 rounded-full text-xs font-bold shadow-sm hover:bg-rose-50 flex justify-between items-center transition-colors cursor-pointer">
                    APROVAÇÃO OLHARR <ArrowRight size={14} />
                  </button>
                </div>
                <div className="space-y-4">
                  <button className="w-full text-left text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center cursor-pointer">
                    <Settings size={14} className="mr-2"/> Configurar mover cards
                  </button>
                  <button className="w-full text-left text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center cursor-pointer">
                    <Sparkles size={14} className="mr-2"/> Mover cards com IA
                  </button>
                </div>
                {/* Botão AI flutuante (estilo print) */}
                <div className="absolute bottom-8 right-8">
                  <button className="w-12 h-12 bg-purple-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer">
                    <Sparkles size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}