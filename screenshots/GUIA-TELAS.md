# OLHARR v2 — Guia de Telas (Referência para Redesign)

Data: 2026-03-23

Use os números abaixo para referenciar as telas quando discutir mudanças de layout.

---

## Telas Principais

### 01 — Tela de Login
- **Rota:** `/login`
- **Elementos:** Logo OLHARR, campos Email/Senha, botão "Entrar" (rosa)
- **Layout:** Centralizado, fundo escuro (#1E1826)

### 02 — Dashboard
- **Rota:** `/dashboard`
- **Elementos:** Saudação com nome do usuário, 4 cards de métricas (Projetos Ativos, Clientes, Tarefas Pendentes, Receita Prevista)
- **Layout:** Sidebar à esquerda + área de conteúdo

### 03 — Orçamentos (Lista)
- **Rota:** `/orcamentos`
- **Elementos:** Título com contagem e valor aprovado, botão "+ Novo orçamento", tabela/lista de orçamentos
- **Layout:** Lista com estado vazio "Nenhum orçamento cadastrado"

### 04 — Projetos (Kanban)
- **Rota:** `/projetos`
- **Elementos:** Título, botão "+ Novo projeto", Kanban com colunas: OS/Distribuição, Pré-produção, Dia do evento, Pós-produção (scroll horizontal para mais colunas)
- **Layout:** Kanban board com scroll horizontal, cada coluna com badge de contagem colorido

### 05 — CRM (Kanban)
- **Rota:** `/crm`
- **Elementos:** Título "Pipeline de clientes e leads", botão "+ Novo cliente", Kanban com colunas: Novo Lead, Primeiro Contato, Proposta Enviada, Negociação, Fechado G... (scroll)
- **Layout:** Kanban board similar a Projetos, cards de clientes com avatar/iniciais

### 06 — Tarefas (Kanban)
- **Rota:** `/tarefas`
- **Elementos:** Título com contagem de tarefas ativas, botão "+ Nova tarefa", 3 colunas: Pendente, Em andamento, Concluída
- **Layout:** Kanban com 3 colunas, badges coloridos por status

### 07 — Fluxo de Caixa
- **Rota:** `/fluxo-caixa`
- **Elementos:** 3 cards (Total entradas verde, Total saídas vermelho, Saldo acumulado), gráfico de barras Entradas vs Saídas (últimos 6 meses), tabela mensal com colunas Mês/Entradas/Saídas/Saldo
- **Layout:** Cards de resumo no topo, gráfico ao meio, tabela detalhada embaixo

### 08 — Financeiro
- **Rota:** `/financeiro`
- **Elementos:** 3 cards (Entradas, Saídas, Saldo do mês), botão "+ Nova transação", seção "Transações do mês" com lista
- **Layout:** Similar ao Dashboard com cards + lista de transações

### 09 — Pagamentos Freelancer (Kanban)
- **Rota:** `/financeiro/pagamentos-freela`
- **Elementos:** Título "Kanban de pagamentos", botão "+ Novo pagamento", colunas: Contratação, Aguardando Evento, Lançamento DRE, Pago (scroll para Arquivado)
- **Layout:** Kanban com 5 fases, scroll horizontal

### 10 — Banco de Talentos (Grid)
- **Rota:** `/talentos`
- **Elementos:** Título com contagem, campo de busca "Buscar por nome ou especialidade...", botão "+ Novo freelancer", grid de cards
- **Layout:** Busca no topo + grid responsivo de cards

### 11 — Fornecedores (Lista)
- **Rota:** `/fornecedores`
- **Elementos:** Título com contagem, botão "+ Novo fornecedor", lista de fornecedores
- **Layout:** Lista simples com estado vazio

### 12 — Agenda (Lista filtrada)
- **Rota:** `/agenda`
- **Elementos:** Título com contagem de eventos, botão "+ Novo evento", filtros por tipo (Todos, Evento, Reunião, Entrega, Prazo, Outro), lista de eventos
- **Layout:** Filtros de tipo no topo + lista, botões de filtro estilo pills

### 13 — Calendário Social (Kanban)
- **Rota:** `/calendario`
- **Elementos:** Título "Pipeline de conteúdo", botão "+ Novo post", colunas: Rascunho, Aguardando Aprovação, Aprovado, Publicado
- **Layout:** Kanban com 4 colunas para pipeline de conteúdo

### 14 — Formaturas (Lista de turmas)
- **Rota:** `/formaturas`
- **Elementos:** Título com contagem de turmas, botão "+ Nova turma", cards de turma (nome, instituição, status, nº formandos, data)
- **Layout:** Grid de cards com badge de status (Ativa/Concluída/Cancelada)

### 15 — Configurações
- **Rota:** `/configuracoes`
- **Elementos:** Tabs Perfil/Equipe, dados do usuário logado (avatar, nome, email, perfil de acesso), formulário de edição
- **Layout:** Tabs no topo + formulário de perfil

---

## Modais / Janelas Flutuantes (não capturados ainda)

| # | Modal | Acessado de | Botão de trigger |
|---|-------|------------|-----------------|
| M1 | Form de Cliente | Tela 05 (CRM) | "+ Novo cliente" |
| M2 | Form de Projeto | Tela 04 (Projetos) | "+ Novo projeto" |
| M3 | Form de Freelancer | Tela 10 (Talentos) | "+ Novo freelancer" |
| M4 | Form de Formando | Tela 14 detalhe | "Adicionar formando" |
| M5 | Form de Item Orçamento | Tela 03 detalhe | "Adicionar item" |
| M6 | Form de Tarefa | Tela 06 (Tarefas) | "+ Nova tarefa" |
| M7 | Form de Fornecedor | Tela 11 (Fornecedores) | "+ Novo fornecedor" |
| M8 | Form de Transação | Tela 08 (Financeiro) | "+ Nova transação" |
| M9 | Form de Post | Tela 13 (Calendário) | "+ Novo post" |
| M10 | Form de Evento | Tela 12 (Agenda) | "+ Novo evento" |
| M11 | Form de Turma | Tela 14 (Formaturas) | "+ Nova turma" |
| M12 | Form de Orçamento | Tela 03 (Orçamentos) | "+ Novo orçamento" |
| M13 | Form de Pagamento | Tela 09 (Pag. Freela) | "+ Novo pagamento" |
| M14 | Form de Membro | Tela 15 (Config > Equipe) | "Adicionar membro" |

---

## Como usar este guia

Para solicitar mudanças, referencie o número da tela:
- "Na **Tela 02** (Dashboard), quero adicionar um gráfico de receita mensal"
- "Na **Tela 05** (CRM), quero mudar as cores das colunas do Kanban"
- "No **Modal M1** (Form de Cliente), quero adicionar campo de CNPJ"

## Padrões visuais atuais

- **Sidebar:** Fixa à esquerda, fundo #252035, itens com ícone + texto, item ativo com fundo rosa (#B52774)
- **Botões de ação:** Rosa (#B52774), canto superior direito, formato "+ Ação"
- **Cards de métricas:** Fundo #252035, borda #3A3550, valores grandes
- **Kanban boards:** Colunas com header colorido (cinza, amarelo, laranja, rosa, azul, verde), scroll horizontal
- **Estados vazios:** Texto muted centralizado ("Nenhum X aqui")
- **Cores de status:** Verde = sucesso/ativo, Amarelo = aviso/pendente, Vermelho = perda/saída, Rosa = primário
