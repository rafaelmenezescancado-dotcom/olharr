# OLHARR v2 — Instruções para Claude Code

Sistema de gestão para produtoras audiovisuais (foto e vídeo). Stack moderna, deploy automático via Vercel.

---

## 1. STACK

- **Next.js 16.2** (App Router, Turbopack, Server Actions)
- **React 19** + **TypeScript strict**
- **Tailwind v4** (sem `tailwind.config.js` — configuração via `@theme` no globals.css)
- **Prisma v7** — client em `@/generated/prisma/client`, instância global em `@/lib/prisma`
- **Supabase Auth** (email/senha) + **PostgreSQL** (us-east-1)
- **Zod v4** para validação
- **lucide-react** para ícones
- **date-fns** para manipulação de datas
- **Deploy:** Vercel (https://olharr.vercel.app) — `git push origin main` → build automático

---

## 2. REGRAS CRÍTICAS — NÃO VIOLAR

1. **Imports Prisma**: SEMPRE de `@/generated/prisma/client` — NUNCA `@prisma/client`
2. **PrismaClient**: NUNCA instanciar diretamente — importar `prisma` de `@/lib/prisma`
3. **Server Actions**: sempre `requireRole()` ou `requireAuth()` primeiro, validar com Zod, try-catch com `handleActionError`, `revalidatePath`
4. **Zod v4**: usar `{ error: '...' }` em vez de `{ required_error: '...' }`
5. **Sem @base-ui/react**: não instalado — usar HTML nativo + Tailwind
6. **Tailwind v4**: sem `tailwind.config.js` — tokens definidos via `@theme` no `globals.css`
7. **Middleware**: usa `middleware.ts` na raiz do src (aviso de deprecação — ignorar, ainda funciona)
8. **Next.js 16**: LEIA `node_modules/next/dist/docs/` antes de usar APIs novas — pode ter breaking changes
9. **prisma.config.ts**: só tem `url` no datasource (adapter não é suportado no defineConfig v7)
10. **SSL produção**: `{ rejectUnauthorized: false }` em `lib/prisma.ts`
11. **lib/prisma.ts**: usa `require('pg')` com cast `any` para evitar conflito de tipos entre `pg` e `@prisma/adapter-pg`
12. **Favicon**: deve ser PNG RGBA (Turbopack rejeita RGB puro em .ico)
13. **Error handling**: SEMPRE usar `handleActionError()` de `@/lib/logger` nos catch blocks — NUNCA `catch {}` vazio
14. **Ownership**: Usar `checkOwnership()` de `@/lib/auth/check-ownership` em mutations sensíveis (update/delete)
15. **Paginação**: Usar `parsePagination()` + `paginationArgs()` de `@/lib/pagination` em queries que retornam listas
16. **Type casts em actions**: Retorno de Server Actions deve usar cast `as { error?: string; success?: boolean }` no lado do client para evitar erros TS de union types

---

## 3. DESIGN SYSTEM

### Tokens (definidos em globals.css via @theme)

```
Background:     #F0EDFF     → bg-background (gradient: #ede9ff → #f8f6ff → #e8e3ff)
Surface:        #FFFFFF     → bg-surface
Surface-2:      #F7F5FF     → bg-surface-2
Border:         #E8E3F5     → border-border
Foreground:     #1C1730     → text-foreground
Muted:          #676767     → text-muted-foreground
Subtle:         #9B96B0     → text-subtle
Primary:        #8B5CF6     → bg-primary / text-primary (roxo)
Accent:         #1E7FCD     → bg-accent
Success:        #22C55E     → text-success
Warning:        #F59E0B     → text-warning
Danger:         #EF4444     → text-danger
```

### Tipografia
- Font: Poppins (Google Fonts, carregada no layout.tsx)
- Body: 14px, line-height 1.5
- Pesos: 400 (body), 500 (labels), 600 (subtítulos), 700 (títulos)

### Sidebar
- Glassmorphism: `rgba(255,255,255,.55)` + `backdrop-filter: blur(16px)`
- Colapsada: 68px | Expandida: 240px (hover)

### Padrões de UI
- Cards: `bg-white`, `border-slate-200`, `rounded-xl`, `shadow-sm`
- Modais: backdrop `rgba(0,0,0,0.6)`, rounded-2xl, max-w variável
- Kanban: colunas com cor de borda no topo, cards com hover para indigo
- Formulários: bg-slate-50, border-slate-200, focus:border-indigo-400
- Input style padrão: `{ background: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }`

### Debt de design (a resolver)
- 76 cores hardcoded detectadas — migrar para CSS variables
- 11 componentes definem `inputStyle` localmente — extrair para constante compartilhada
- 16 modais com padrão duplicado — extrair `<Modal>` compartilhado
- 5 Kanbans com padrão idêntico — extrair `<Kanban<T>>` genérico
- Zero atributos ARIA — precisa de acessibilidade
- Extrair componentes: `<PageHeader>`, `<StatusBadge>`, `<FormInput>`, `<Card>`

---

## 4. ESTRUTURA DE ARQUIVOS

```
src/
├── app/
│   ├── (auth)/login/        → Página de login
│   ├── (dashboard)/         → Layout autenticado (sidebar + main)
│   │   ├── dashboard/       → Dashboard principal
│   │   ├── projetos/        → Kanban de projetos
│   │   ├── orcamentos/      → Kanban + modal de orçamentos
│   │   │   └── [id]/        → Detalhe do orçamento
│   │   ├── crm/             → Pipeline de clientes
│   │   ├── tarefas/         → Board de tarefas
│   │   ├── financeiro/      → Dashboard financeiro
│   │   │   └── pagamentos-freela/
│   │   ├── talentos/        → Grid de freelancers
│   │   ├── fornecedores/    → Lista de fornecedores
│   │   ├── formaturas/      → Módulo de formaturas
│   │   │   └── [id]/        → Detalhe da turma
│   │   ├── agenda/          → Lista de eventos
│   │   ├── calendario/      → Calendário social
│   │   ├── fluxo-caixa/     → Fluxo de caixa
│   │   └── configuracoes/   → Configurações
│   ├── layout.tsx           → Root layout (Poppins, html)
│   └── globals.css          → Design tokens (@theme)
├── components/
│   ├── shared/sidebar.tsx   → Sidebar colapsável
│   └── [modulo]/            → Componentes por módulo
├── modules/
│   └── [modulo]/
│       ├── actions.ts       → Server Actions (mutations)
│       ├── queries.ts       → Queries ao banco
│       ├── schemas.ts       → Zod schemas (opcional)
│       └── types.ts         → Types do módulo (opcional)
├── lib/
│   ├── auth/
│   │   ├── get-user.ts      → getUser() — retorna AuthUser | null
│   │   ├── require-role.ts  → requireRole() e requireAuth()
│   │   ├── check-ownership.ts → canAccess() e checkOwnership() ← NOVO
│   │   └── logout.ts        → Logout action
│   ├── supabase/            → server.ts, client.ts
│   ├── prisma.ts            → Instância global PrismaClient
│   ├── logger.ts            → handleActionError() + logger ← NOVO
│   ├── pagination.ts        → parsePagination(), paginationArgs(), paginatedResult() ← NOVO
│   ├── action-result.ts     → ActionResult<T> type ← NOVO
│   └── utils.ts             → cn, formatCurrency, formatDate, getInitials
└── generated/prisma/        → Client gerado (NUNCA editar)
```

### Padrão de componentes
- **page.tsx** = Server Component → fetch dados com queries.ts
- **componentes** = Client Components ('use client') → recebem dados via props
- **Server Actions** = 'use server', requireAuth, Zod, try-catch com handleActionError, revalidatePath

---

## 5. SCHEMA PRISMA — MODELOS

| Modelo | Descrição |
|--------|-----------|
| User | Usuários do sistema (authId = UUID Supabase) |
| Client | Clientes / leads do CRM |
| ClienteContatoOperacional | Contato operacional do cliente |
| ClienteContatoFinanceiro | Contato financeiro do cliente |
| CrmFollowUp | Follow-ups do CRM |
| CrmInteracao | Interações do CRM |
| Project | Projetos (8 estágios) |
| ProjectCost | Custos de projeto |
| Label / ProjetoLabel | Tags para projetos |
| Tarefa | Tarefas (status + prioridade) |
| FinancialAccount | Contas bancárias |
| Transaction | Extrato bancário |
| Freelancer | Banco de talentos |
| PagamentoFreelancer | Pagamentos (5 fases) |
| Fornecedor | Fornecedores de serviço |
| Orcamento / OrcamentoItem | Orçamentos com itens |
| AgendaEvent | Eventos de agenda |
| Post | Posts calendário social |
| Notification | Notificações in-app |
| TurmaFormatura | Turmas de formatura |
| Formando / ParcelaFormando | Formandos e parcelas |
| EventoTurma / CustoEventoTurma | Eventos e custos de turma |

### Enums

```
UserRole: ADMIN | PRODUTOR | FINANCEIRO | EXTERNO
ProjectStage: OS_DISTRIBUICAO | PRE_PRODUCAO | DIA_DO_EVENTO | POS_PRODUCAO | EDICAO | REVISAO | ENTREGUE | ARQUIVADO
CrmStage: NOVO_LEAD | PRIMEIRO_CONTATO | PROPOSTA_ENVIADA | NEGOCIACAO | FECHADO_GANHO | FECHADO_PERDIDO | INATIVO
OrcamentoStatus: RASCUNHO | ENVIADO | APROVADO | RECUSADO | EXPIRADO
FasePagamentoFreelancer: CONTRATACAO | AGUARDANDO_EVENTO | LANCAMENTO_DRE | PAGO | ARQUIVADO
TurmaStatus: ATIVA | CONCLUIDA | CANCELADA
ParcelaStatus: PENDENTE | PAGO | ATRASADO | CANCELADO
TaskStatus: PENDENTE | EM_ANDAMENTO | CONCLUIDA | CANCELADA
TaskPriority: BAIXA | MEDIA | ALTA | URGENTE
```

### Indexes
O schema contém 49 `@@index` cobrindo todas as FKs e campos de filtro/ordenação. Ao adicionar novos modelos, SEMPRE incluir `@@index` nas FKs e campos usados em `where`/`orderBy`.

---

## 6. DEPLOY

- **GitHub**: `rafaelmenezescancado-dotcom/olharr` (branch `main`)
- **Vercel**: https://olharr.vercel.app
- **Supabase**: `db.nytacxpiqzeanxrqyrwf.supabase.co`
- **DATABASE_URL produção** (Vercel): Transaction Pooler IPv4
- **DATABASE_URL local**: conexão direta (porta 5432)
- **Usuário ativo**: `contato@olharr.com.br` (ADMIN)

---

## 7. DOCUMENTOS DE REFERÊNCIA

| Documento | Path | Conteúdo |
|-----------|------|----------|
| PLANO-INFRA | `modelos-atuais/PLANO-INFRA.md` | Plano master — schema, fases, componentes |
| ADR-001 | `modelos-atuais/ADR-001-cost-builder.md` | Decisão arquitetural do Cost Builder |
| ADR-002 | `modelos-atuais/ADR-002-p0-infrastructure.md` | P0 Infrastructure Hardening (indexes, logging, pagination, ownership) |
| Preview Orçamentos | `modelos-atuais/preview-orcamentos.html` | Layout interativo orçamentos |
| Preview Projetos | `modelos-atuais/preview-projetos.html` | Layout interativo projetos |

> **IMPORTANTE**: Os previews HTML são a referência visual definitiva.

---

## 8. PADRÕES DE CÓDIGO

### Server Action (padrão atualizado)
```typescript
'use server'
import { requireRole } from '@/lib/auth/require-role'
import { prisma } from '@/lib/prisma'
import { handleActionError } from '@/lib/logger'
import { checkOwnership } from '@/lib/auth/check-ownership'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

const schema = z.object({
  titulo: z.string({ error: 'Título é obrigatório' }).min(1),
})

export async function criarAlgo(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Dados inválidos' }
  try {
    await prisma.model.create({ data: parsed.data })
    revalidatePath('/rota')
    return { success: true }
  } catch (e) {
    return handleActionError('criarAlgo', e, 'Erro ao criar')
  }
}

export async function atualizarAlgo(id: string, formData: FormData) {
  const user = await requireRole(['ADMIN', 'PRODUTOR'])
  // Ownership check — só o responsável ou ADMIN pode editar
  const registro = await prisma.model.findUnique({ where: { id }, select: { responsavelId: true } })
  const denied = checkOwnership(user, registro?.responsavelId)
  if (denied) return denied
  // ... resto da lógica
}
```

### Query com paginação
```typescript
import { prisma } from '@/lib/prisma'
import { parsePagination, paginationArgs, paginatedResult } from '@/lib/pagination'
import type { PaginationParams } from '@/lib/pagination'

export async function getDados(pagination?: Partial<PaginationParams>) {
  const params = parsePagination(pagination)
  const { skip, take } = paginationArgs(params)
  const where = { active: true }
  const [data, total] = await Promise.all([
    prisma.model.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.model.count({ where }),
  ])
  return paginatedResult(data, total, params)
}
```

### Page (Server Component)
```typescript
import { getDados } from '@/modules/modulo/queries'
import { MeuComponente } from '@/components/modulo/meu-componente'
export default async function Page() {
  const result = await getDados()
  return <MeuComponente dados={result.data} />
}
```

### Consumo de Server Action no Client
```typescript
// Sempre usar cast para evitar erros TS de union type
const result = await minhaAction(formData) as { error?: string; success?: boolean }
if (result?.error) {
  setError(result.error)
}
```

---

## 9. UTILITÁRIOS (lib/)

| Arquivo | Exports | Uso |
|---------|---------|-----|
| `lib/logger.ts` | `logger.info/warn/error`, `handleActionError()` | Log estruturado + handler para catch blocks |
| `lib/pagination.ts` | `parsePagination()`, `paginationArgs()`, `paginatedResult()`, `DEFAULT_PAGE_SIZE` (50) | Paginação Prisma |
| `lib/action-result.ts` | `ActionResult<T>` | Type union para retorno de Server Actions |
| `lib/auth/check-ownership.ts` | `canAccess()`, `checkOwnership()` | ADMIN bypassa, outros só acessam se são o owner |
| `lib/auth/get-user.ts` | `getUser()`, `AuthUser` type | Retorna usuário autenticado via Supabase + Prisma |
| `lib/auth/require-role.ts` | `requireRole()`, `requireAuth()` | Guards para Server Actions e pages |
| `lib/utils.ts` | `cn()`, `formatCurrency()`, `formatDate()`, `formatDateTime()`, `getInitials()` | Utilitários gerais |
| `lib/prisma.ts` | `prisma` | Instância global PrismaClient |

---

## 10. CHECKLIST PRÉ-COMMIT

- [ ] `npx tsc --noEmit` compila sem erros
- [ ] `npm run build` compila sem erros
- [ ] Imports de Prisma são de `@/generated/prisma/client`
- [ ] Server Actions têm requireAuth/requireRole
- [ ] Server Actions usam `handleActionError()` nos catch blocks
- [ ] Mutations sensíveis (update/delete) usam `checkOwnership()`
- [ ] Zod usa `{ error: '...' }` (não `{ required_error: '...' }`)
- [ ] Componentes Client têm `'use client'` no topo
- [ ] Visual segue o design system (usar CSS variables, não hex hardcoded)
- [ ] Novas queries de lista usam paginação
- [ ] Novos modelos Prisma têm `@@index` nas FKs

---

## 11. MÓDULOS — ESTADO ATUAL

- ✅ Auth (login, middleware, requireRole, checkOwnership)
- ✅ Layout + Sidebar (glassmorphism, colapsável)
- ✅ Dashboard (stats dinâmicas)
- ✅ Orçamentos (Kanban + modal + items com recalc transacional)
- ✅ Formaturas (Kanban turmas + formandos + parcelas)
- ✅ Projetos (Kanban 8 estágios + CRUD + ownership check)
- ✅ CRM (Pipeline Kanban + cliente CRUD com contatos)
- ✅ Financeiro (Dashboard + transações + contas + fluxo de caixa otimizado)
- ✅ Talentos (Grid + busca + paginação)
- ✅ Pagamentos Freela (Kanban 5 fases)
- ✅ Tarefas (Board 3 colunas + prioridade + ownership check)
- ✅ Fornecedores (Lista + CRUD)
- ✅ Agenda (Lista + CRUD)
- ✅ Calendário Social (Board por status)
- ✅ Favicon OLHARR
- ⏳ Configurações (página placeholder)
- ⏳ Notificações in-app (model existe, UI não)

### Pendências P1 (próximos sprints)
- Extrair componentes compartilhados (Modal, Kanban, PageHeader, StatusBadge, FormInput)
- Adicionar ARIA labels e acessibilidade em todos os componentes
- Migrar 76 cores hardcoded para CSS variables
- Implementar paginação em CRM, Projetos, Formaturas
- Adicionar checkOwnership nos módulos CRM, Financeiro, Agenda, Fornecedores, Calendário, Pagamentos-Freela
- Adicionar testes (auth, actions, ownership)
- Setup monitoring (Sentry / Vercel Analytics)
- Composite indexes para kanban queries (e.g. `[clienteId, stage]`)
