# OLHARR v2 — Plano de Infraestrutura Completo

Documento de planejamento para implementação tela a tela.
Gerado em: 2026-03-24

---

## 1. Decisões Arquiteturais

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Tema de cores | **Manter roxo (#8B5CF6)** | Consistência com todo o app |
| Workflow | **Planejar tudo → implementar** | Evitar retrabalho |
| Novas features Orçamentos | Versionamento + Tarefas vinculadas + Polish visual | Sem IA de e-mail por ora |
| Padrão de componentes | Server Component (page) + Client Components (UI) | Arquitetura Next.js 16 App Router |
| Validação | Zod v4 com `{ error: '...' }` | Padrão do projeto |
| Prisma imports | Sempre de `@/generated/prisma/client` | Regra crítica do projeto |

---

## 2. Mudanças no Schema Prisma

### 2.1 Novos Models

#### OrcamentoVersao (Versionamento de Propostas)
```prisma
model OrcamentoVersao {
  id          String   @id @default(cuid())
  orcamentoId String
  versao      Int      @default(1)
  snapshot    Json     // Snapshot dos itens + valores no momento da versão
  totalBruto  Decimal  @db.Decimal(10, 2)
  margem      Decimal? @db.Decimal(5, 2)
  observacoes String?
  criadoPor   String?  // userId de quem criou a versão
  createdAt   DateTime @default(now())

  orcamento Orcamento @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)

  @@unique([orcamentoId, versao])
  @@map("orcamento_versoes")
}
```

**Lógica:** Cada vez que o orçamento é enviado ao cliente ou alterado significativamente, uma versão é criada com um snapshot JSON dos itens. Isso permite comparar versões e voltar a uma versão anterior se necessário.

#### Campos novos no model Tarefa (Eisenhower + Orçamento)
```prisma
model Tarefa {
  // ... campos existentes ...
  orcamentoId String?    // NOVO — vinculação com orçamento
  urgente     Boolean    @default(false)  // NOVO — Eisenhower
  importante  Boolean    @default(false)  // NOVO — Eisenhower

  orcamento Orcamento? @relation(fields: [orcamentoId], references: [id], onDelete: SetNull) // NOVO
}
```

#### Relação reversa no Orcamento
```prisma
model Orcamento {
  // ... campos existentes ...
  versoes  OrcamentoVersao[]  // NOVO
  tarefas  Tarefa[]           // NOVO
}
```

#### Sistema de Precificação (Baseado na planilha OLHARR 2.0)

> Atualizado em: 2026-03-24 — Análise das planilhas AUX + ADR-001 + separação Formatura

**Models do módulo Orçamentos (ver detalhamento na Seção 3B.4):**
- `ServicoBase` — Serviços unificados com tipo HORA ou OPCAO (substitui CategoriaServico)
- `OpcaoServico` — Opções dentro de cada ServicoBase tipo OPCAO
- `MultiplicadorEvento` — Tabela de multiplicadores para Evento/Corporativo (futuro)
- Enum `Vertente` — CASAMENTO, EVENTO, CORPORATIVO, QUINZE_ANOS, ENSAIO, PUBLICITARIO
- Enum `TipoServico` — HORA, OPCAO

**Models do módulo Formaturas (isolados — ver módulo Formaturas):**
- `ParametroFormatura`, `CustoProfissional`, `MultiplicadorDistancia`

**Mudança no OrcamentoItem** → renomeado para `ItemCustoOrcamento`. Margem agora é global no `Orcamento.margemPct`.

#### Relação atualizada no Orcamento
```prisma
model Orcamento {
  // ... campos existentes ...
  vertente Vertente?          // NOVO — identifica qual formulário guiado usar
  versoes  OrcamentoVersao[]  // NOVO
  tarefas  Tarefa[]           // NOVO
}
```

### 2.2 Models Futuros

| Model | Tela | Status |
|-------|------|--------|
| `Insumo` | 08c - Insumos | Implementar quando chegar nessa tela |

### 2.3 Migration Plan
```bash
# 1. Editar prisma/schema.prisma
# 2. Gerar migration
npx prisma migrate dev --name add-orcamento-versoes-tarefa-fields
# 3. Regenerar client
npx prisma generate
# 4. Verificar que generated/prisma/ foi atualizado
```

---

## 3. Arquitetura de Módulos — Orçamentos (Tela 03)

### 3.1 Estrutura de Arquivos (Estado Atual → Estado Final)

```
src/
├── app/(dashboard)/orcamentos/
│   ├── page.tsx                    ✅ Existe (Server Component)
│   └── [id]/page.tsx               ✅ Existe (Server Component)
│
├── components/orcamentos/
│   ├── orcamentos-list.tsx          ✅ Existe → REFATORAR (660 linhas, monolítico)
│   ├── orcamento-detail.tsx         ✅ Existe → REFATORAR
│   ├── orcamento-kanban.tsx         🆕 Extrair do list (board kanban)
│   ├── orcamento-card.tsx           🆕 Extrair do list (card individual)
│   ├── orcamento-modal.tsx          🆕 Extrair do list (modal de detalhes)
│   ├── orcamento-form.tsx           🆕 Extrair do list (form de criação)
│   ├── orcamento-stats.tsx          🆕 Extrair do list (cards de estatísticas)
│   ├── orcamento-viabilidade.tsx    🆕 Extrair do list (análise de viabilidade)
│   ├── orcamento-versoes.tsx        🆕 NOVO (lista de versões no modal)
│   └── orcamento-tarefas.tsx        🆕 NOVO (mini-lista de tarefas no modal)
│
├── modules/orcamentos/
│   ├── actions.ts                   ✅ Existe → EXPANDIR
│   ├── queries.ts                   ✅ Existe → EXPANDIR
│   ├── schemas.ts                   🆕 CRIAR (validações Zod)
│   └── types.ts                     🆕 CRIAR (tipos TypeScript)
```

### 3.2 Decomposição do orcamentos-list.tsx (660 linhas → ~6 arquivos)

| Componente | Responsabilidade | Linhas aprox. | Client? |
|-----------|-----------------|---------------|---------|
| `orcamentos-list.tsx` | Orquestrador: state global, filtros, renderiza os sub-componentes | ~100 | ✅ |
| `orcamento-stats.tsx` | 4 cards de estatísticas (Propostas, Negociação, Taxa, Ticket) | ~60 | ✅ |
| `orcamento-kanban.tsx` | Board com 4 colunas + lógica de filtro | ~80 | ✅ |
| `orcamento-card.tsx` | Card individual dentro da coluna kanban | ~60 | ✅ |
| `orcamento-modal.tsx` | Modal de detalhes (tabela itens, viabilidade, versões, tarefas) | ~200 | ✅ |
| `orcamento-form.tsx` | Modal de criação de novo orçamento | ~80 | ✅ |
| `orcamento-viabilidade.tsx` | Seção de análise de viabilidade | ~80 | ✅ |
| `orcamento-versoes.tsx` | Timeline de versões da proposta | ~60 | ✅ |
| `orcamento-tarefas.tsx` | Mini-lista de tarefas vinculadas | ~60 | ✅ |

### 3.3 Novas Server Actions (modules/orcamentos/actions.ts)

```typescript
// Ações existentes (manter):
criarOrcamento(formData)
atualizarStatusOrcamento(id, status)
adicionarItem(orcamentoId, formData)
removerItem(itemId, orcamentoId)
deletarOrcamento(id)

// Novas ações:
criarVersao(orcamentoId)         // Cria snapshot da versão atual
restaurarVersao(versaoId)        // Restaura itens de uma versão anterior
vincularTarefa(orcamentoId, formData)  // Cria tarefa vinculada ao orçamento
concluirTarefa(tarefaId)         // Marca tarefa como concluída
```

### 3.4 Novas Queries (modules/orcamentos/queries.ts)

```typescript
// Queries existentes (manter):
getOrcamentos()
getOrcamentoById(id)

// Expandir getOrcamentoById para incluir:
// - versoes (ordenadas por versao desc)
// - tarefas (vinculadas ao orçamento)

// Novas queries:
getVersoes(orcamentoId)
getTarefasDoOrcamento(orcamentoId)
```

### 3.5 Schemas Zod (modules/orcamentos/schemas.ts)

```typescript
import { z } from 'zod/v4'

export const criarOrcamentoSchema = z.object({
  clienteId: z.string({ error: 'Selecione um cliente' }),
  titulo: z.string({ error: 'Título é obrigatório' }).min(1),
  vertical: z.string().optional(),
  validoAte: z.string().optional(),
  margem: z.coerce.number().optional(),
  observacoes: z.string().optional(),
})

export const adicionarItemSchema = z.object({
  descricao: z.string({ error: 'Descrição é obrigatória' }).min(1),
  quantidade: z.coerce.number().int().min(1).default(1),
  valorUnit: z.coerce.number({ error: 'Valor é obrigatório' }).positive(),
  categoria: z.string().optional(),
})

export const vincularTarefaSchema = z.object({
  titulo: z.string({ error: 'Título é obrigatório' }).min(1),
  descricao: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  dataVencimento: z.string().optional(),
})
```

### 3.6 Types (modules/orcamentos/types.ts)

```typescript
import type { OrcamentoStatus, TaskStatus, TaskPriority } from '@/generated/prisma/client'

export type OrcamentoItem = {
  id: string
  descricao: string
  quantidade: number
  valorUnit: unknown  // Decimal vem como unknown do Prisma
  categoria: string | null
}

export type OrcamentoVersao = {
  id: string
  versao: number
  snapshot: unknown  // JSON
  totalBruto: unknown
  margem: unknown
  observacoes: string | null
  criadoPor: string | null
  createdAt: Date
}

export type OrcamentoTarefa = {
  id: string
  titulo: string
  descricao: string | null
  status: TaskStatus
  prioridade: TaskPriority
  dataVencimento: Date | null
  concluidaEm: Date | null
}

export type OrcamentoFull = {
  id: string
  titulo: string
  status: OrcamentoStatus
  vertical: string | null
  validoAte: Date | null
  totalBruto: unknown
  margem: unknown
  observacoes: string | null
  createdAt: Date
  cliente: { id: string; name: string; company: string | null }
  itens: OrcamentoItem[]
  versoes: OrcamentoVersao[]
  tarefas: OrcamentoTarefa[]
}

export type ClienteSimples = {
  id: string
  name: string
  company: string | null
}
```

---

## 3B. Fluxo Completo do Módulo Orçamentos (03 a 03d)

> Atualizado em: 2026-03-24 — Decisão: estruturar produtos separadamente

### Visão Geral do Fluxo

```
03d - PRODUTOS (catálogo)          03 - ORÇAMENTOS (kanban)
     │                                    │
     │  Produtos alimentam                │  Clicar num card abre
     │  os custos                         │
     ▼                                    ▼
03c - CUSTOS (/orcamentos/[id]/custos)    03b - DETALHES (/orcamentos/[id])
     │                                    │
     │  Breakdown de custos               │  Edição de itens, versões,
     │  do orçamento + inserir            │  tarefas, status
     │  produtos do catálogo              │
     └──────────┬─────────────────────────┘
                │
                ▼
         MARGEM = Valor de Venda − Custos
```

### 3B.1 — 03 Orçamentos (Kanban) `/orcamentos`

**Já planejado na Seção 3 acima.** Kanban com 4 colunas, stats, filtros, modal de preview.

### 3B.2 — 03b Orçamento Detalhes `/orcamentos/[id]`

**Já existe** (`orcamento-detail.tsx`). Tela de edição completa com:
- Header (título, cliente, vertical, validade)
- Status selector
- Tabela de itens com adicionar/remover
- Stats (Total Bruto, Com Margem)

**Ajustes planejados:**
- Adicionar seção de Versões (timeline)
- Adicionar seção de Tarefas vinculadas
- Link para 03c (Custos) no header

### 3B.3 — Descrição de Custos (aba dentro do modal/detalhe do orçamento)

> **Atualizado em: 2026-03-24** — Não é mais uma tela separada (03c). Agora é uma **aba "Descrição de Custos"** dentro do modal de detalhes do orçamento. Ver ADR-001.

**Conceito:** Cost Builder interativo. O usuário clica num chip de serviço → define horas ou escolhe opção → adiciona descrição → clica "ADICIONAR" → o item aparece na lista de custos. A margem é definida globalmente na aba "Itens & Viabilidade".

**Dois tipos de serviço:**
- **HORA** (Fotógrafo, Videomaker, Drone, Ed. Real Time) → `horas × custoPorHora`
- **OPCAO** (Aftermovie, Ensaio, Making Of, Álbum) → custo fixo por opção

**Schema — ver §3B.4 para models completos**

**Componentes:**
| Componente | Responsabilidade |
|-----------|-----------------|
| `orcamento-cost-builder.tsx` | Client — chips de serviço + form inline + lista de itens |
| `cost-builder-form.tsx` | Client — form condicional (horas ou opção) + ADICIONAR |
| `cost-builder-list.tsx` | Client — lista de itens adicionados com ✕ remover |
| `cost-builder-total.tsx` | Client — total de custos + botão "Aplicar ao Orçamento" |

**Actions:**
```typescript
adicionarItemCusto(orcamentoId, formData)   // Serviço por hora ou opção
removerItemCusto(itemId, orcamentoId)
```

**Campos calculados (não persistidos):**
- `totalCustos` = SUM(itens.custoTotal)
- `valorVenda` = totalCustos / (1 - margemPct / 100)
- `lucro` = valorVenda - totalCustos

### 3B.4 — 03d Sistema de Produtos e Precificação `/produtos`

> Atualizado em: 2026-03-24 — Baseado na análise da planilha "Cópia de Planilha de Controle - OLHARR 2.0"

#### Resumo do que foi analisado nas planilhas

**Abas AUX (tabelas de parâmetros):**
- `AUXCASAMENTO` — Catálogo de serviços para casamento com opções, margem% e custo
- `AUXFORMATURA` — Parâmetros por evento (fotógrafos/auxiliares/coordenadores por fase) + custos de profissionais
- `AUXEVENTO` — Multiplicadores por nº de fotógrafos/horas, edição, GIFs, drone, disponibilidade, etc.
- `AUXCORPORATIVO` — Idêntico ao AUXEVENTO (mesmos multiplicadores)

**Abas de Orçamento (calculadoras):**
- `CASAMENTO` — Formulário guiado: seleciona opções → calcula custo → aplica margem → valor de venda
- `FORMATURA` — Cálculo por formando × eventos × equipe (lógica completamente diferente)
- `EVENTOS` — Formulário por nº fotógrafos × horas × multiplicadores

#### Decisões tomadas

| Decisão | Escolha |
|---------|---------|
| Lógica de cálculo | AUX = parâmetros, Abas principais = calculadora por vertente |
| Fórmula de preço | `valorVenda = custo / (1 - margem%)` |
| AUXEVENTO vs AUXCORPORATIVO | Idênticos — unificar como um só modelo "Evento/Corporativo" |
| **Formatura** | **Isolada no módulo Formaturas** — lógica própria (por formando/evento), não usa Cost Builder |
| UX de montagem | Cost Builder unificado com chips (substitui wizard por vertente) |

#### Estrutura de Dados das Planilhas

**CASAMENTO — Serviços organizados por categoria:**
```
FOTOGRAFIA
├── Ensaio Pré-Wedding     → NÃO / 1H-20fotos / 2H-40fotos / 3H-60fotos
├── Making Of              → NÃO / NOIVOS / NOIVO / NOIVA
├── Cerimônia              → NÃO / 1 FOT / 2 FOT / 3 FOT
├── Recepção               → NÃO / 1 FOT / 2 FOT / 3 FOT
├── Edição Real Time       → SIM / NÃO
├── Impressões de Fotos    → SIM / NÃO
└── Álbum                  → NÃO / TIPO 1-4

VÍDEO
├── Video Ensaio           → SIM / NÃO
├── Making Of              → SIM / NÃO
├── Cerimônia              → NÃO / 1 VM / 2 VM / 3 VM
├── Drone                  → SIM / NÃO
├── Recepção               → NÃO / 1 VM / 2 VM / 3 VM
├── Edição Sameday         → SIM / NÃO
├── Aftermovie             → NÃO / 1min / 3min / 10min
└── Pílulas Reels (15s)    → (sempre incluso)

EXTRAS
└── Plataforma 360         → NÃO / 2h / 4h / 6h / 8h

Cada opção tem: margem% + custo base
```

**EVENTO/CORPORATIVO — Serviços por multiplicadores:**
```
FOTOGRAFIA
├── Nº Fotógrafos          → 1-24 (multiplicador decrescente)
├── Tempo de Cobertura     → horas
├── Edição                 → por nº de fotos
├── Prévias < 24h          → SIM(×1.1) / NÃO(×1)
├── Edição Real Time       → NÃO(×1) / PARCIAL(×1.15) / TOTAL(×1.5)
├── GIFs                   → SIM(×1.4) / NÃO(×1)
└── Disponibilidade Equipe → 100%-0% (impacta margem: 15%-50%)

VÍDEO
├── Nº Videomakers         → com multiplicador
├── Drone                  → NÃO / FPV ½ dia / FPV dia / DRONE ½ dia / DRONE dia
├── Edição (15s/30s/1min/2min)
├── Lettering              → SIM(×1.3) / NÃO(×1)
└── Real Time              → SIM(×1.3) / NÃO(×1)

Custo base fotógrafo: R$ 150,00
```

**FORMATURA — Lógica por formando/evento:**
```
EVENTOS (cada um com equipe variável):
├── Pré-eventos      → fotógrafos + auxiliares + coordenadores + custo fixo
├── Meio Curso       → idem
├── Culto            → idem
├── Colação          → idem
├── Baile            → idem
└── Após Valsa       → idem

ENSAIOS:
├── Meio Curso       → fotos × custo por foto
└── Foto Convite     → idem

PROFISSIONAIS (custo por pessoa):
├── Fotógrafo        → R$ 150 + R$ 0 transporte
├── Auxiliar         → R$ 75 + R$ 50 transporte
├── Coordenador      → R$ 200 + R$ 0
├── Editor           → R$ 50
└── Fotógrafo Ensaio → R$ 150

MULTIPLICADOR DISTÂNCIA: 0km=×1, 100km=×1.1, ... 700km=×1.7

Cálculo: (custo equipe × eventos + ensaios + outros) × distância / nº formandos = custo por formando
```

#### Schema Prisma — Modelo completo (v2 — Cost Builder)

> **Atualizado em: 2026-03-24** — Reestruturado após ADR-001. CategoriaServico eliminada, modelo unificado ServicoBase.

```prisma
// ─── VERTENTES ──────────────────────────────────────────
// FORMATURA isolada no módulo Formaturas (lógica por formando × eventos × equipe × distância)
enum Vertente {
  CASAMENTO
  EVENTO          // Inclui Shows & Festas, Particular
  CORPORATIVO
  QUINZE_ANOS
  ENSAIO
  PUBLICITARIO
}

// ─── TIPO DE SERVIÇO ────────────────────────────────────
enum TipoServico {
  HORA    // Custo = horas × custoPorHora (Fotógrafo, Videomaker, Drone, Ed. Real Time)
  OPCAO   // Custo fixo por opção selecionada (Aftermovie, Ensaio, Álbum, Making Of)
}

// ─── SERVIÇO BASE (unificado) ───────────────────────────
// Substitui CategoriaServico. Cada chip no Cost Builder = 1 ServicoBase.

model ServicoBase {
  id            String       @id @default(cuid())
  nome          String       // "Fotógrafo", "Aftermovie", "Álbum"
  tipo          TipoServico  // HORA ou OPCAO
  icone         String?      // Emoji para o chip (ex: "📷")
  cor           String?      // Cor hex para o ícone (ex: "rgba(139,92,246,.08)")
  area          String       // "FOTOGRAFIA", "VIDEO", "EXTRAS"
  custoPorHora  Decimal?     @db.Decimal(10, 2) // Só para tipo HORA (ex: 150.00)
  ativo         Boolean      @default(true)
  ordem         Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  opcoes OpcaoServico[]        // Só para tipo OPCAO
  itens  ItemCustoOrcamento[]

  @@map("servicos_base")
}

// ─── OPÇÕES DE SERVIÇO ──────────────────────────────────
// Só usado por serviços tipo OPCAO. Ex: Álbum → Tipo 1 (R$ 500), Tipo 2 (R$ 800)

model OpcaoServico {
  id          String   @id @default(cuid())
  servicoId   String
  nome        String   // "Tipo 1", "3 minutos", "2H - 40 FOTOS"
  custo       Decimal  @db.Decimal(10, 2) // Custo fixo
  ordem       Int      @default(0)
  ativo       Boolean  @default(true)

  servico ServicoBase @relation(fields: [servicoId], references: [id], onDelete: Cascade)
  itens   ItemCustoOrcamento[]

  @@map("opcoes_servico")
}

// ─── MULTIPLICADORES EVENTO/CORPORATIVO ─────────────────
// Tabelas auxiliares para lógica avançada de eventos (futuro)

model MultiplicadorEvento {
  id          String   @id @default(cuid())
  vertente    Vertente // EVENTO ou CORPORATIVO
  tipo        String   // "FOTOGRAFOS", "EDIÇÃO", "DISPONIBILIDADE", etc.
  chave       String   // Ex: "1", "2", "3" ou "100%", "80%"
  valor       Decimal  @db.Decimal(5, 3)

  @@unique([vertente, tipo, chave])
  @@map("multiplicadores_evento")
}

// ─── FORMATURA ───────────────────────────────────────────
// Os models abaixo pertencem ao MÓDULO FORMATURAS (não ao Orçamentos).
// Serão implementados quando chegarmos na tela de Formaturas.
// Referência: ParametroFormatura, CustoProfissional, MultiplicadorDistancia
// Ver planilhas AUXFORMATURA para detalhes.
```

#### Relação com o Orçamento — ItemCustoOrcamento (novo nome)

```prisma
model ItemCustoOrcamento {
  id            String   @id @default(cuid())
  orcamentoId   String
  servicoId     String?  // Ref ao ServicoBase (null = item manual/avulso)
  opcaoId       String?  // Ref à OpcaoServico (null = tipo HORA ou manual)
  descricao     String   // "Cerimônia + Recepção", "Tipo 2", descrição livre
  horas         Int?     // Só para tipo HORA (ex: 6, 9)
  custoTotal    Decimal  @db.Decimal(10, 2)  // horas × custoPorHora OU custo da opção
  createdAt     DateTime @default(now())

  orcamento Orcamento     @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
  servico   ServicoBase?  @relation(fields: [servicoId], references: [id], onDelete: SetNull)
  opcao     OpcaoServico? @relation(fields: [opcaoId], references: [id], onDelete: SetNull)

  @@map("itens_custo_orcamento")
}
```

#### Margem no nível do Orcamento (não por item)

```prisma
model Orcamento {
  // campos existentes...
  vertente    Vertente?
  margemPct   Decimal?  @db.Decimal(5, 2)  // Ex: 30.00 — margem global

  itens       ItemCustoOrcamento[]  // Renomeado de OrcamentoItem
  versoes     OrcamentoVersao[]
  tarefas     Tarefa[]
}
```

> **Mudanças vs. versão anterior (ADR-001):**
> - ~~`CategoriaServico`~~ → Eliminada, substituída por `ServicoBase` com campo `area`
> - ~~`OrcamentoItem`~~ → Renomeado para `ItemCustoOrcamento`, sem `margemPct` por item
> - ~~`OrcamentoCusto`~~ → Nunca implementado, conceito absorvido em `ItemCustoOrcamento`
> - ~~`CustoProfissional`~~ → Absorvido em `ServicoBase.custoPorHora`
> - Margem agora é global em `Orcamento.margemPct`
> - Cálculo: `valorVenda = totalCustos / (1 - margemPct / 100)`

#### UX — Cost Builder Unificado (todas as vertentes)

> **Atualizado em: 2026-03-24** — Wizard por vertente substituído por Cost Builder único.

```
Novo Orçamento → Escolhe Vertente → Aba "Descrição de Custos"
                                          │
                                  ┌───────┴────────┐
                                  ▼                ▼
                          Chips HORA         Chips OPCAO
                          (📷📹🚁⚡)          (🎞️💍💄📖)
                                  │                │
                          Horas + Desc      Opção + Desc
                                  │                │
                                  └───────┬────────┘
                                          ▼
                                   + ADICIONAR
                                          ▼
                              Lista de itens de custo:
                              Serviço | Horas | Desc | Custo
                                          ▼
                              Total de Custos
                                          ▼
                       Aba "Itens & Viabilidade":
                       Margem (select global) → Valor de Venda → Lucro
```

**Componentes — Cost Builder:**

| Componente | Responsabilidade |
|-----------|-----------------|
| `orcamento-cost-builder.tsx` | Client — orquestrador: chips + form + lista |
| `cost-builder-form.tsx` | Client — form condicional (horas ou opção) + ADICIONAR |
| `cost-builder-list.tsx` | Client — lista de itens com ícone + horas + desc + custo + ✕ |
| `cost-builder-total.tsx` | Client — total + "Aplicar ao Orçamento" |

**Componentes — Catálogo de Serviços (admin):**

| Componente | Responsabilidade |
|-----------|-----------------|
| `servicos-page.tsx` | Server Component — CRUD de ServicoBase |
| `servicos-list.tsx` | Client — Lista de serviços com tipo, custo, opções |
| `servico-form.tsx` | Client — Criar/editar ServicoBase (tipo HORA: custoPorHora; tipo OPCAO: lista de opções) |
| `multiplicadores-config.tsx` | Client — Config de multiplicadores Evento/Corp (futuro) |

**Rotas:**

| Rota | Página |
|------|--------|
| `/servicos` | Catálogo de ServicoBase com opções (renomeado de /produtos) |
| `/servicos/multiplicadores` | Config de multiplicadores (Evento/Corp) — futuro |

> **Nota:** Config de parâmetros de formatura fica no módulo Formaturas (`/formaturas/config`).

### 3B.5 — Diagrama de Relacionamentos (Módulo Orçamentos — v2 Cost Builder)

```
Client (CRM)
  │
  │ 1:N
  ▼
Orcamento (vertente + margemPct global)
  │
  ├── 1:N → ItemCustoOrcamento (custoTotal + desc + horas?)
  │              │
  │              ├── N:1 → ServicoBase (tipo HORA: custoPorHora; tipo OPCAO: tem opções)
  │              │              │
  │              │              └── 1:N → OpcaoServico (nome + custo fixo)
  │              │
  │              └── N:1 → OpcaoServico (direta, quando tipo OPCAO)
  │
  ├── 1:N → OrcamentoVersao   (snapshots de versões)
  └── 1:N → Tarefa            (tarefas vinculadas)

Configuração (tabelas de parâmetros — módulo Orçamentos):
├── ServicoBase → OpcaoServico          (catálogo unificado)
└── MultiplicadorEvento                  (multiplicadores Evento/Corp — futuro)

Módulo Formaturas (isolado — lógica própria):
├── ParametroFormatura                   (equipe por fase de evento)
├── CustoProfissional                    (custo por função)
└── MultiplicadorDistancia               (fator de distância 0-700km)
```

**Mudanças acumuladas (ADR-001 + separação Formatura):**
- ~~`CategoriaServico`~~ → **Eliminada** — substituída por `ServicoBase` com campo `area`
- ~~`OrcamentoItem`~~ → **Renomeado** para `ItemCustoOrcamento` (só custo, sem margem por item)
- ~~`OrcamentoCusto`~~ → **Nunca implementado** — conceito absorvido em `ItemCustoOrcamento`
- ~~`CustoProfissional`~~ → **Movido** para módulo Formaturas
- ~~`Produto` genérico~~ → **Substituído** por `ServicoBase` + `OpcaoServico`
- ~~`FORMATURA` no enum~~ → **Removido** do Vertente — módulo próprio
- **Margem** = global em `Orcamento.margemPct` → `valorVenda = totalCustos / (1 - margemPct/100)`

---

## 3C. Design System — Tokens & Consistência

> **Audit realizada em: 2026-03-24**

### Mapeamento de Tokens: Preview HTML → globals.css → Tailwind

| Preview (CSS var) | globals.css (@theme) | Tailwind class | Hex |
|---|---|---|---|
| `--bg` | `--color-background` | `bg-background` | `#F0EDFF` |
| `--surface` | `--color-surface` | `bg-surface` | `#FFFFFF` |
| `--surface-2` | `--color-surface-2` | `bg-surface-2` | `#F7F5FF` |
| `--border` | `--color-border` | `border-border` | `#E8E3F5` |
| `--fg` | `--color-foreground` | `text-foreground` | `#1C1730` |
| `--muted` | `--color-muted-foreground` | `text-muted-foreground` | `#676767` |
| `--subtle` | `--color-subtle` | `text-subtle` | `#9B96B0` |
| `--primary` | `--color-primary` | `bg-primary` / `text-primary` | `#8B5CF6` |
| `--accent` | `--color-accent` | `bg-accent` | `#1E7FCD` |
| `--success` | `--color-success` | `text-success` | `#22C55E` |
| `--warning` | `--color-warning` | `text-warning` | `#F59E0B` |
| `--danger` | `--color-danger` | `text-danger` | `#EF4444` |

> **Nota:** Na implementação real, usar classes Tailwind (`bg-primary`, `text-danger`, etc.) em vez de `var()` inline. O preview usa variáveis simplificadas para funcionar standalone.

### Componentes do Cost Builder — Design Tokens por Chip

| Serviço | Ícone | Cor do ícone (bg) | Serviço tipo |
|---------|-------|--------------------|-------------|
| Fotógrafo | 📷 | `rgba(139,92,246,.08)` (primary) | HORA |
| Videomaker | 🎬 | `rgba(217,70,239,.08)` (fuchsia) | HORA |
| Drone | 🚁 | `rgba(30,127,205,.08)` (accent) | HORA |
| Ed. Real Time | ⚡ | `rgba(245,158,11,.08)` (warning) | HORA |
| Aftermovie | 🎞️ | `rgba(30,127,205,.08)` (accent) | OPCAO |
| Ensaio | 💍 | `rgba(244,63,94,.08)` (rose) | OPCAO |
| Making Of | 💄 | `rgba(217,70,239,.08)` (fuchsia) | OPCAO |
| Álbum | 📖 | `rgba(34,197,94,.08)` (success) | OPCAO |
| Outro | ➕ | `rgba(139,92,246,.08)` (primary) | custom |

> Estes valores serão persistidos em `ServicoBase.icone` e `ServicoBase.cor`.

### Radius Scale

| Token | Preview | globals.css | Uso |
|-------|---------|-------------|-----|
| `--radius` | `12px` | `--radius-lg: 12px` | Cards, modais, chips |
| `--radius-sm` | `8px` | `--radius-md: 8px` | Inputs, selects, botões |
| — | — | `--radius-sm: 4px` | Badges |

---

## 4. Polish Visual — Melhorias Planejadas

### 4.1 Ajustes nos Cards Kanban
- [ ] Adicionar micro-animação de hover (scale + shadow)
- [ ] Badge de número de versões no card (se > 1)
- [ ] Indicador visual de tarefas pendentes (dot ou count)
- [ ] Melhorar espaçamento e tipografia

### 4.2 Ajustes no Modal de Detalhes
- [ ] Adicionar abas/seções: Itens | Versões | Tarefas
- [ ] Melhorar layout da viabilidade (mais visual, menos tabular)
- [ ] Adicionar botão "Criar Versão" antes de enviar

### 4.3 Ajustes no Formulário de Criação
- [ ] Select de vertical como chips clicáveis em vez de text input
- [ ] Melhor feedback visual de validação

---

## 5. Ordem de Implementação

### Fase 1 — Schema & Backend
1. Adicionar enums `Vertente` + `TipoServico` ao schema Prisma
2. Adicionar `OrcamentoVersao` ao schema
3. Adicionar `ServicoBase` + `OpcaoServico` ao schema (modelo unificado)
4. Adicionar `MultiplicadorEvento` ao schema (para futuro Evento/Corp)
5. Criar `ItemCustoOrcamento` (substitui OrcamentoItem — com servicoId, opcaoId, horas, custoTotal)
7. Atualizar `Orcamento` (adicionar `vertente`, `margemPct`, relações)
8. Adicionar campos `orcamentoId`, `urgente`, `importante` ao model Tarefa
9. Rodar migration
10. Criar seed com dados das planilhas (ServicoBase + OpcaoServico)
11. Criar `modules/orcamentos/schemas.ts` e `types.ts` (atualizados)
12. Expandir `modules/orcamentos/queries.ts` e `actions.ts`

### Fase 2 — Refatoração de Componentes (03 Kanban)
1. Extrair `orcamento-stats.tsx`
2. Extrair `orcamento-card.tsx`
3. Extrair `orcamento-kanban.tsx`
4. Extrair `orcamento-form.tsx` (com select de vertente)
5. Extrair `orcamento-viabilidade.tsx` (com select de margem global)
6. Extrair `orcamento-modal.tsx`
7. Simplificar `orcamentos-list.tsx` como orquestrador
8. **Testar** — app deve funcionar identicamente

### Fase 3 — Features Novas (03 + 03b)
1. Implementar `orcamento-versoes.tsx` (timeline + criar versão)
2. Implementar `orcamento-tarefas.tsx` (mini-lista + criar tarefa)
3. Integrar no modal de detalhes (03) e página de detalhes (03b)
4. **Testar**

### Fase 4 — Cost Builder (aba "Descrição de Custos")
1. Implementar `orcamento-cost-builder.tsx` (orquestrador: chips + form + lista)
2. Implementar `cost-builder-form.tsx` (form condicional HORA/OPCAO + ADICIONAR)
3. Implementar `cost-builder-list.tsx` (itens com ícone + horas + desc + custo + ✕)
4. Implementar `cost-builder-total.tsx` (total + Aplicar)
5. Integrar como aba no modal de detalhes (03) e detalhe (03b)
6. **Testar** — adicionar/remover itens, recálculo de total

### Fase 5 — Catálogo de Serviços (/servicos)
1. Criar rota `/servicos` com CRUD de ServicoBase
2. Implementar `servicos-list.tsx` (lista com tipo, custo, opções)
3. Implementar `servico-form.tsx` (tipo HORA: custoPorHora; tipo OPCAO: lista de opções)
4. Implementar seed automático baseado nas planilhas AUX
5. **Testar**

### Fase 6 — Polish Visual
1. Aplicar micro-animações (hover nos chips, slide-down do form)
2. Ajustar tipografia e espaçamentos
3. Melhorar responsividade
4. **Testar em mobile**

---

## 6. Impacto em Outras Telas

| Tela | Impacto | Ação necessária |
|------|---------|-----------------|
| 06 - Tarefas | Novos campos `urgente`, `importante`, `orcamentoId` | Atualizar componente para mostrar vínculo com orçamento |
| 03b - Orçamento Detalhe | Versões + link para custos | Atualizar queries e adicionar navegação para 03c |
| 03c - ~~Custos~~ | **Eliminada como tela separada** — agora é aba "Descrição de Custos" no modal/detalhe | Implementar como componente `orcamento-cost-builder.tsx` |
| 03d - ~~Produtos~~ → Serviços | Catálogo de `ServicoBase` + `OpcaoServico` | Criar rota `/servicos` com CRUD |
| 02 - Dashboard | Pode mostrar stats de orçamentos e margem | Nenhuma ação imediata |
| 05 - CRM | Já linka para orçamentos | Nenhuma ação |
| 07 - Financeiro | Margem real dos orçamentos pode alimentar DRE | Considerar futuramente |

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Migration quebra dados existentes | Baixa | Todos campos novos são opcionais ou têm default |
| Snapshot JSON grande demais | Baixa | Limitar a itens essenciais (sem relations aninhadas) |
| Performance com muitas versões | Baixa | Paginar versões, carregar lazy |
| Componentes refatorados perdem funcionalidade | Média | Testar cada extração antes de prosseguir |

---

## 8. Checklist de Validação Final

### Schema & Backend
- [ ] Schema migrated sem erros (ServicoBase, OpcaoServico, ItemCustoOrcamento, OrcamentoVersao, campos Tarefa)
- [ ] `npx prisma generate` sem erros
- [ ] `npm run build` sem erros
- [ ] Seed com ServicoBase (9 serviços) + OpcaoServico funcionando

### 03 — Kanban de Orçamentos
- [ ] Kanban renderiza igual ao antes
- [ ] Modal abre e fecha corretamente
- [ ] Aba "Itens & Viabilidade" mostra custos + margem global
- [ ] Aba "Descrição de Custos" (Cost Builder) funcional
- [ ] Versões são criadas e listadas no modal
- [ ] Tarefas são vinculadas e gerenciadas no modal

### 03b — Detalhes do Orçamento
- [ ] Página de edição funciona
- [ ] Seção de versões visível
- [ ] Cost Builder integrado como aba

### Cost Builder
- [ ] Chips de serviço renderizam corretamente
- [ ] Form condicional (horas vs opção) funciona
- [ ] Adicionar item atualiza lista e total
- [ ] Remover item atualiza lista e total
- [ ] "Aplicar ao Orçamento" persiste os itens

### Catálogo de Serviços (/servicos)
- [ ] CRUD de ServicoBase (tipo HORA e OPCAO)
- [ ] CRUD de OpcaoServico dentro de cada ServicoBase tipo OPCAO
- [ ] Serviços desativados não aparecem no Cost Builder
- [ ] Config de parâmetros Formatura
- [ ] Seed com dados das planilhas AUX carregado

### Formulários Guiados (integrado no 03b)
- [ ] Wizard Casamento: selecionar opções → gera itens com custo + margem + venda
- [ ] Wizard Evento/Corp: multiplicadores → gera itens
- [ ] Wizard Formatura: por formando × evento → gera itens
- [ ] Fórmula `valorVenda = custo / (1 - margem%)` correta
- [ ] Cards de resumo (Total Custo × Total Venda × Margem Real) calculam certo

### Geral
- [ ] Responsividade OK em mobile
- [ ] Sem console errors
- [ ] Navegação entre 03 → 03b → 03c fluida
