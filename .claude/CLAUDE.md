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
- **Deploy:** Vercel (https://olharr.vercel.app) — `git push origin main` → build automático

---

## 2. REGRAS CRÍTICAS — NÃO VIOLAR

1. **Imports Prisma**: SEMPRE de `@/generated/prisma/client` — NUNCA `@prisma/client`
2. **PrismaClient**: NUNCA instanciar diretamente — importar `prisma` de `@/lib/prisma`
3. **Server Actions**: sempre `requireRole()` ou `requireAuth()` primeiro, validar com Zod, try-catch, `revalidatePath`
4. **Zod v4**: usar `{ error: '...' }` em vez de `{ required_error: '...' }`
5. **Sem @base-ui/react**: não instalado — usar HTML nativo + Tailwind
6. **Tailwind v4**: sem `tailwind.config.js` — tokens definidos via `@theme` no `globals.css`
7. **Middleware**: usa `middleware.ts` na raiz do src (aviso de deprecação — ignorar, ainda funciona)
8. **Next.js 16**: LEIA `node_modules/next/dist/docs/` antes de usar APIs novas — pode ter breaking changes
9. **prisma.config.ts**: só tem `url` no datasource (adapter não é suportado no defineConfig v7)
10. **SSL produção**: `{ rejectUnauthorized: false }` em `lib/prisma.ts`
11. **lib/prisma.ts**: usa `require('pg')` com cast `any` para evitar conflito de tipos entre `pg` e `@prisma/adapter-pg`
12. **Favicon**: deve ser PNG RGBA (Turbopack rejeita RGB puro em .ico)

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
- Modais: backdrop-blur, rounded-2xl, max-w variável
- Kanban: colunas com cor de borda no topo, cards com hover para indigo
- Formulários: bg-slate-50, border-slate-200, focus:border-indigo-400

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
│       └── queries.ts       → Queries ao banco
├── lib/
│   ├── auth/                → get-user, require-role, logout
│   ├── supabase/            → server.ts, client.ts
│   ├── prisma.ts            → Instância global PrismaClient
│   └── utils.ts             → cn, formatCurrency, formatDate, getInitials
└── generated/prisma/        → Client gerado (NUNCA editar)
```

### Padrão de componentes
- **page.tsx** = Server Component → fetch dados com queries.ts
- **componentes** = Client Components ('use client') → recebem dados via props
- **Server Actions** = 'use server', requireAuth, Zod, try-catch, revalidatePath

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
```

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
| Preview Orçamentos | `modelos-atuais/preview-orcamentos.html` | Layout interativo orçamentos |
| Preview Projetos | `modelos-atuais/preview-projetos.html` | Layout interativo projetos |

> **IMPORTANTE**: Os previews HTML são a referência visual definitiva.

---

## 8. PADRÕES DE CÓDIGO

### Server Action
```typescript
'use server'
import { requireRole } from '@/lib/auth/require-role'
import { prisma } from '@/lib/prisma'
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
  } catch { return { error: 'Erro ao criar' } }
}
```

### Query
```typescript
import { prisma } from '@/lib/prisma'
export async function getDados() {
  return prisma.model.findMany({ include: { relacao: true }, orderBy: { createdAt: 'desc' } })
}
```

### Page (Server Component)
```typescript
import { getDados } from '@/modules/modulo/queries'
import { MeuComponente } from '@/components/modulo/meu-componente'
export default async function Page() {
  const dados = await getDados()
  return <MeuComponente dados={dados} />
}
```

---

## 9. CHECKLIST PRÉ-COMMIT

- [ ] `npm run build` compila sem erros
- [ ] Imports de Prisma são de `@/generated/prisma/client`
- [ ] Server Actions têm requireAuth/requireRole
- [ ] Zod usa `{ error: '...' }` (não `{ required_error: '...' }`)
- [ ] Componentes Client têm `'use client'` no topo
- [ ] Visual segue o design system (indigo/slate/white)

---

## 10. MÓDULOS — ESTADO ATUAL

- ✅ Auth (login, middleware, requireRole)
- ✅ Layout + Sidebar (glassmorphism, colapsável)
- ✅ Dashboard (stats dinâmicas)
- ✅ Orçamentos (Kanban + modal viabilidade)
- ✅ Formaturas (Kanban turmas + modal detalhes)
- ✅ Favicon OLHARR
- ⏳ Projetos
- ⏳ CRM
- ⏳ Financeiro
- ⏳ Talentos
- ⏳ Fornecedores
- ⏳ Tarefas
- ⏳ Agenda
- ⏳ Calendário Social
- ⏳ Configurações
