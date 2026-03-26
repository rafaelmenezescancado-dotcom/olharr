-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRODUTOR', 'FINANCEIRO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('OS_DISTRIBUICAO', 'PRE_PRODUCAO', 'DIA_DO_EVENTO', 'POS_PRODUCAO', 'EDICAO', 'REVISAO', 'ENTREGUE', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "CrmStage" AS ENUM ('NOVO_LEAD', 'PRIMEIRO_CONTATO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'FECHADO_GANHO', 'FECHADO_PERDIDO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "ParcelaStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FasePagamentoFreelancer" AS ENUM ('CONTRATACAO', 'AGUARDANDO_EVENTO', 'LANCAMENTO_DRE', 'PAGO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TurmaStatus" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "OrcamentoStatus" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "Vertente" AS ENUM ('CASAMENTO', 'EVENTO', 'CORPORATIVO', 'QUINZE_ANOS', 'ENSAIO', 'PUBLICITARIO');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('HORA', 'OPCAO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PRODUTOR',
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "instagram" TEXT,
    "document" TEXT,
    "stage" "CrmStage" NOT NULL DEFAULT 'NOVO_LEAD',
    "retemISS" BOOLEAN NOT NULL DEFAULT false,
    "possuiRegraPagamento" BOOLEAN NOT NULL DEFAULT false,
    "comoChegou" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_contatos_operacionais" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cargo" TEXT,
    "whatsapp" TEXT,

    CONSTRAINT "cliente_contatos_operacionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_contatos_financeiros" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cargo" TEXT,
    "whatsapp" TEXT,

    CONSTRAINT "cliente_contatos_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_followups" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL,
    "resposta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_interacoes" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_interacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "stage" "ProjectStage" NOT NULL DEFAULT 'OS_DISTRIBUICAO',
    "vertical" TEXT,
    "dataEvento" TIMESTAMP(3),
    "dataEntrega" TIMESTAMP(3),
    "revenueExpected" DECIMAL(10,2),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_costs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#1E7FCD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_labels" (
    "projetoId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "projeto_labels_pkey" PRIMARY KEY ("projetoId","labelId")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "projectId" TEXT,
    "responsavelId" TEXT,
    "orcamentoId" TEXT,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "dataVencimento" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "banco" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'CORRENTE',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "tipo" "TransactionType" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelancers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "pixKey" TEXT,
    "pixType" TEXT,
    "hasCar" BOOLEAN NOT NULL DEFAULT false,
    "specialties" TEXT[],
    "instagram" TEXT,
    "portfolio" TEXT,
    "dailyRate" DECIMAL(10,2),
    "observacoes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelancers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_freelancers" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "projectId" TEXT,
    "escopo" TEXT NOT NULL,
    "valorCombinado" DECIMAL(10,2) NOT NULL,
    "combinadoNF" BOOLEAN NOT NULL DEFAULT false,
    "dataProjeto" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "fase" "FasePagamentoFreelancer" NOT NULL DEFAULT 'CONTRATACAO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_freelancers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "valorHora" DECIMAL(10,2),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos_base" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoServico" NOT NULL,
    "icone" TEXT,
    "cor" TEXT,
    "area" TEXT NOT NULL,
    "custoPorHora" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes_servico" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "custo" DECIMAL(10,2) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "opcoes_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multiplicadores_evento" (
    "id" TEXT NOT NULL,
    "vertente" "Vertente" NOT NULL,
    "tipo" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" DECIMAL(5,3) NOT NULL,

    CONSTRAINT "multiplicadores_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" "OrcamentoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "vertente" "Vertente",
    "vertical" TEXT,
    "validoAte" TIMESTAMP(3),
    "totalBruto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "margem" DECIMAL(5,2),
    "margemPct" DECIMAL(5,2),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_itens" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valorUnit" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,

    CONSTRAINT "orcamento_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_custo_orcamento" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "servicoId" TEXT,
    "opcaoId" TEXT,
    "descricao" TEXT NOT NULL,
    "horas" INTEGER,
    "custoTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_custo_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_versoes" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "snapshot" JSONB NOT NULL,
    "totalBruto" DECIMAL(10,2) NOT NULL,
    "margem" DECIMAL(5,2),
    "observacoes" TEXT,
    "criadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orcamento_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_events" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'EVENTO',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "googleEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "legenda" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'FEED',
    "status" "PostStatus" NOT NULL DEFAULT 'RASCUNHO',
    "dataPublicacao" TIMESTAMP(3),
    "aprovadorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_formaturas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "status" "TurmaStatus" NOT NULL DEFAULT 'ATIVA',
    "dataEvento" TIMESTAMP(3),
    "valorTotal" DECIMAL(10,2),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_formaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formandos" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formandos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas_formandos" (
    "id" TEXT NOT NULL,
    "formandoId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "ParcelaStatus" NOT NULL DEFAULT 'PENDENTE',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcelas_formandos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_turma" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custos_eventos_turma" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custos_eventos_turma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_authId_key" ON "users"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "users"("active");

-- CreateIndex
CREATE INDEX "clients_stage_idx" ON "clients"("stage");

-- CreateIndex
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_contatos_operacionais_clienteId_key" ON "cliente_contatos_operacionais"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_contatos_financeiros_clienteId_key" ON "cliente_contatos_financeiros"("clienteId");

-- CreateIndex
CREATE INDEX "crm_followups_clienteId_idx" ON "crm_followups"("clienteId");

-- CreateIndex
CREATE INDEX "crm_followups_dataEnvio_idx" ON "crm_followups"("dataEnvio");

-- CreateIndex
CREATE INDEX "crm_interacoes_clienteId_idx" ON "crm_interacoes"("clienteId");

-- CreateIndex
CREATE INDEX "crm_interacoes_createdAt_idx" ON "crm_interacoes"("createdAt");

-- CreateIndex
CREATE INDEX "projects_clienteId_idx" ON "projects"("clienteId");

-- CreateIndex
CREATE INDEX "projects_responsavelId_idx" ON "projects"("responsavelId");

-- CreateIndex
CREATE INDEX "projects_stage_idx" ON "projects"("stage");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "projects_dataEvento_idx" ON "projects"("dataEvento");

-- CreateIndex
CREATE INDEX "project_costs_projectId_idx" ON "project_costs"("projectId");

-- CreateIndex
CREATE INDEX "tarefas_projectId_idx" ON "tarefas"("projectId");

-- CreateIndex
CREATE INDEX "tarefas_responsavelId_idx" ON "tarefas"("responsavelId");

-- CreateIndex
CREATE INDEX "tarefas_orcamentoId_idx" ON "tarefas"("orcamentoId");

-- CreateIndex
CREATE INDEX "tarefas_status_idx" ON "tarefas"("status");

-- CreateIndex
CREATE INDEX "tarefas_prioridade_idx" ON "tarefas"("prioridade");

-- CreateIndex
CREATE INDEX "tarefas_dataVencimento_idx" ON "tarefas"("dataVencimento");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_externalId_key" ON "transactions"("externalId");

-- CreateIndex
CREATE INDEX "transactions_contaId_idx" ON "transactions"("contaId");

-- CreateIndex
CREATE INDEX "transactions_tipo_idx" ON "transactions"("tipo");

-- CreateIndex
CREATE INDEX "transactions_data_idx" ON "transactions"("data");

-- CreateIndex
CREATE INDEX "transactions_categoria_idx" ON "transactions"("categoria");

-- CreateIndex
CREATE INDEX "freelancers_active_idx" ON "freelancers"("active");

-- CreateIndex
CREATE INDEX "freelancers_name_idx" ON "freelancers"("name");

-- CreateIndex
CREATE INDEX "pagamentos_freelancers_freelancerId_idx" ON "pagamentos_freelancers"("freelancerId");

-- CreateIndex
CREATE INDEX "pagamentos_freelancers_projectId_idx" ON "pagamentos_freelancers"("projectId");

-- CreateIndex
CREATE INDEX "pagamentos_freelancers_fase_idx" ON "pagamentos_freelancers"("fase");

-- CreateIndex
CREATE INDEX "servicos_base_tipo_idx" ON "servicos_base"("tipo");

-- CreateIndex
CREATE INDEX "servicos_base_area_idx" ON "servicos_base"("area");

-- CreateIndex
CREATE INDEX "servicos_base_ativo_idx" ON "servicos_base"("ativo");

-- CreateIndex
CREATE INDEX "opcoes_servico_servicoId_idx" ON "opcoes_servico"("servicoId");

-- CreateIndex
CREATE INDEX "opcoes_servico_ativo_idx" ON "opcoes_servico"("ativo");

-- CreateIndex
CREATE INDEX "multiplicadores_evento_vertente_idx" ON "multiplicadores_evento"("vertente");

-- CreateIndex
CREATE UNIQUE INDEX "multiplicadores_evento_vertente_tipo_chave_key" ON "multiplicadores_evento"("vertente", "tipo", "chave");

-- CreateIndex
CREATE INDEX "orcamentos_clienteId_idx" ON "orcamentos"("clienteId");

-- CreateIndex
CREATE INDEX "orcamentos_status_idx" ON "orcamentos"("status");

-- CreateIndex
CREATE INDEX "orcamentos_vertente_idx" ON "orcamentos"("vertente");

-- CreateIndex
CREATE INDEX "orcamentos_createdAt_idx" ON "orcamentos"("createdAt");

-- CreateIndex
CREATE INDEX "orcamento_itens_orcamentoId_idx" ON "orcamento_itens"("orcamentoId");

-- CreateIndex
CREATE INDEX "itens_custo_orcamento_orcamentoId_idx" ON "itens_custo_orcamento"("orcamentoId");

-- CreateIndex
CREATE INDEX "itens_custo_orcamento_servicoId_idx" ON "itens_custo_orcamento"("servicoId");

-- CreateIndex
CREATE INDEX "itens_custo_orcamento_opcaoId_idx" ON "itens_custo_orcamento"("opcaoId");

-- CreateIndex
CREATE INDEX "orcamento_versoes_orcamentoId_idx" ON "orcamento_versoes"("orcamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "orcamento_versoes_orcamentoId_versao_key" ON "orcamento_versoes"("orcamentoId", "versao");

-- CreateIndex
CREATE INDEX "agenda_events_projectId_idx" ON "agenda_events"("projectId");

-- CreateIndex
CREATE INDEX "agenda_events_inicio_idx" ON "agenda_events"("inicio");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_dataPublicacao_idx" ON "posts"("dataPublicacao");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_lida_idx" ON "notifications"("lida");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "turmas_formaturas_clienteId_idx" ON "turmas_formaturas"("clienteId");

-- CreateIndex
CREATE INDEX "turmas_formaturas_status_idx" ON "turmas_formaturas"("status");

-- CreateIndex
CREATE INDEX "turmas_formaturas_dataEvento_idx" ON "turmas_formaturas"("dataEvento");

-- CreateIndex
CREATE INDEX "formandos_turmaId_idx" ON "formandos"("turmaId");

-- CreateIndex
CREATE INDEX "parcelas_formandos_formandoId_idx" ON "parcelas_formandos"("formandoId");

-- CreateIndex
CREATE INDEX "parcelas_formandos_status_idx" ON "parcelas_formandos"("status");

-- CreateIndex
CREATE INDEX "parcelas_formandos_vencimento_idx" ON "parcelas_formandos"("vencimento");

-- CreateIndex
CREATE INDEX "eventos_turma_turmaId_idx" ON "eventos_turma"("turmaId");

-- CreateIndex
CREATE INDEX "eventos_turma_data_idx" ON "eventos_turma"("data");

-- CreateIndex
CREATE INDEX "custos_eventos_turma_eventoId_idx" ON "custos_eventos_turma"("eventoId");

-- AddForeignKey
ALTER TABLE "cliente_contatos_operacionais" ADD CONSTRAINT "cliente_contatos_operacionais_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_contatos_financeiros" ADD CONSTRAINT "cliente_contatos_financeiros_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_followups" ADD CONSTRAINT "crm_followups_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interacoes" ADD CONSTRAINT "crm_interacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_labels" ADD CONSTRAINT "projeto_labels_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_labels" ADD CONSTRAINT "projeto_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "financial_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_freelancers" ADD CONSTRAINT "pagamentos_freelancers_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "freelancers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_freelancers" ADD CONSTRAINT "pagamentos_freelancers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes_servico" ADD CONSTRAINT "opcoes_servico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_itens" ADD CONSTRAINT "orcamento_itens_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_custo_orcamento" ADD CONSTRAINT "itens_custo_orcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_custo_orcamento" ADD CONSTRAINT "itens_custo_orcamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_custo_orcamento" ADD CONSTRAINT "itens_custo_orcamento_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "opcoes_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento_versoes" ADD CONSTRAINT "orcamento_versoes_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_formaturas" ADD CONSTRAINT "turmas_formaturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formandos" ADD CONSTRAINT "formandos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas_formaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas_formandos" ADD CONSTRAINT "parcelas_formandos_formandoId_fkey" FOREIGN KEY ("formandoId") REFERENCES "formandos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_turma" ADD CONSTRAINT "eventos_turma_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas_formaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos_eventos_turma" ADD CONSTRAINT "custos_eventos_turma_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos_turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
