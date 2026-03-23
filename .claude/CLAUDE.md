# OLHARR v2 — Contexto para Claude Code

Sistema de gestão para produtoras audiovisuais. Recriado do zero em 2026-03-23.

---

## Stack

- **Next.js 16.2** (App Router, Turbopack, Server Actions)
- **React 19** + **TypeScript strict**
- **Tailwind v4** (sem `tailwind.config.js` — configuração via `@theme` no globals.css)
- **Prisma v7** — client em `@/generated/prisma/client`, instância global em `@/lib/prisma`
- **Supabase Auth** (email/senha) + **PostgreSQL** (us-east-1)
- **Zod v4** para validação de forms
- **lucide-react** para ícones

---

## Regras críticas

1. **Imports Prisma**: sempre de `@/generated/prisma/client` (nunca `@prisma/client`)
2. **PrismaClient**: nunca instanciar diretamente — importar `prisma` de `@/lib/prisma`
3. **Server Actions**: sempre `requireRole()` ou `requireAuth()` primeiro, validar com Zod, try-catch, `revalidatePath`
4. **prisma.config.ts**: só tem `url` no datasource (adapter não é suportado no defineConfig v7)
5. **lib/prisma.ts**: usa `require('pg')` com cast `any` para evitar conflito de tipos entre `pg` e `@prisma/adapter-pg`
6. **Zod v4**: usar `{ error: '...' }` em vez de `{ required_error: '...' }`
7. **Middleware**: usa `middleware.ts` (com aviso de deprecação — ignorar, ainda funciona no Next 16)
8. **Sem @base-ui/react**: não instalado nesta versão — usar HTML nativo + Tailwind
9. **Design tokens**: definidos via `@theme` em `globals.css` — usar CSS variables (`var(--color-primary)`) ou inline styles diretamente com os hex codes

---

## Deploy

- **Vercel**: https://olharr.vercel.app
- **GitHub repo**: `rafaelmenezescancado-dotcom/olharr`
- **Deploy**: `git push origin main` → Vercel builda automaticamente
- **DATABASE_URL produção** (Vercel): Transaction Pooler IPv4 — `postgresql://postgres:[senha]@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
- **DATABASE_URL local**: conexão direta — `postgresql://postgres:[senha]@db.nytacxpiqzeanxrqyrwf.supabase.co:5432/postgres`
- **SSL produção**: `{ rejectUnauthorized: false }` em `lib/prisma.ts`

> ⚠️ Lembrar de adicionar `DATABASE_URL` de produção (pooler) nas variáveis de ambiente da Vercel

---

## Estrutura de módulos

```
src/
├── app/
│   ├── (auth)/login/        → Página de login
│   ├── (dashboard)/         → Layout autenticado + todas as rotas do app
│   └── layout.tsx           → Root layout (html, body, globals.css)
├── components/
│   ├── auth/                → LoginForm
│   ├── shared/              → Sidebar
│   └── [modulo]/            → Componentes por módulo
├── lib/
│   ├── auth/                → get-user.ts, require-role.ts, logout.ts
│   ├── supabase/            → server.ts, client.ts
│   ├── prisma.ts            → instância global do PrismaClient
│   └── utils.ts             → cn, formatCurrency, formatDate, getInitials
├── modules/
│   └── [modulo]/
│       ├── actions.ts       → Server Actions (mutations)
│       ├── queries.ts       → Queries ao banco
│       ├── schemas.ts       → Schemas Zod
│       └── types.ts         → Tipos TypeScript
└── generated/prisma/        → Client gerado pelo Prisma (nunca editar manualmente)
```

---

## Schema Prisma — Modelos principais

| Modelo | Tabela | Descrição |
|--------|--------|-----------|
| User | users | Usuários do sistema (authId = UUID do Supabase) |
| Client | clients | Clientes / leads do CRM |
| ClienteContatoOperacional | cliente_contatos_operacionais | Contato ops do cliente |
| ClienteContatoFinanceiro | cliente_contatos_financeiros | Contato fin do cliente |
| Project | projects | Projetos (8 estágios) |
| ProjectCost | project_costs | Custos de projeto |
| Label | labels | Labels/tags para projetos |
| ProjetoLabel | projeto_labels | Relação N:M projeto ↔ label |
| Tarefa | tarefas | Tarefas (status + prioridade) |
| FinancialAccount | financial_accounts | Contas bancárias |
| Transaction | transactions | Extrato bancário |
| Freelancer | freelancers | Banco de talentos |
| PagamentoFreelancer | pagamentos_freelancers | Kanban de pagamentos (5 fases) |
| Fornecedor | fornecedores | Fornecedores de serviço |
| Orcamento | orcamentos | Orçamentos com itens |
| AgendaEvent | agenda_events | Eventos de agenda |
| Post | posts | Posts do calendário social |
| Notification | notifications | Notificações in-app |
| TurmaFormatura | turmas_formaturas | Turmas de formatura |
| Formando | formandos | Formandos de uma turma |
| ParcelaFormando | parcelas_formandos | Parcelas de pagamento |
| EventoTurma | eventos_turma | Eventos da turma |
| CustoEventoTurma | custos_eventos_turma | Custos de um evento |

---

## Enums importantes

```typescript
UserRole: ADMIN | PRODUTOR | FINANCEIRO | EXTERNO
ProjectStage: OS_DISTRIBUICAO | PRE_PRODUCAO | DIA_DO_EVENTO | POS_PRODUCAO | EDICAO | REVISAO | ENTREGUE | ARQUIVADO
CrmStage: NOVO_LEAD | PRIMEIRO_CONTATO | PROPOSTA_ENVIADA | NEGOCIACAO | FECHADO_GANHO | FECHADO_PERDIDO | INATIVO
FasePagamentoFreelancer: CONTRATACAO | AGUARDANDO_EVENTO | LANCAMENTO_DRE | PAGO | ARQUIVADO
TurmaStatus: ATIVA | CONCLUIDA | CANCELADA
ParcelaStatus: PENDENTE | PAGO | ATRASADO | CANCELADO
```

---

## Identidade visual

```
Background:    #1E1826
Surface:       #252035
Surface-2:     #2D2642
Border:        #3A3550
Foreground:    #F0EDF5
Muted:         #8B82A0
Subtle:        #6B6280
Primary:       #B52774  (rosa)
Accent:        #1E7FCD  (azul)
Success:       #22C55E
Warning:       #F59E0B
Danger:        #EF4444
```

---

## Módulos implementados (estado atual)

- ✅ Auth (login, middleware, requireRole)
- ✅ Layout + Sidebar
- ✅ Dashboard (stats básicas)
- ⏳ Projetos (placeholder)
- ⏳ CRM (placeholder)
- ⏳ Financeiro (placeholder)
- ⏳ Talentos (placeholder)
- ⏳ Fornecedores (placeholder)
- ⏳ Formaturas (placeholder)
- ⏳ Orçamentos (placeholder)
- ⏳ Tarefas (placeholder)
- ⏳ Agenda (placeholder)
- ⏳ Calendário Social (placeholder)
- ⏳ Configurações (placeholder)

---

## Seed / Primeiro usuário

Para criar o primeiro usuário administrador:
1. Criar o usuário no Supabase Auth (Dashboard → Authentication → Users)
2. Inserir na tabela `users`: `INSERT INTO users (id, auth_id, name, email, role) VALUES (cuid(), '[uuid-do-supabase]', 'Nome', 'email', 'ADMIN')`
3. Ou rodar `prisma/seed.ts` quando criado
