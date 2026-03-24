# OLHARR v2 — Prompt Master para Claude Code

> Use este prompt como contexto inicial ao abrir sessões no Claude Code para implementar o OLHARR v2.
> Copie e cole no início da sessão, ou referencie como `@modelos-atuais/PROMPT-CLAUDE-CODE.md`.

---

## 1. CONTEXTO DO PROJETO

OLHARR é um sistema de gestão para produtoras audiovisuais (foto e vídeo). Estamos recriando o app do zero com stack moderna. O planejamento visual está pronto — agora precisamos implementar tela a tela.

**Stack:**
- Next.js 16.2 (App Router, Turbopack, Server Actions)
- React 19 + TypeScript strict
- Tailwind v4 (sem tailwind.config.js — configuração via `@theme` no globals.css)
- Prisma v7 — client em `@/generated/prisma/client`, instância global em `@/lib/prisma`
- Supabase Auth (email/senha) + PostgreSQL (us-east-1)
- Zod v4 para validação
- lucide-react para ícones

**Deploy:** Vercel (https://olharr.vercel.app) + Supabase PostgreSQL

---

## 2. REGRAS CRÍTICAS — NÃO VIOLAR

Estas regras foram aprendidas por tentativa e erro. Quebrá-las causa erros de build ou runtime.

1. **Imports Prisma**: SEMPRE de `@/generated/prisma/client` — NUNCA `@prisma/client`
2. **PrismaClient**: NUNCA instanciar diretamente — importar `prisma` de `@/lib/prisma`
3. **Server Actions**: sempre `requireRole()` ou `requireAuth()` primeiro, validar com Zod, try-catch, `revalidatePath`
4. **Zod v4**: usar `{ error: '...' }` em vez de `{ required_error: '...' }`
5. **Sem @base-ui/react**: não instalado — usar HTML nativo + Tailwind
6. **Tailwind v4**: sem `tailwind.config.js` — tokens definidos via `@theme` no `globals.css`
7. **Middleware**: usa `middleware.ts` na raiz do src (aviso de deprecação — ignorar, ainda funciona)
8. **Next.js 16**: LEIA `node_modules/next/dist/docs/` antes de usar APIs novas — pode ter breaking changes vs. seu training data
9. **prisma.config.ts**: só tem `url` no datasource (adapter não é suportado no defineConfig v7)
10. **SSL em produção**: `{ rejectUnauthorized: false }` em `lib/prisma.ts`

---

## 3. DESIGN SYSTEM

### Tokens (definidos em globals.css via @theme)

```
Background:     #F0EDFF     → bg-background
Surface:        #FFFFFF     → bg-surface
Surface-2:      #F7F5FF     → bg-surface-2
Border:         #E8E3F5     → border-border
Foreground:     #1C1730     → text-foreground
Muted:          #676767     → text-muted-foreground
Subtle:         #9B96B0     → text-subtle
Primary:        #8B5CF6     → bg-primary / text-primary
Accent:         #1E7FCD     → bg-accent
Success:        #22C55E     → text-success
Warning:        #F59E0B     → text-warning
Danger:         #EF4444     → text-danger
```

### Radius
```
--radius-sm: 4px  → Badges
--radius-md: 8px  → Inputs, selects, botões
--radius-lg: 12px → Cards, modais, chips
```

### Tipografia
- Font: Poppins (Google Fonts)
- Body: 14px, line-height 1.5
- Pesos: 400 (body), 500 (labels), 600 (subtítulos), 700 (títulos), 800 (counters)
- Background global: `linear-gradient(145deg, #ede9ff, #f8f6ff 45%, #e8e3ff)` com `background-attachment: fixed`

### Sidebar
- Glassmorphism: `rgba(255,255,255,.55)` + `backdrop-filter: blur(16px)`
- Colapsada: 68px | Expandida: 240px (hover)
- Ícones: lucide-react

### Padrões de UI
- Cards: `bg-surface`, `border-border`, `rounded-lg` (12px), hover com shadow primary
- Modais: max-width 1100px, 3 colunas (5:4:3), overlay com backdrop-blur
- Kanban: colunas com cor de borda no topo, cards com border-left colorido
- Chips: rounded-full, border, hover com cor primary
- Formulários: label uppercase 10px, input com bg transparent e border on hover

---

## 4. ESTRUTURA DE ARQUIVOS

```
src/
├── app/
│   ├── (auth)/login/        → Página de login
│   ├── (dashboard)/         → Layout autenticado (sidebar + main)
│   │   ├── projetos/        → Kanban de projetos
│   │   ├── orcamentos/      → Kanban + modal de orçamentos
│   │   │   └── [id]/        → Detalhe do orçamento
│   │   ├── crm/             → Pipeline de clientes
│   │   ├── tarefas/         → Board de tarefas
│   │   ├── financeiro/      → Dashboard financeiro
│   │   │   └── pagamentos-freela/ → Kanban de pagamentos
│   │   ├── talentos/        → Grid de freelancers
│   │   ├── fornecedores/    → Lista de fornecedores
│   │   ├── formaturas/      → Módulo de formaturas
│   │   │   └── [id]/        → Detalhe da turma
│   │   ├── agenda/          → Lista de eventos
│   │   ├── calendario/      → Calendário social
│   │   ├── fluxo-caixa/     → Fluxo de caixa
│   │   └── configuracoes/   → Configurações
│   ├── layout.tsx           → Root layout
│   └── globals.css          → Design tokens
├── components/
│   ├── shared/sidebar.tsx   → Sidebar compartilhada
│   └── [modulo]/            → Componentes por módulo
├── modules/
│   └── [modulo]/
│       ├── actions.ts       → Server Actions (mutations)
│       ├── queries.ts       → Queries ao banco
│       ├── schemas.ts       → Schemas Zod
│       └── types.ts         → Tipos TypeScript
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
- **Server Actions** = funções em actions.ts → 'use server', requireAuth, Zod, try-catch, revalidatePath

---

## 5. DOCUMENTOS DE REFERÊNCIA

Antes de implementar qualquer módulo, LEIA os seguintes documentos:

| Documento | Path | Conteúdo |
|-----------|------|----------|
| PLANO-INFRA | `modelos-atuais/PLANO-INFRA.md` | Plano master — schema, fases, componentes, checklist |
| ADR-001 | `modelos-atuais/ADR-001-cost-builder.md` | Decisão arquitetural do Cost Builder |
| Preview Orçamentos | `modelos-atuais/preview-orcamentos.html` | Layout interativo do módulo Orçamentos |
| Preview Projetos | `modelos-atuais/preview-projetos.html` | Layout interativo do módulo Projetos (kanban + modal + aba Equipe) |
| CLAUDE.md | `.claude/CLAUDE.md` | Contexto rápido do projeto |
| AGENTS.md | `AGENTS.md` | Aviso sobre Next.js 16 breaking changes |

> **IMPORTANTE**: Os previews HTML são a referência visual definitiva. Ao implementar componentes, o resultado deve ser visualmente idêntico ao preview.

---

## 6. SCHEMA PRISMA — ESTADO ATUAL vs. PLANEJADO

### O que EXISTE hoje (schema.prisma):
- Orcamento com OrcamentoItem (modelo simples: descricao, quantidade, valorUnit)
- Project com 8 stages no enum ProjectStage
- Tarefa sem campos urgente/importante/orcamentoId
- Freelancer com specialties[] e pagamentos
- SEM: ServicoBase, OpcaoServico, ItemCustoOrcamento, OrcamentoVersao, EquipeProjeto

### O que PRECISA ser criado (ver PLANO-INFRA.md §2 e §3B.4):

**Novos enums:**
- `Vertente`: CASAMENTO, EVENTO, CORPORATIVO, QUINZE_ANOS, ENSAIO, PUBLICITARIO
- `TipoServico`: HORA, OPCAO
- `StatusEscalacao`: PENDENTE, CONFIRMADO, CANCELADO (novo — para aba Equipe)

**Novos models:**
- `ServicoBase` — Serviços unificados (tipo HORA ou OPCAO)
- `OpcaoServico` — Opções dentro de ServicoBase tipo OPCAO
- `ItemCustoOrcamento` — Substitui OrcamentoItem (com servicoId, opcaoId, horas, custoTotal)
- `OrcamentoVersao` — Snapshots de versões da proposta
- `MultiplicadorEvento` — Multiplicadores para Evento/Corporativo (futuro)
- `EquipeProjeto` — Associação Projeto ↔ Freelancer (nova — para aba Equipe no modal de Projetos)

**Campos novos em models existentes:**
- `Orcamento`: + vertente, margemPct, relações com versoes/tarefas/ItemCustoOrcamento
- `Tarefa`: + orcamentoId, urgente, importante

**Model EquipeProjeto (novo — para aba Equipe dos Projetos):**
```prisma
enum StatusEscalacao {
  PENDENTE
  CONFIRMADO
  CANCELADO
}

model EquipeProjeto {
  id            String           @id @default(cuid())
  projectId     String
  freelancerId  String
  funcao        String           // "Fotógrafo", "Cinegrafista", "Editor"
  area          String?          // "Captação", "Pós-Produção"
  horas         Int?             // Horas alocadas
  status        StatusEscalacao  @default(PENDENTE)
  observacoes   String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  projeto    Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  freelancer Freelancer @relation(fields: [freelancerId], references: [id])

  @@unique([projectId, freelancerId])
  @@map("equipe_projetos")
}
```

---

## 7. MÓDULOS A IMPLEMENTAR (em ordem de prioridade)

### 7A. Projetos (Kanban Pipefy-style)
**Referência visual:** `modelos-atuais/preview-projetos.html`

**Componentes necessários:**
```
components/projetos/
├── projetos-kanban.tsx       → Board com 8 colunas (OS-Distribuição → Aprovado)
├── projeto-card.tsx          → Card com badge vertente, título, cliente, valor, SLA
├── projeto-modal.tsx         → Modal 3 colunas com abas
├── projeto-form-inicial.tsx  → Coluna esquerda: formulário readonly
├── projeto-checklist.tsx     → Coluna meio: fase atual + tarefas da fase
├── projeto-mover.tsx         → Coluna direita: botões de mover entre fases
├── projeto-equipe.tsx        → Aba "Equipe": freelancers escalados + escalar do banco
└── projeto-form.tsx          → Modal de criação de novo projeto
```

**Abas do modal:** Fase Atual | Atividades | Anexos | Checklists | Equipe | Comentários | Email | PDF

**Aba Equipe — funcionalidades:**
- Stats: escalados, confirmados, total horas
- Lista de membros por seção (Captação / Pós-Produção) com avatar, nome, função, horas, status
- Botão "Escalar Profissional" → painel inline com busca + filtros por função
- Resultados do banco de talentos com rating e botão "Escalar"
- Status: Confirmado (verde), Pendente (amarelo), Cancelado (vermelho)

### 7B. Orçamentos (Cost Builder)
**Referência visual:** `modelos-atuais/preview-orcamentos.html`
**Referência técnica:** `modelos-atuais/ADR-001-cost-builder.md` + `PLANO-INFRA.md §3B`

**6 fases de implementação (ver PLANO-INFRA §5):**
1. Schema & Backend (migrations, seeds, schemas.ts, types.ts)
2. Refatoração de Componentes (extrair do monolítico de 660 linhas)
3. Features Novas (versionamento + tarefas vinculadas)
4. Cost Builder (chips + form condicional + lista + total)
5. Catálogo de Serviços (/servicos — CRUD de ServicoBase)
6. Polish Visual (animações, responsividade)

### 7C. CRM (Pipeline de Clientes)
- Kanban com 7 estágios (NOVO_LEAD → INATIVO)
- Cards com empresa, contato, valor potencial
- Modal com histórico de interações e follow-ups

### 7D. Demais módulos
- Tarefas, Financeiro, Talentos, Fornecedores, Formaturas, Agenda, Calendário Social

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

  const raw = Object.fromEntries(formData)
  const parsed = schema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos' }
  }

  try {
    await prisma.model.create({ data: parsed.data })
    revalidatePath('/rota')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Erro ao criar' }
  }
}
```

### Query
```typescript
import { prisma } from '@/lib/prisma'

export async function getDados() {
  return prisma.model.findMany({
    include: { relacao: true },
    orderBy: { createdAt: 'desc' },
  })
}
```

### Client Component
```typescript
'use client'
import { useState, useTransition } from 'react'
import { criarAlgo } from '@/modules/modulo/actions'

export function MeuComponente({ dados }: { dados: Tipo[] }) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await criarAlgo(formData)
      if (result.error) { /* toast error */ }
    })
  }

  return (/* JSX com Tailwind classes */)
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

## 9. WORKFLOW DE IMPLEMENTAÇÃO

Para cada módulo, seguir esta ordem:

1. **LER** o preview HTML correspondente (`modelos-atuais/preview-*.html`)
2. **LER** o PLANO-INFRA.md para entender schema e componentes planejados
3. **SCHEMA**: Adicionar models/enums necessários ao `prisma/schema.prisma`
4. **MIGRATE**: `npx prisma migrate dev --name nome-descritivo`
5. **GENERATE**: `npx prisma generate`
6. **TYPES**: Criar/atualizar `modules/[modulo]/types.ts`
7. **SCHEMAS**: Criar/atualizar `modules/[modulo]/schemas.ts` (Zod)
8. **QUERIES**: Criar/atualizar `modules/[modulo]/queries.ts`
9. **ACTIONS**: Criar/atualizar `modules/[modulo]/actions.ts`
10. **COMPONENTS**: Implementar componentes Client seguindo o preview HTML
11. **PAGE**: Criar/atualizar page.tsx (Server Component)
12. **TEST**: `npm run build` sem erros + verificar visualmente

---

## 10. CHECKLIST PRÉ-COMMIT

- [ ] `npx prisma generate` rodou sem erros
- [ ] `npm run build` compila sem erros
- [ ] Imports de Prisma são de `@/generated/prisma/client`
- [ ] Server Actions têm requireAuth/requireRole
- [ ] Zod usa `{ error: '...' }` (não `{ required_error: '...' }`)
- [ ] Componentes Client têm `'use client'` no topo
- [ ] Tailwind classes usam tokens do design system
- [ ] Visual condiz com o preview HTML de referência

---

## 11. CONTEXTO ADICIONAL

### Sobre a aba Equipe nos Projetos
O conceito é "escalar a equipe para o evento" — quando um projeto/evento é criado a partir de um orçamento, a equipe orçada pode ser associada a freelancers reais do banco de talentos. Isso permite:
- Saber quem está escalado para cada evento
- Controlar status (pendente/confirmado/cancelado)
- Ver horas alocadas por profissional
- Buscar no banco de talentos por especialidade/disponibilidade
- Criar pagamentos automaticamente a partir da escalação (futuro)

### Sobre o Cost Builder
O Cost Builder é o coração do módulo de Orçamentos. Ele substitui o modelo antigo de "linha a linha" por um builder interativo com chips de serviço. Cada ServicoBase tem um tipo (HORA ou OPCAO) que define o formulário inline que aparece. A margem é global no orçamento, não por item.

### Sobre Formaturas
O módulo de Formaturas é ISOLADO — tem lógica própria de precificação (por formando × eventos × equipe × distância). Não usa o Cost Builder nem o ServicoBase. Será implementado separadamente.
