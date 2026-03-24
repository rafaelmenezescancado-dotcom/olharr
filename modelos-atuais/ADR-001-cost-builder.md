# ADR-001: Reestruturação do Cost Builder — Modelo Unificado por Horas + Entregas

**Status:** Proposed
**Date:** 2026-03-24
**Deciders:** Rafael

## Context

O preview interativo do módulo Orçamentos foi iterado 3 vezes. A última versão introduz um **cost builder** interativo onde o usuário clica num chip de serviço, define horas e descrição, e vai montando a composição de custos item a item. Isso mudou fundamentalmente o modelo de precificação de casamento (antes catálogo com dropdown, agora multiplicador por hora como eventos).

**Correlações quebradas detectadas entre o preview HTML e o PLANO-INFRA.md:**

| # | Inconsistência | Onde |
|---|---------------|------|
| 1 | Casamento descrito como "catálogo de opções com dropdown" | PLANO-INFRA §3B.4, §UX |
| 2 | `OrcamentoItem.opcaoId` referencia `OpcaoServico` — mas serviços por hora não são opções de catálogo | PLANO-INFRA §Schema OrcamentoItem |
| 3 | `OrcamentoCusto` ainda mencionado em §3B.3 e §6 | PLANO-INFRA §3B.3, §6 |
| 4 | `margemPct` por item no schema — mas UI define margem só no nível do orçamento | PLANO-INFRA §OrcamentoItem |
| 5 | `CategoriaServico` + `OpcaoServico` modelados para dropdowns — não para builder por hora | PLANO-INFRA §Schema Prisma |
| 6 | Componentes `orcamento-wizard-casamento.tsx` descreve formulário por categoria | PLANO-INFRA §Fase 5 |

## Decision

Reestruturar o modelo de dados para suportar **dois tipos de serviço** de forma unificada:

### Tipo A — Serviço por Hora (profissionais)
Fotógrafo, Videomaker, Drone, Edição Real Time Fotos
→ O usuário define **quantidade de horas** e o custo é `horas × custoPorHora`

### Tipo B — Serviço por Opção (entregas/produtos)
Aftermovie, Ensaio Pré-Wedding, Making Of, Álbum
→ O usuário escolhe de uma **lista de opções** com custo fixo

### Margem única no nível do orçamento
A margem deixa de ser por item (`margemPct` no OrcamentoItem) e passa a ser definida globalmente no `Orcamento.margemPct`. O valor de venda é calculado como: `totalCustos / (1 - margemPct)`.

## Options Considered

### Option A: Manter CategoriaServico + OpcaoServico para tudo
| Dimension | Assessment |
|-----------|------------|
| Complexity | Alta — forçar serviços por hora em modelo de opções |
| Fidelidade à UI | Baixa — UI é builder por hora, modelo é dropdown |
| Flexibilidade | Baixa — não suporta horas variáveis |

**Pros:** Menos mudança no schema planejado
**Cons:** Desalinhamento total com a UX aprovada

### Option B: Modelo unificado ServicoBase com tipo (ESCOLHIDA)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Média — um model com campo `tipo` |
| Fidelidade à UI | Alta — reflete exatamente o builder |
| Flexibilidade | Alta — suporta ambos os modelos |

**Pros:** 1 model para configurar todos os serviços, alinhado com UX
**Cons:** Campos condicionais (custoPorHora só para tipo HORA)

### Option C: Dois models separados (ServicoPorHora + ServicoOpcao)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Alta — dois models, duas relações no OrcamentoItem |
| Fidelidade à UI | Alta |
| Flexibilidade | Média — rígido |

**Pros:** Tipos bem separados, sem campos nullable
**Cons:** Mais complexidade, duas foreign keys no item

## Trade-off Analysis

Option B vence porque:
1. A UI trata ambos como "chips" no mesmo builder — um único model reflete isso
2. O campo `tipo` (HORA vs OPCAO) determina qual formulário inline aparece
3. Menos joins, menos complexidade nas queries
4. Futuro: se surgir um terceiro tipo, basta adicionar ao enum

## Schema Proposto

```prisma
enum TipoServico {
  HORA    // Custo = horas × custoPorHora
  OPCAO   // Custo fixo por opção selecionada
}

model ServicoBase {
  id            String       @id @default(cuid())
  nome          String       // "Fotógrafo", "Aftermovie", "Álbum"
  tipo          TipoServico  // HORA ou OPCAO
  icone         String?      // Emoji ou icon key para o chip
  cor           String?      // Cor de fundo do chip (hex)
  area          String       // "FOTOGRAFIA", "VIDEO", "EXTRAS"
  vertpierntes  Vertente[]   // Em quais vertentes aparece
  custoPorHora  Decimal?     @db.Decimal(10, 2) // Só para tipo HORA
  ativo         Boolean      @default(true)
  ordem         Int          @default(0)

  opcoes        OpcaoServico[]      // Só para tipo OPCAO
  itens         ItemCustoOrcamento[]

  @@map("servicos_base")
}

model OpcaoServico {
  id          String  @id @default(cuid())
  servicoId   String
  nome        String  // "Tipo 1", "3 minutos", "2H - 40 FOTOS"
  custo       Decimal @db.Decimal(10, 2)
  ordem       Int     @default(0)
  ativo       Boolean @default(true)

  servico     ServicoBase @relation(fields: [servicoId], references: [id], onDelete: Cascade)
  itens       ItemCustoOrcamento[]

  @@map("opcoes_servico")
}
```

### OrcamentoItem → ItemCustoOrcamento (renomeado para clareza)

```prisma
model ItemCustoOrcamento {
  id            String   @id @default(cuid())
  orcamentoId   String
  servicoId     String?  // Ref ao ServicoBase (null = item manual)
  opcaoId       String?  // Ref à OpcaoServico (null = tipo HORA ou manual)
  descricao     String   // "Cerimônia + Recepção", "Tipo 2"
  horas         Int?     // Só para tipo HORA
  custoTotal    Decimal  @db.Decimal(10, 2) // Calculado: horas × custoPorHora OU custo da opção
  createdAt     DateTime @default(now())

  orcamento Orcamento    @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
  servico   ServicoBase? @relation(fields: [servicoId], references: [id], onDelete: SetNull)
  opcao     OpcaoServico? @relation(fields: [opcaoId], references: [id], onDelete: SetNull)

  @@map("itens_custo_orcamento")
}
```

### Orcamento — margem no nível do orçamento

```prisma
model Orcamento {
  // campos existentes...
  vertente    Vertente?
  margemPct   Decimal?  @db.Decimal(5, 2)  // Margem única (ex: 30.00)

  itens       ItemCustoOrcamento[]  // Renomeado
  versoes     OrcamentoVersao[]
  tarefas     Tarefa[]
}
```

### Cálculos (não persistidos)

```
totalCustos = SUM(itens.custoTotal)
valorVenda  = totalCustos / (1 - margemPct / 100)
lucro       = valorVenda - totalCustos
```

## Correlação UI ↔ Schema

| Elemento no Preview | Model/Campo |
|--------------------|-----------|
| Chip "📷 Fotógrafo" | `ServicoBase { nome: "Fotógrafo", tipo: HORA, custoPorHora: 150 }` |
| Chip "🎞️ Aftermovie" | `ServicoBase { nome: "Aftermovie", tipo: OPCAO }` + `OpcaoServico[]` |
| Chip "📖 Álbum" | `ServicoBase { nome: "Álbum", tipo: OPCAO }` + `OpcaoServico[]` |
| Select de horas (6h) | `ItemCustoOrcamento.horas = 6` |
| Select de opção (3 min) | `ItemCustoOrcamento.opcaoId → OpcaoServico { nome: "3 minutos" }` |
| Input "Descrição" | `ItemCustoOrcamento.descricao` |
| Valor "R$ 900,00" | `ItemCustoOrcamento.custoTotal = 150 × 6` |
| "✕" remover | `DELETE ItemCustoOrcamento` |
| Total de Custos | `SUM(itens.custoTotal)` |
| Select margem 30% | `Orcamento.margemPct = 30` |
| Valor de Venda | `totalCustos / (1 - 0.30)` calculado |

## O que acontece com os models antigos

| Model Antigo | Decisão |
|-------------|---------|
| `CategoriaServico` | **Eliminado** — substituído por `ServicoBase` com `area` |
| `OpcaoServico` | **Mantido** — mas agora referencia `ServicoBase` em vez de `CategoriaServico` |
| `OrcamentoCusto` | **Eliminado** — nunca implementado, substituído por `ItemCustoOrcamento` |
| `OrcamentoItem` (antigo) | **Renomeado** → `ItemCustoOrcamento` com schema atualizado |
| `MultiplicadorEvento` | **Mantido** — usado para Evento/Corporativo (futuro) |
| `ParametroFormatura` | **Movido** para módulo Formaturas |
| `CustoProfissional` | **Movido** para módulo Formaturas |
| `MultiplicadorDistancia` | **Movido** para módulo Formaturas |

## Consequences

- O builder funciona para todas as vertentes **exceto Formatura** (que tem módulo próprio)
- Evento/Corporativo e Casamento convergem no mesmo modelo de Cost Builder
- **Formatura isolada** no módulo Formaturas — lógica por formando × eventos × equipe × distância não polui o Orçamentos
- A margem é global — simplifica a UI e o cálculo
- Seed de dados fica mais simples: inserir ServicoBase + OpcaoServico
- `CategoriaServico` eliminado reduz 1 model e 1 nível de indireção
- Enum `Vertente` mais limpo sem FORMATURA

## Action Items

1. [x] Atualizar PLANO-INFRA.md com o novo schema
2. [x] Remover referências a OrcamentoCusto, CategoriaServico
3. [x] Atualizar diagrama de relacionamentos
4. [x] Atualizar lista de componentes (wizard → cost-builder)
5. [x] Atualizar Fase 1 (schema) e Fase 5 (implementação)
6. [x] Isolar Formatura no módulo Formaturas (ParametroFormatura, CustoProfissional, MultiplicadorDistancia)
7. [ ] Revisar tipos em types.ts
