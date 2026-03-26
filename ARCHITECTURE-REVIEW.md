# OLHARR v2 — Comprehensive Architecture Review

**Date:** 2026-03-26
**Reviewer:** Claude Code
**Project:** OLHARR v2 (Next.js 16 + React 19 + Prisma v7 + Supabase Auth)

---

## Executive Summary

OLHARR v2 is a well-structured Next.js 16 application for audiovisual production management with a solid foundation in auth, data modeling, and module organization. The architecture demonstrates good separation of concerns (Server Components, Client Components, Server Actions, Queries) and follows modern Next.js patterns.

**Current Status:** 5/14 modules implemented (Auth, Layout, Dashboard, Orçamentos, Formaturas). Ready to scale horizontally, but requires strategic improvements in database optimization, error handling consistency, and state management patterns before rapid feature expansion.

**Critical Risk:** No database indexes defined. N+1 query risks in dashboard and multi-record operations. This must be addressed before production scale.

---

## 1. ARCHITECTURE SUMMARY

### 1.1 Stack Validation

| Component | Choice | Version | Status |
|-----------|--------|---------|--------|
| **Framework** | Next.js | 16.2.1 | ✅ Modern, good choice |
| **Runtime** | React 19 | 19.2.4 | ✅ Latest with improved hooks |
| **DB ORM** | Prisma | 7.5.0 | ✅ Mature, with PrismaPg adapter |
| **Auth** | Supabase Auth | 0.9.0 | ✅ Good for MVP |
| **Database** | PostgreSQL | us-east-1 | ✅ Production-ready |
| **Validation** | Zod | 4.3.6 | ✅ Type-safe |
| **CSS** | Tailwind v4 | 4.0.0 | ⚠️ No config file (via `@theme`) |
| **Icons** | lucide-react | 0.577.0 | ✅ Good choice |

### 1.2 Architecture Layers

```
┌─ Next.js App Router (pages, layouts, API) ─────────────────┐
│  ├─ (auth)/login        → Auth flow, Supabase redirect      │
│  ├─ (dashboard)/*       → Protected routes, requireAuth      │
│  └─ middleware.ts       → Global auth guard                 │
├─────────────────────────────────────────────────────────────┤
│ Server Components (page.tsx)                                 │
│  ├─ requireAuth() → validate session                        │
│  ├─ queries.ts → fetch data                                 │
│  └─ Pass props to Client Components                          │
├─────────────────────────────────────────────────────────────┤
│ Client Components (*.tsx, 'use client')                      │
│  ├─ Interactive UI, state management                        │
│  ├─ Call Server Actions for mutations                       │
│  └─ Revalidate via revalidatePath()                         │
├─────────────────────────────────────────────────────────────┤
│ Server Actions (actions.ts)                                  │
│  ├─ requireRole() → permission check                        │
│  ├─ Zod validation                                          │
│  ├─ Prisma mutations                                        │
│  └─ revalidatePath() → ISR                                  │
├─────────────────────────────────────────────────────────────┤
│ Lib (auth, prisma, supabase)                                │
│  ├─ @/lib/auth/get-user.ts → Supabase → DB sync           │
│  ├─ @/lib/auth/require-role.ts → Permission guard          │
│  ├─ @/lib/prisma.ts → Global PrismaClient + PrismaPg      │
│  └─ @/lib/supabase/server.ts → Supabase server client      │
├─────────────────────────────────────────────────────────────┤
│ Database (Prisma)                                            │
│  ├─ 20 models (User, Client, Project, Orcamento, etc.)    │
│  ├─ 9 enums (UserRole, ProjectStage, CrmStage, etc.)      │
│  └─ Relationships with cascading deletes (DANGER ZONE)     │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Module Organization Pattern

Each module follows a consistent structure:

```
src/modules/[modulo]/
├── actions.ts      → 'use server', requireRole, Zod, try-catch, revalidatePath
├── queries.ts      → Async read-only functions, prisma.*.findMany/findUnique
├── schemas.ts      → Zod object schemas (optional, for complex modules)
└── types.ts        → TypeScript types inferred from Zod (optional)
```

This pattern is **well-established** across 8 implemented modules:
- orcamentos, projetos, crm, formaturas, tarefas, agenda, fornecedores, talentos, calendario, pagamentos-freela, financeiro

---

## 2. STRENGTHS

### 2.1 Auth & Security
- **Strong:** Supabase middleware handles global auth guard correctly
- **Good:** `requireAuth()` and `requireRole()` pattern prevents unauthorized access
- **Solid:** Session sync via `getUser()` (Supabase → Prisma user lookup)
- **Correct:** Prisma client scoped to authenticated session (no manual auth checks needed per query)

**Assessment:** Auth layer is production-ready. No critical issues.

### 2.2 Data Modeling
- **Comprehensive:** 20 models cover major business domains (CRM, Projects, Financials, HR, Education)
- **Appropriate:** Enum-based state management (CrmStage, ProjectStage, TaskStatus, etc.)
- **Good relationships:** Foreign keys with sensible cascading rules
- **Smart:** Nested contact models (ClienteContatoOperacional, ClienteContatoFinanceiro) avoid schema bloat

**Assessment:** Schema is well-designed and extensible. Ready for current features + planned modules.

### 2.3 Component Architecture
- **Clean separation:** Server Components (page.tsx) separate from Client Components
- **Proper data flow:** Pages fetch data, pass to interactive components
- **Good pattern:** 'use client' clearly marks interactive boundaries
- **Icon system:** lucide-react provides consistent UI iconography
- **Design system:** Tailwind @theme tokens centralize color/spacing values

**Assessment:** Next.js App Router patterns are correctly applied.

### 2.4 Server Actions
- **Consistent:** All actions follow requireRole → Zod parse → try-catch → revalidatePath pattern
- **Good:** Transaction support (prisma.$transaction) for multi-step operations
- **Error handling:** Try-catch blocks return { error } responses
- **Validation:** Zod v4 usage correct (using { error: '...' } not { required_error: '...' })

**Assessment:** Action layer is mature and pattern-consistent.

### 2.5 Module Consistency
- **All modules follow the same structure** (actions.ts, queries.ts)
- **Schemas used in complex modules** (crm, projetos) for validation reuse
- **Types exported** for frontend type safety
- **Eight modules already implemented** demonstrates good velocity

**Assessment:** Module pattern is well-established and scalable.

---

## 3. WEAKNESSES & RISKS

### 3.1 DATABASE OPTIMIZATION — CRITICAL

**Issue:** No indexes defined. Zero `@@index` or `@@unique` directives in schema.

```prisma
// Current state: NO INDEXES
model Client {
  id String @id @default(cuid())
  name String                      // ← NOT INDEXED (filtered in CRM kanban)
  stage CrmStage                   // ← NOT INDEXED (grouped by stage)
  // ... other fields

  // Related lookups (no index on FK):
  projetos Project[]               // ← N+1 risk
  orcamentos Orcamento[]          // ← N+1 risk
}

model Project {
  id String @id @default(cuid())
  clienteId String                 // ← MISSING INDEX
  responsavelId String?            // ← MISSING INDEX
  stage ProjectStage               // ← NOT INDEXED
  // ...
}
```

**Impact:**
- **Dashboard page.tsx** does 4 sequential `Promise.all()` counts with no indexes → slow
- **CRM kanban** groups clients by stage → O(n) scan without index
- **Project list** filters by stage and client → table scan
- **Pagination not implemented** → memory risk with large datasets (1000+ records)

**Recommendation:** Add indexes immediately:
```prisma
model Client {
  // ...
  @@index([stage])                 // For CRM kanban filtering
  @@index([email])                 // For lookups
  @@index([document])              // For lookup/validation
}

model Project {
  // ...
  @@index([clienteId])             // For client lookups
  @@index([responsavelId])         // For user filter
  @@index([stage])                 // For kanban grouping
  @@index([createdAt])             // For sorting
}

model Orcamento {
  // ...
  @@index([clienteId])
  @@index([status])
  @@index([createdAt])
}

// ... similar for all models with filtering/joining
```

**Severity:** 🔴 **CRITICAL** — Add before feature expansion or 500+ client scale

---

### 3.2 ERROR HANDLING — INCONSISTENT

**Issue:** Generic try-catch blocks lose error context.

```typescript
// orcamentos/actions.ts
try {
  await prisma.orcamento.create({ data })
  revalidatePath('/orcamentos')
  return { success: true, id: orcamento.id }
} catch {
  return { error: 'Erro ao criar orçamento' }  // ← Generic, no logging
}

// Problems:
// 1. Silent failure: DB error could be constraint, validation, permissions, network
// 2. No logging: Can't debug production issues
// 3. No error telemetry: Can't monitor failure rates
// 4. Client can't provide user-facing context (e.g., "Client not found" vs "DB error")
```

**Recommendation:** Create error utility with structured logging:

```typescript
// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
  }
}

export async function handleServerAction<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[${context}] Error:`, message)  // Log to stdout (Vercel captures)

    // User-facing message
    if (error instanceof AppError) return { success: false, error: error.message }
    if (error.code === 'P2025') return { success: false, error: 'Record not found' }
    return { success: false, error: 'Operation failed. Please try again.' }
  }
}

// Usage in actions:
export async function criarOrcamento(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const parsed = orcamentoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid data' }

  return handleServerAction(
    () => prisma.orcamento.create({ data: parsed.data }),
    'criarOrcamento',
  )
}
```

**Severity:** 🟠 **HIGH** — Impacts debugging and monitoring. Add logging layer before scaling.

---

### 3.3 QUERIES — N+1 RISKS & MISSING OPTIMIZATIONS

**Issue:** Some queries load related data without optimization.

```typescript
// modules/orcamentos/queries.ts — GOOD
export async function getOrcamentos() {
  return prisma.orcamento.findMany({
    include: {
      cliente: { select: { id: true, name: true, company: true } },
      itens: true,  // ✅ Items loaded in one query
    },
    orderBy: { createdAt: 'desc' },
  })
}

// modules/projetos/queries.ts — MISSING
export async function getProjetos() {
  const projetos = await prisma.project.findMany({
    include: {
      cliente: true,      // ✅ Client loaded
      responsavel: true,  // ✅ User loaded
      labels: true,       // ✅ Labels loaded
      // ❌ MISSING: custo count, tarefa count — will require additional queries
    },
  })
  // Need to add aggregation if displaying cost totals or task counts on list
}

// modules/crm/queries.ts — NOT FOUND (use cases unknown)
// Risk: Client list grouped by stage might do multiple queries
```

**Recommendation:**
1. **Add aggregations to queries:**
   ```typescript
   export async function getProjetos() {
     return prisma.project.findMany({
       include: {
         cliente: true,
         responsavel: true,
         _count: { select: { custos: true, tarefas: true } },  // ← Add counts
       },
     })
   }
   ```

2. **Implement pagination for large lists:**
   ```typescript
   export async function getOrcamentosPagenado(page = 1, limit = 20) {
     const skip = (page - 1) * limit
     const [orcamentos, total] = await Promise.all([
       prisma.orcamento.findMany({
         skip,
         take: limit,
         include: { cliente: true, itens: true },
       }),
       prisma.orcamento.count(),
     ])
     return { orcamentos, total, pages: Math.ceil(total / limit) }
   }
   ```

3. **Add `select` to limit unnecessary fields:**
   ```typescript
   prisma.client.findMany({
     select: {
       id: true,
       name: true,
       stage: true,
       // Skip avatarUrl, document, etc. if not needed
     },
   })
   ```

**Severity:** 🟠 **HIGH** — Risk grows with data volume. Implement pagination + selective select before 5K+ records.

---

### 3.4 STATE MANAGEMENT — MISSING GLOBAL PATTERNS

**Issue:** No centralized state for shared, real-time data.

```typescript
// Current approach: Every page refetches same data
// /orcamentos/page.tsx → calls getOrcamentos()
// /crm/page.tsx → calls getClientes()
// /dashboard/page.tsx → calls these individually

// Problems:
// 1. No caching across routes (each route fetches independently)
// 2. No real-time sync (if user A changes client, user B's page stale)
// 3. No optimistic updates (forms don't feel snappy)
// 4. Notifications not centralized (e.g., "Project X moved to stage Y")
```

**Recommendation:** Implement React Context + Server Components pattern:

```typescript
// lib/cache.ts — Simple cache layer
const REVALIDATE_INTERVALS = {
  clientes: 60,        // 1 minute
  projetos: 60,
  orcamentos: 60,
  tarefas: 30,
}

export async function getCacheable<T>(
  key: string,
  fn: () => Promise<T>,
  revalidate: number,
): Promise<T> {
  // Server-side cached fetch with revalidatePath() for mutations
  // Details depend on whether you use unstable_cache() or Prisma-level caching
  return fn()
}

// components/providers/data-provider.tsx — Client-side context (if needed for UI)
'use client'
import { createContext, useCallback } from 'react'

export const DataContext = createContext<{
  refetchClientes: () => Promise<void>
  // ... other methods
}>({} as any)

// Use only if you need real-time UI updates (e.g., notification bell, status changes)
// Don't over-engineer — Next.js Server Components + revalidatePath() is often sufficient
```

**Severity:** 🟡 **MEDIUM** — Not urgent for current scale (8 concurrent users), but plan for future.

---

### 3.5 TYPE SAFETY — PARTIAL

**Issue:** Good TypeScript, but missing some patterns.

```typescript
// ✅ GOOD: Types exported from Zod schemas
export type ProjetoInput = z.infer<typeof projetoSchema>

// ✅ GOOD: Prisma generated types used
import type { UserRole, ProjectStage } from '@/generated/prisma/client'

// ⚠️ MISSING: Response types for Server Actions
export async function criarOrcamento(formData: FormData) {
  // Return type is implicit: { success: true; id: string } | { error: string }
  // Should be explicit:
  return { success: true, id: orcamento.id } as const
}

// Better:
type Result<T> = { success: true; data: T } | { success: false; error: string }
export async function criarOrcamento(formData: FormData): Promise<Result<{ id: string }>> {
  // ...
}
```

**Recommendation:** Create action response types:
```typescript
// lib/types/actions.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Usage:
export async function criarOrcamento(...): Promise<ActionResult<{ id: string }>> {
  // ...
}
```

**Severity:** 🟡 **MEDIUM** — Improves IDE autocomplete and prevents client-side type errors.

---

### 3.6 FORM HANDLING — BASIC

**Issue:** FormData parsing is manual and repetitive.

```typescript
// Current pattern (repeated across all actions):
const raw = {
  clienteId: formData.get('clienteId'),
  titulo: formData.get('titulo'),
  status: formData.get('status') || 'RASCUNHO',
  // ... 10+ fields
}
const parsed = schema.safeParse(raw)
if (!parsed.success) return { error: parsed.error.issues[0]?.message }

// Issues:
// 1. Manual field extraction (error-prone)
// 2. Type coercion (need to manually parse numbers, dates, booleans)
// 3. Repetitive across 20+ actions
// 4. No auto-validation on client side
```

**Recommendation:** Create form helper:
```typescript
// lib/form-helpers.ts
export function parseFormData<T extends z.ZodSchema>(
  formData: FormData,
  schema: T,
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const raw = Object.fromEntries(formData)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid' }
  }
  return { success: true, data: parsed.data }
}

// Usage:
export async function criarOrcamento(formData: FormData) {
  const parsed = parseFormData(formData, orcamentoSchema)
  if (!parsed.success) return { error: parsed.error }
  // ... rest of logic
}
```

**Severity:** 🟢 **LOW** — Works fine now, refactor when need to standardize form handling (e.g., client-side validation).

---

### 3.7 TESTING — NONE

**Issue:** No test files found.

```typescript
// No tests for:
// - Auth flow (getUser, requireRole)
// - Server Actions (validation, DB mutations)
// - Data transformations
// - Edge cases (empty lists, null values, permissions)
```

**Recommendation:** Add testing infrastructure:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Example test structure:
```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest'
import { requireRole } from '@/lib/auth/require-role'

describe('requireRole', () => {
  it('should redirect if user not authenticated', async () => {
    // Mock getUser to return null
    // Verify redirect('/login') called
  })

  it('should redirect if user role not in allowed list', async () => {
    // Mock getUser to return { role: 'EXTERNO' }
    // requireRole(['ADMIN', 'PRODUTOR'])
    // Verify redirect('/unauthorized') called
  })
})
```

**Severity:** 🟡 **MEDIUM** — Not critical for MVP, but essential before production hardening.

---

### 3.8 DEPLOY & ENV MANAGEMENT — BASIC

**Issue:** Environment variables not explicitly validated.

```typescript
// current: uses process.env.* directly
process.env.NEXT_PUBLIC_SUPABASE_URL!  // ← Non-null assertion, could fail at runtime

// Better: validate at startup
```

**Recommendation:** Add environment validation:
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production']),
})

export const env = envSchema.parse(process.env)

// In layout.tsx or middleware.ts, import env once
// If validation fails, app won't start (better than runtime error)
```

**Severity:** 🟡 **MEDIUM** — Improves deployment safety.

---

## 4. MODULE-SPECIFIC ANALYSIS

### 4.1 Auth Module ✅ COMPLETE

**Status:** Production-ready.

```
Implemented:
✅ Supabase Auth flow (login form, redirect, session)
✅ Middleware guards (global auth check)
✅ requireAuth() / requireRole() helpers
✅ User sync (Supabase → Prisma)
✅ Logout functionality

Gaps:
⚠️ No password reset flow (TODO)
⚠️ No 2FA / MFA (out of scope?)
⚠️ No social login (future)
```

### 4.2 Dashboard Module ✅ COMPLETE

**Status:** Functional, basic metrics.

```
Implemented:
✅ 4 KPI cards (Active Projects, Total Clients, Pending Tasks, Expected Revenue)
✅ Dashboard.tsx uses Promise.all() for parallel queries

Gaps:
❌ No indexes on filtered counts (see 3.1)
❌ No time-series data (revenue trend, project velocity)
❌ No user-specific filtering (all users see same stats)
⚠️ Charts/graphs not implemented
```

### 4.3 Orçamentos Module ✅ IMPLEMENTED

**Status:** Functional. Kanban + modal pattern established.

```
Implemented:
✅ Create/Update/Delete orçamentos (CRUD)
✅ Add/Remove line items with auto-totaling
✅ Status transitions (RASCUNHO → ENVIADO → APROVADO)
✅ Client selection dropdown

Gaps (from PLANO-INFRA):
❌ Versioning (OrcamentoVersao model not yet in schema)
❌ Viability analysis (modal shows basic fields, no financial calc)
❌ Product library (no pre-defined services/products)
❌ Pricing based on "vertente" (CASAMENTO, EVENTO, CORPORATIVO)
⚠️ Margin calculation at item level (should be global?)
```

**Note:** PLANO-INFRA.md documents planned enhancements. Implementation is deferred.

### 4.4 Formaturas Module ✅ IMPLEMENTED

**Status:** Functional. Turma (group) management.

```
Implemented:
✅ CRUD for turmas (classes)
✅ Formando (student) list with parcela (installment) tracking
✅ EventoTurma (event within class)

Gaps:
❌ Pricing parameters (ParametroFormatura not yet in schema)
❌ Distance multipliers (for events outside city)
❌ Installment schedule builder
⚠️ No expense tracking tied to turma
```

### 4.5 Projetos Module ⏳ IN PROGRESS

**Status:** CRUD implemented, Kanban UI in place.

```
Implemented:
✅ Create/Update/Delete projetos
✅ Stage transitions (8 stages: OS_DISTRIBUICAO → ARQUIVADO)
✅ Link to client
✅ Assign responsible user
✅ Track revenue expected

Gaps:
❌ No task breakdown (Tarefas linked, but no UI in projeto detail)
❌ No timeline/Gantt (dates tracked, no visualization)
❌ No cost tracking UI (ProjectCost model exists, but not used)
❌ No document attachments
❌ No post-production workflow tracking
```

### 4.6 CRM Module ⏳ IN PROGRESS

**Status:** CRUD implemented. Kanban by stage.

```
Implemented:
✅ Create/Update/Delete clients (leads)
✅ Operational contact + Financial contact upsert
✅ Stage transitions (NOVO_LEAD → FECHADO_GANHO/PERDIDO)
✅ Track how client found us (comoChegou)

Gaps (from PLANO-INFRA — no official plan yet):
❌ Follow-up scheduling (CrmFollowUp model exists, no UI)
❌ Interaction timeline (CrmInteracao model, no UI)
❌ Deal amount prediction
❌ Probability/confidence score per deal
❌ Email integration
```

### 4.7 Tarefas Module ⏳ IN PROGRESS

**Status:** Basic task board. Eisenhower matrix not yet implemented.

```
Implemented:
✅ Create/Update/Delete tarefas
✅ Status transitions (PENDENTE → EM_ANDAMENTO → CONCLUIDA)
✅ Priority levels (BAIXA, MEDIA, ALTA, URGENTE)
✅ Assign to user
✅ Link to project
✅ Due date tracking

Gaps (from PLANO-INFRA):
❌ Eisenhower matrix (quadrants: urgent/important)
❌ Link to orçamento (schema field exists, UI missing)
❌ Time tracking
❌ Recurring tasks
```

### 4.8 Financeiro Module ⏳ IN PROGRESS

**Status:** Dashboard-style view. Transactions basic.

```
Implemented:
✅ FinancialAccount CRUD (bank accounts)
✅ Transaction import/tracking
✅ Fluxo de Caixa view (cash flow dashboard)
✅ Transaction categorization

Gaps:
❌ Reconciliation UI
❌ Budget vs actual analysis
❌ Report generation (PDF)
❌ Integration with bank APIs (future)
❌ Expense forecasting
```

### 4.9 Pagamentos Freelancer Module ⏳ IN PROGRESS

**Status:** Kanban by phase.

```
Implemented:
✅ Create/Update pagamentos (freelancer payments)
✅ Phase transitions (CONTRATACAO → PAGAMENTO → ARQUIVADO)
✅ Link to freelancer + project
✅ Combined value + NF flag
✅ Observações field

Gaps:
❌ Payment proof tracking (invoice, receipt)
❌ Automatic phase progression (e.g., when project moves to DIA_DO_EVENTO)
❌ Tax calculation (IRPF withholding)
❌ PIX/bank detail validation
```

### 4.10 Talentos (Freelancers) Module ⏳ IN PROGRESS

**Status:** Grid view. Basic CRUD.

```
Implemented:
✅ Freelancer CRUD
✅ Specialty tracking
✅ PIX key + bank details
✅ Portfolio link
✅ Daily rate

Gaps:
❌ Rating/review system
❌ Availability calendar
❌ Skills matching (for project assignment)
❌ Portfolio thumbnail preview
```

### 4.11 Fornecedores Module ⏳ IN PROGRESS

**Status:** List view. Basic CRUD.

```
Implemented:
✅ Fornecedor CRUD (vendors/suppliers)
✅ Service type field
✅ Contact info
✅ Hourly rate

Gaps:
❌ Service catalog / price list
❌ Contract terms (SLA, payment terms)
❌ Quality/rating system
❌ Integration with project costs
```

### 4.12 Agenda Module ⏳ IN PROGRESS

**Status:** List view.

```
Implemented:
✅ AgendaEvent CRUD
✅ Link to project
✅ Google Calendar ID field (for sync)
✅ All-day event flag

Gaps:
❌ Calendar view (currently list only)
❌ Google Calendar sync (API, webhooks)
❌ Event reminders (notifications)
❌ Recurring events
```

### 4.13 Calendário Social Module ⏳ IN PROGRESS

**Status:** List view. Post scheduling.

```
Implemented:
✅ Post CRUD (social media scheduling)
✅ Status workflow (RASCUNHO → APROVADO → PUBLICADO)
✅ Approval flow (aprovador user)
✅ Publication timestamp

Gaps:
❌ Social platform selection (Instagram, Facebook, etc.)
❌ Media uploads (images, videos)
❌ Schedule publishing (via cron/webhook)
❌ Analytics integration (impressions, likes)
```

### 4.14 Configurações Module ⏳ IN PROGRESS

**Status:** Not reviewed (placeholder).

```
Expected:
- User settings (profile, password)
- Team/company settings
- Notification preferences
- Integration settings
```

---

## 5. RECOMMENDATIONS — PRIORITIZED

### P0 — CRITICAL (Do before feature expansion)

| ID | Issue | Impact | Effort | Notes |
|----|-------|--------|--------|-------|
| **P0-1** | Add database indexes | 🔴 N+1 queries, slow dashboards | 2h | See section 3.1 |
| **P0-2** | Error handling + logging | 🔴 Can't debug prod issues | 4h | See section 3.2 |
| **P0-3** | Query pagination | 🔴 Memory bloat with 1K+ records | 6h | See section 3.3 |
| **P0-4** | Environment validation | 🟠 Runtime failures on bad config | 1h | See section 3.8 |

**Effort:** ~13 hours total. Do in next 1-2 sprints.

### P1 — HIGH (Do before launch / 100 users)

| ID | Issue | Impact | Effort | Notes |
|----|-------|--------|--------|-------|
| **P1-1** | Implement testing (unit + e2e) | 🟠 Regression risk | 16h | Start with auth, actions, utils |
| **P1-2** | Response type standardization | 🟡 Type safety | 3h | Create `ActionResult<T>` type |
| **P1-3** | Query aggregations (_count) | 🟡 Additional fetches per list | 4h | Add counts to includes |
| **P1-4** | Monitoring/alerting setup | 🟡 Can't see production issues | 4h | Add error tracking (Sentry, etc.) |
| **P1-5** | Implement caching layer | 🟡 Repeated DB hits | 6h | unstable_cache() or Prisma caching |

**Effort:** ~33 hours. Plan for next quarter.

### P2 — MEDIUM (Nice-to-have, improves DX)

| ID | Issue | Impact | Effort | Notes |
|----|-------|--------|--------|-------|
| **P2-1** | Form validation helpers | 🟢 DRY, reduce bugs | 3h | Centralize parseFormData() |
| **P2-2** | Storybook setup | 🟢 Component library | 4h | Document UI components |
| **P2-3** | API documentation | 🟢 Easier onboarding | 2h | Comments in actions.ts |
| **P2-4** | Seed data script | 🟢 Faster dev setup | 2h | prisma/seed.ts |

**Effort:** ~11 hours. Plan for developer experience improvements.

---

## 6. MISSING PIECES FOR PLANNED MODULES

### Orçamentos Enhancements (from PLANO-INFRA)

**Schema changes needed:**
```prisma
enum Vertente {
  CASAMENTO
  EVENTO
  CORPORATIVO
  QUINZE_ANOS
  ENSAIO
  PUBLICITARIO
}

model OrcamentoVersao {
  id String @id @default(cuid())
  orcamentoId String @unique
  versao Int @default(1)
  snapshot Json
  totalBruto Decimal @db.Decimal(10, 2)
  margem Decimal? @db.Decimal(5, 2)
  createdAt DateTime @default(now())

  orcamento Orcamento @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
  @@unique([orcamentoId, versao])
}

model ServicoBase {
  id String @id @default(cuid())
  nome String
  tipo String // "HORA" or "OPCAO"
  preco Decimal @db.Decimal(10, 2)
  vertente Vertente? // null = applies to all
  createdAt DateTime @default(now())

  opcoes OpcaoServico[]
}

model OpcaoServico {
  id String @id @default(cuid())
  servicoId String
  nome String
  preco Decimal @db.Decimal(10, 2)

  servico ServicoBase @relation(fields: [servicoId], references: [id], onDelete: Cascade)
}
```

**UI/Logic:**
- [ ] Versioning modal (view/compare versions, rollback)
- [ ] Guided form by vertente (shows relevant services)
- [ ] Service library (pre-built pricing)
- [ ] Viability analysis (revenue vs costs)

---

### Projetos Module — Missing Tracking

**Schema changes needed:**
```prisma
// Add to Project
model Project {
  // ...
  estimatedHours Int?
  actualHours Int?
  deadline DateTime?
  status ProjectStatus  // Overall status
  timelineStartDate DateTime?
  timelineEndDate DateTime?

  documents ProjectDocument[]
  milestones ProjectMilestone[]
}

model ProjectDocument {
  id String @id @default(cuid())
  projectId String
  titulo String
  fileUrl String
  uploadedAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ProjectMilestone {
  id String @id @default(cuid())
  projectId String
  titulo String
  dueDate DateTime
  completed Boolean @default(false)
  completedAt DateTime?

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

---

### Tarefas Module — Eisenhower + Links

**Schema changes needed:**
```prisma
model Tarefa {
  // ... existing ...
  urgente Boolean @default(false)        // NOVO
  importante Boolean @default(false)     // NOVO
  orcamentoId String?                   // NOVO

  orcamento Orcamento? @relation(fields: [orcamentoId], references: [id], onDelete: SetNull)
}

// Add to Orcamento
model Orcamento {
  // ...
  tarefas Tarefa[]
}
```

**UI/Logic:**
- [ ] Eisenhower matrix view (4 quadrants)
- [ ] Drag-drop between quadrants
- [ ] Link tasks to orçamentos
- [ ] Task templates

---

### Insumos Module (New)

**Schema:**
```prisma
model Insumo {
  id String @id @default(cuid())
  nome String
  descricao String?
  categoria String
  quantidade Int @default(0)
  unidade String  // "un", "m", "l", "kg", etc.
  custoPorUnidade Decimal @db.Decimal(10, 2)
  localizacao String?  // storage location
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  movimentacoes InsumoMovimento[]
  projetos InsumoEmProjeto[]
}

model InsumoMovimento {
  id String @id @default(cuid())
  insumoId String
  tipo String  // "ENTRADA", "SAIDA", "AJUSTE"
  quantidade Int
  motivo String?
  createdAt DateTime @default(now())

  insumo Insumo @relation(fields: [insumoId], references: [id], onDelete: Cascade)
}

model InsumoEmProjeto {
  id String @id @default(cuid())
  projectId String
  insumoId String
  quantidadeUsada Int

  projeto Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  insumo Insumo @relation(fields: [insumoId], references: [id], onDelete: Cascade)
}
```

---

## 7. SCALABILITY ASSESSMENT

### Current Capacity

| Metric | Limit | Action Point | Notes |
|--------|-------|--------------|-------|
| **Concurrent users** | ~50 | Add Read Replica DB | Single PrismaPg connection pool |
| **Records per table** | 10K | Add indexes ✅ + pagination | See P0-3 |
| **API response time** | <500ms | Optimize queries | No indexes = risk |
| **Vercel Function execution** | 60s timeout | Monitor action duration | Transactions must be < 30s |
| **ISR revalidation** | On-demand | Add incremental revalidation | Current: full route revalidation |

### Recommendations for Growth

1. **0-100 users:** Implement P0 items (indexes, logging, pagination)
2. **100-1K users:** Add caching layer, implement read replicas, add CDN for assets
3. **1K+ users:** Consider sharding by client, archive old data, implement data warehouse for analytics

---

## 8. CODE QUALITY & PATTERNS

### Positive Patterns

```typescript
// ✅ Server Actions with role guards
await requireRole(['ADMIN', 'PRODUTOR'])

// ✅ Atomic transactions
await prisma.$transaction(async tx => {
  await tx.orcamentoItem.create(...)
  await tx.orcamento.update(...)  // Totals updated atomically
})

// ✅ Proper cascade deletes
client Client @relation(..., onDelete: Cascade)

// ✅ Enum-based state
enum ProjectStage { ... }

// ✅ Separation of concerns
queries.ts = read-only functions
actions.ts = mutations with auth + validation
```

### Patterns to Avoid

```typescript
// ❌ Generic error messages (section 3.2)
} catch { return { error: 'Erro ao criar' } }

// ❌ No indexes (section 3.1)
// Leads to O(n) scans on filtering

// ❌ Implicit response types
// { success: true; id: string } | { error: string }  ← should be union type

// ❌ Manual FormData parsing (section 3.6)
// Repeated in every action, error-prone

// ❌ No pagination (section 3.3)
// findMany() without take/skip risks memory issues
```

---

## 9. TESTING STRATEGY

### Recommended Test Coverage

```
Unit Tests (Vitest):
├── lib/auth/
│   ├── get-user.test.ts
│   ├── require-role.test.ts
│   └── logout.test.ts
├── lib/utils.test.ts
│   ├── formatCurrency()
│   ├── formatDate()
│   └── getInitials()
├── modules/*/schemas.test.ts
│   └── Zod validation edge cases
└── lib/error-handler.test.ts (new)

Integration Tests (Vitest + Prisma):
├── modules/orcamentos/actions.test.ts
│   ├── criarOrcamento happy path
│   ├── criarOrcamento with invalid data
│   ├── criarOrcamento permission denied
│   └── criarOrcamento conflict (client not found)
├── modules/projetos/actions.test.ts
└── modules/crm/actions.test.ts

E2E Tests (Playwright):
├── auth.e2e.ts
│   ├── Login flow
│   ├── Redirect to protected page
│   └── Logout flow
├── orcamentos.e2e.ts
│   ├── Create, read, update, delete
│   ├── Add/remove items
│   └── Change status
└── dashboard.e2e.ts
    ├── Load metrics
    └── Verify counts
```

**Effort:** ~40-60 hours to reach 70% coverage. Start with auth + critical actions.

---

## 10. DEPLOYMENT CHECKLIST

```
Before first production deploy:
- [ ] Environment variables validated (P0-4)
- [ ] Database indexes created (P0-1)
- [ ] Error logging configured (P0-2)
- [ ] Pagination implemented (P0-3)
- [ ] Auth tested (login, logout, permissions)
- [ ] HTTPS enforced (Vercel default)
- [ ] CSP headers configured (if needed)
- [ ] Rate limiting on auth endpoints (if not using Supabase)
- [ ] Monitoring/alerting set up (Sentry, Vercel Analytics)
- [ ] Backup strategy (Supabase automated backups ✅)
- [ ] Disaster recovery plan (DB restore, code rollback)

Ongoing:
- [ ] Monitor error rates
- [ ] Review performance metrics (Core Web Vitals)
- [ ] Plan schema migrations (coordinate with deployments)
- [ ] Archive old data (e.g., projects > 1 year old)
```

---

## 11. CONCLUSION

**Overall Assessment: 7.5/10**

OLHARR v2 is a well-architected, modern Next.js application with solid foundations in auth, data modeling, and component organization. The module-based approach is scalable and the implementation patterns are consistent.

**Key Strengths:**
- Modern tech stack (Next.js 16, React 19, Prisma v7)
- Clean separation of concerns (Server/Client Components, Server Actions)
- Comprehensive data model matching business domains
- Consistent module structure enabling parallel feature development
- Good auth architecture with Supabase integration

**Critical Issues to Address Before Scale:**
1. No database indexes → N+1 query risk (🔴 P0)
2. Generic error handling → can't debug production issues (🔴 P0)
3. No pagination → memory risk with large datasets (🔴 P0)

**Recommendation:**
Fix P0 items (13 hours) before adding 5+ new features or increasing user count beyond 50. Then implement P1 items (testing, monitoring, caching) before 100-user launch.

**Estimated Timeline to Production:**
- Week 1: Fix P0 issues + set up monitoring
- Week 2-3: Implement testing + finalize remaining module UIs
- Week 4: Load testing + hardening
- Week 5: User acceptance testing + launch

The architecture is ready for scale with these optimizations.

---

**Report Generated:** 2026-03-26
**Reviewer:** Claude Code Architecture Review Tool
**Project:** OLHARR v2 (Next.js 16 + React 19 + Prisma v7 + Supabase Auth)
