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

### Radius Scale

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-lg` | `12px` | Cards, modais, chips |
| `--radius-md` | `8px` | Inputs, selects, botões |
| `--radius-sm` | `4px` | Badges |

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

### Design Tokens — Cost Builder (planejado)

| Serviço | Ícone | Cor bg | Tipo |
|---------|-------|--------|------|
| Fotógrafo | 📷 | `rgba(139,92,246,.08)` (primary) | HORA |
| Videomaker | 🎬 | `rgba(217,70,239,.08)` (fuchsia) | HORA |
| Drone | 🚁 | `rgba(30,127,205,.08)` (accent) | HORA |
| Ed. Real Time | ⚡ | `rgba(245,158,11,.08)` (warning) | HORA |
| Aftermovie | 🎞️ | `rgba(30,127,205,.08)` (accent) | OPCAO |
| Ensaio | 💍 | `rgba(244,63,94,.08)` (rose) | OPCAO |
| Making Of | 💄 | `rgba(217,70,239,.08)` (fuchsia) | OPCAO |
| Álbum | 📖 | `rgba(34,197,94,.08)` (success) | OPCAO |

> Estes valores serão persistidos em `ServicoBase.icone` e `ServicoBase.cor`.

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
│   │   ├── servicos/        → 🆕 Catálogo de ServicoBase (planejado)
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
│   │   ├── check-ownership.ts → canAccess() e checkOwnership()
│   │   └── logout.ts        → Logout action
│   ├── supabase/            → server.ts, client.ts
│   ├── prisma.ts            → Instância global PrismaClient
│   ├── logger.ts            → handleActionError() + logger
│   ├── pagination.ts        → parsePagination(), paginationArgs(), paginatedResult()
│   ├── action-result.ts     → ActionResult<T> type
│   └── utils.ts             → cn, formatCurrency, formatDate, getInitials
└── generated/prisma/        → Client gerado (NUNCA editar)
```

### Padrão de componentes
- **page.tsx** = Server Component → fetch dados com queries.ts
- **componentes** = Client Components ('use client') → recebem dados via props
- **Server Actions** = 'use server', requireAuth, Zod, try-catch com handleActionError, revalidatePath

---

## 5. SCHEMA PRISMA — MODELOS ATUAIS

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

### Enums Atuais

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

## 6. ROADMAP — PLANO-INFRA (Schema Planejado vs. Implementado)

> Fonte de verdade: `modelos-atuais/PLANO-INFRA.md` + `modelos-atuais/ADR-001-cost-builder.md`

### 6.1 Modelos PLANEJADOS (ainda não no schema)

| Modelo | Descrição | Fase |
|--------|-----------|------|
| `OrcamentoVersao` | Versionamento de propostas (snapshot JSON dos itens) | Fase 1 |
| `ServicoBase` | Serviços unificados com tipo HORA ou OPCAO (substitui categorias) | Fase 1 |
| `OpcaoServico` | Opções dentro de cada ServicoBase tipo OPCAO | Fase 1 |
| `ItemCustoOrcamento` | Substitui `OrcamentoItem` — com servicoId, opcaoId, horas, custoTotal | Fase 1 |
| `MultiplicadorEvento` | Tabela de multiplicadores para Evento/Corporativo (futuro) | Fase 1 |

### 6.2 Enums PLANEJADOS (ainda não no schema)

```
Vertente: CASAMENTO | EVENTO | CORPORATIVO | QUINZE_ANOS | ENSAIO | PUBLICITARIO
TipoServico: HORA | OPCAO
```

> **FORMATURA não é Vertente** — tem módulo próprio com lógica isolada (por formando × eventos × equipe × distância).

### 6.3 Campos NOVOS planejados em modelos existentes

**Orcamento** (adicionar):
- `vertente Vertente?` — identifica qual formulário guiado usar
- `margemPct Decimal? @db.Decimal(5, 2)` — margem global (não mais por item)
- Relações: `versoes OrcamentoVersao[]`, `tarefas Tarefa[]`

**Tarefa** (adicionar):
- `orcamentoId String?` — vinculação com orçamento
- `urgente Boolean @default(false)` — Eisenhower matrix
- `importante Boolean @default(false)` — Eisenhower matrix
- Relação: `orcamento Orcamento? @relation(..., onDelete: SetNull)`

### 6.4 Mudanças de naming planejadas

- `OrcamentoItem` → renomeado para `ItemCustoOrcamento` (margem sai do item, vai para Orcamento.margemPct)
- Fórmula de preço: `valorVenda = totalCustos / (1 - margemPct / 100)`

### 6.5 Decisões Arquiteturais (ADR-001)

- **Cost Builder unificado**: chips de serviço (HORA/OPCAO) em vez de wizard por vertente
- **ServicoBase modelo único**: substitui CategoriaServico eliminada; campo `area` ("FOTOGRAFIA", "VIDEO", "EXTRAS") agrupa
- **Margem global**: `Orcamento.margemPct` em vez de margem por item
- **Formatura isolada**: lógica por formando × evento, não usa Cost Builder

---

## 7. FASES DE IMPLEMENTAÇÃO (PLANO-INFRA)

### Fase 1 — Schema & Backend ⏳
1. Adicionar enums `Vertente` + `TipoServico`
2. Adicionar `OrcamentoVersao`
3. Adicionar `ServicoBase` + `OpcaoServico`
4. Adicionar `MultiplicadorEvento`
5. Criar `ItemCustoOrcamento` (substitui OrcamentoItem)
6. Atualizar `Orcamento` (vertente, margemPct, relações)
7. Adicionar campos Tarefa (orcamentoId, urgente, importante)
8. Rodar migration
9. Criar seed com dados das planilhas (ServicoBase + OpcaoServico)
10. Criar `modules/orcamentos/schemas.ts` e `types.ts`
11. Expandir queries e actions

### Fase 2 — Refatoração Componentes Orçamentos ⏳
Decompor `orcamentos-list.tsx` (660 linhas) em:

| Componente | Responsabilidade | Linhas aprox. |
|-----------|-----------------|---------------|
| `orcamentos-list.tsx` | Orquestrador: state global, filtros | ~100 |
| `orcamento-stats.tsx` | 4 cards de estatísticas | ~60 |
| `orcamento-kanban.tsx` | Board com 4 colunas + filtro | ~80 |
| `orcamento-card.tsx` | Card individual na coluna kanban | ~60 |
| `orcamento-modal.tsx` | Modal de detalhes (itens, viabilidade, versões, tarefas) | ~200 |
| `orcamento-form.tsx` | Modal de criação | ~80 |
| `orcamento-viabilidade.tsx` | Análise de viabilidade | ~80 |

### Fase 3 — Features Novas (Versões + Tarefas) ⏳
1. `orcamento-versoes.tsx` — timeline de versões + criar versão
2. `orcamento-tarefas.tsx` — mini-lista + criar tarefa vinculada
3. Integrar no modal (03) e página de detalhes (03b)

### Fase 4 — Cost Builder (aba "Descrição de Custos") ⏳
1. `orcamento-cost-builder.tsx` — orquestrador: chips + form + lista
2. `cost-builder-form.tsx` — form condicional HORA/OPCAO + ADICIONAR
3. `cost-builder-list.tsx` — itens com ícone + horas + desc + custo + ✕
4. `cost-builder-total.tsx` — total + "Aplicar ao Orçamento"

### Fase 5 — Catálogo de Serviços (`/servicos`) ⏳
1. Rota `/servicos` com CRUD de ServicoBase
2. `servicos-list.tsx`, `servico-form.tsx`
3. Seed automático baseado nas planilhas AUX

### Fase 6 — Polish Visual ⏳
1. Micro-animações (hover chips, slide-down form)
2. Tipografia e espaçamentos
3. Responsividade mobile

---

## 8. FLUXO DO MÓDULO ORÇAMENTOS (Visão Completa)

```
03d - SERVIÇOS (catálogo)          03 - ORÇAMENTOS (kanban)
     │                                    │
     │  Serviços alimentam               │  Clicar num card abre
     │  os custos                         │
     ▼                                    ▼
Aba "Descrição de Custos"          03b - DETALHES (/orcamentos/[id])
     │                                    │
     │  Cost Builder: chips              │  Edição de itens, versões,
     │  HORA/OPCAO → itens              │  tarefas, status
     └──────────┬─────────────────────────┘
                │
                ▼
         MARGEM = Valor de Venda − Custos
         valorVenda = totalCustos / (1 - margemPct / 100)
```

### Diagrama de Relacionamentos (planejado)

```
Client (CRM)
  │ 1:N
  ▼
Orcamento (vertente + margemPct global)
  ├── 1:N → ItemCustoOrcamento (custoTotal + desc + horas?)
  │              ├── N:1 → ServicoBase (tipo HORA: custoPorHora; tipo OPCAO: tem opções)
  │              │              └── 1:N → OpcaoServico (nome + custo fixo)
  │              └── N:1 → OpcaoServico (direta, quando tipo OPCAO)
  ├── 1:N → OrcamentoVersao (snapshots)
  └── 1:N → Tarefa (tarefas vinculadas)

Configuração:
├── ServicoBase → OpcaoServico          (catálogo unificado)
└── MultiplicadorEvento                  (multiplicadores Evento/Corp — futuro)
```

### Novas Actions planejadas (modules/orcamentos/actions.ts)

```typescript
criarVersao(orcamentoId)              // Cria snapshot da versão atual
restaurarVersao(versaoId)             // Restaura itens de versão anterior
vincularTarefa(orcamentoId, formData) // Cria tarefa vinculada
concluirTarefa(tarefaId)             // Marca tarefa como concluída
adicionarItemCusto(orcamentoId, formData) // Cost Builder: item HORA ou OPCAO
removerItemCusto(itemId, orcamentoId)     // Cost Builder: remove item
```

---

## 9. DEPLOY

- **GitHub**: `rafaelmenezescancado-dotcom/olharr` (branch `main`)
- **Vercel**: https://olharr.vercel.app
- **Supabase**: `db.nytacxpiqzeanxrqyrwf.supabase.co`
- **DATABASE_URL produção** (Vercel): Transaction Pooler IPv4
- **DATABASE_URL local**: conexão direta (porta 5432)
- **Usuário ativo**: `contato@olharr.com.br` (ADMIN)

---

## 10. DOCUMENTOS DE REFERÊNCIA

| Documento | Path | Conteúdo |
|-----------|------|----------|
| PLANO-INFRA | `modelos-atuais/PLANO-INFRA.md` | **Plano master** — schema planejado, fases, componentes, Cost Builder |
| ADR-001 | `modelos-atuais/ADR-001-cost-builder.md` | Decisão: ServicoBase unificado (HORA/OPCAO), margem global |
| ADR-002 | `modelos-atuais/ADR-002-p0-infrastructure.md` | P0 Infrastructure Hardening (indexes, logging, pagination, ownership) |
| INDICE | `modelos-atuais/INDICE.md` | Índice de todas as telas/rotas (incluindo planejadas) |
| Preview Orçamentos | `modelos-atuais/preview-orcamentos.html` | Layout interativo orçamentos |
| Preview Projetos | `modelos-atuais/preview-projetos.html` | Layout interativo projetos |

> **IMPORTANTE**: Os previews HTML são a referência visual definitiva. O PLANO-INFRA é a fonte de verdade para schema e fases.

---

## 11. PADRÕES DE CÓDIGO

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

## 12. UTILITÁRIOS (lib/)

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

## 13. CHECKLIST PRÉ-COMMIT

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

## 14. MÓDULOS — ESTADO ATUAL

### Implementados (✅)
- **Auth** — login, middleware, requireRole, checkOwnership
- **Layout + Sidebar** — glassmorphism, colapsável
- **Dashboard** — stats dinâmicas
- **Orçamentos** — Kanban + modal + items com recalc transacional (⚠️ monolítico, 660 linhas — refatorar na Fase 2)
- **Formaturas** — Kanban turmas + formandos + parcelas
- **Projetos** — Kanban 8 estágios + CRUD + ownership check
- **CRM** — Pipeline Kanban + cliente CRUD com contatos
- **Financeiro** — Dashboard + transações + contas + fluxo de caixa otimizado
- **Talentos** — Grid + busca + paginação
- **Pagamentos Freela** — Kanban 5 fases
- **Tarefas** — Board 3 colunas + prioridade + ownership check
- **Fornecedores** — Lista + CRUD
- **Agenda** — Lista + CRUD
- **Calendário Social** — Board por status
- **Favicon OLHARR**

### Parciais (⏳)
- **Configurações** — página placeholder
- **Notificações** — model existe, UI não

### Planejados (🆕 — ver PLANO-INFRA)
- **Serviços** (`/servicos`) — Catálogo de ServicoBase + OpcaoServico (Fase 5)
- **Cost Builder** — Aba "Descrição de Custos" no orçamento (Fase 4)
- **Versionamento Orçamentos** — OrcamentoVersao com snapshots (Fase 3)
- **Tarefas vinculadas a orçamentos** — orcamentoId + Eisenhower (Fase 3)
- **Insumos** (`/insumos`) — modelo Insumo (futuro)

### Pendências P0 (infraestrutura — resolvidas ✅)
- ✅ handleActionError em todas as 10+ actions
- ✅ 49 @@index no schema
- ✅ Paginação em Financeiro e Talentos
- ✅ checkOwnership em Projetos e Tarefas
- ✅ logger.ts, pagination.ts, action-result.ts, check-ownership.ts criados

### Pendências P1 (próximos sprints)
- Implementar Fases 1–6 do PLANO-INFRA (schema → refator → features → cost builder → catálogo → polish)
- Extrair componentes compartilhados (Modal, Kanban, PageHeader, StatusBadge, FormInput)
- Adicionar ARIA labels e acessibilidade em todos os componentes
- Migrar 76 cores hardcoded para CSS variables
- Implementar paginação em CRM, Projetos, Formaturas
- Adicionar checkOwnership nos módulos CRM, Financeiro, Agenda, Fornecedores, Calendário, Pagamentos-Freela
- Adicionar testes (auth, actions, ownership)
- Setup monitoring (Sentry / Vercel Analytics)
- Composite indexes para kanban queries (e.g. `[clienteId, stage]`)
