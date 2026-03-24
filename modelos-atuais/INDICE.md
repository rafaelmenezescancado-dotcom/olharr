# OLHARR v2 — Nova Estrutura de Telas

Referência para reimplementação com novo design (Gemini/Figma).

---

## Mapa de Telas

| # | Tela | Rota | Status | Arquivo |
|---|------|------|--------|---------|
| 01 | Login | `/login` | Existe | `01-login.tsx` |
| 02 | Dashboard | `/dashboard` | Existe | `02-dashboard.tsx` |
| 03 | Orçamentos | `/orcamentos` | Existe | `03-orcamentos.tsx` |
| 03b | Orçamentos > Detalhes | `/orcamentos/[id]` | Existe | `03b-orcamentos-detalhes.tsx` |
| 03c | Orçamentos > Custos | `/orcamentos-detalhes/[id]` | **NOVO** | `03c-orcamentos-custos.tsx` |
| 03d | Orçamentos > Produtos | `/orcamentos-produtos` | **NOVO** | `03d-orcamentos-produtos.tsx` |
| 04 | Projetos | `/projetos` | Existe | `04-projetos.tsx` |
| 04x | Projetos > Sub-telas | A definir | **FUTURO** | — |
| 05 | CRM | `/crm` | Existe | `05-crm.tsx` |
| 06 | Tarefas | `/tarefas` | Redesign | `06-tarefas.tsx` + `06-tarefas-NOTAS.md` |
| 07 | Financeiro | `/financeiro` | Existe | `07-financeiro.tsx` |
| 07b | Fluxo de Caixa | `/fluxo-caixa` | Existe | `07b-fluxo-de-caixa.tsx` |
| 07c | Pag. Freelancers | `/financeiro/pagamentos-freela` | Existe | `07c-pagamentos-freelas.tsx` |
| 08 | Fornecedores | `/fornecedores` | Existe | `08-fornecedores.tsx` |
| 08b | Banco de Talentos | `/talentos` | Existe | `08b-banco-de-talentos.tsx` |
| 08c | Insumos | `/insumos` | **NOVO** | `08c-insumos.tsx` |
| 09 | Agenda | `/agenda` | Existe | `09-agenda.tsx` |
| 10 | Calendário Social | `/calendario` | Existe | `10-calendario-social.tsx` |
| 11 | Formaturas | `/formaturas` | Existe | `11-formaturas.tsx` |
| 11b | Turma Detalhe | `/formaturas/[id]` | Existe | `11b-turma-detalhe.tsx` |
| 12 | Configurações | `/configuracoes` | Existe | `12-configuracoes.tsx` |

---

## O que precisa ser construído do zero

### 03c — Orçamentos > Custos
Tela de custos detalhados vinculada a um orçamento. CRUD de itens de custo por categoria.

### 03d — Banco de Produtos
Banco de dados de produtos/serviços da OLHARR com nome, descrição, categoria e valores pré-definidos. Importação rápida ao montar orçamentos. **Requer novo model Prisma (Produto).**

### 06 — Tarefas (Redesign)
Adicionar visualização **Matriz de Eisenhower** (4 quadrantes) além do Kanban existente. Cards arrastáveis entre quadrantes. **Requer novos campos no schema (urgente, importante).**

### 08c — Insumos
Controle de insumos/materiais. Estoque, entrada/saída, vinculação com projetos. **Requer novo model Prisma (Insumo).**

### 04x — Sub-telas de Projetos
A definir posteriormente.

---

## Agrupamento por área

### Comercial
- 03 Orçamentos → 03b Detalhes → 03c Custos → 03d Produtos
- 05 CRM

### Produção
- 04 Projetos (+ sub-telas futuras)
- 06 Tarefas (Kanban + Eisenhower)
- 09 Agenda

### Financeiro
- 07 Financeiro → 07b Fluxo de Caixa → 07c Pag. Freelancers

### Recursos
- 08 Fornecedores → 08b Banco de Talentos → 08c Insumos

### Conteúdo
- 10 Calendário Social

### Educação
- 11 Formaturas → 11b Turma Detalhe

### Sistema
- 01 Login
- 02 Dashboard
- 12 Configurações

---

## Estrutura da pasta

```
modelos-atuais/
├── INDICE.md              ← Este arquivo
├── paginas/               ← Todas as páginas (Server Components)
│   ├── 01-login.tsx
│   ├── 02-dashboard.tsx
│   ├── 03-orcamentos.tsx
│   ├── 03b-orcamentos-detalhes.tsx
│   ├── 03c-orcamentos-custos.tsx      ★ NOVO
│   ├── 03d-orcamentos-produtos.tsx    ★ NOVO
│   ├── 04-projetos.tsx
│   ├── 05-crm.tsx
│   ├── 06-tarefas.tsx
│   ├── 06-tarefas-NOTAS.md           ★ REDESIGN
│   ├── 07-financeiro.tsx
│   ├── 07b-fluxo-de-caixa.tsx
│   ├── 07c-pagamentos-freelas.tsx
│   ├── 08-fornecedores.tsx
│   ├── 08b-banco-de-talentos.tsx
│   ├── 08c-insumos.tsx               ★ NOVO
│   ├── 09-agenda.tsx
│   ├── 10-calendario-social.tsx
│   ├── 11-formaturas.tsx
│   ├── 11b-turma-detalhe.tsx
│   ├── 12-configuracoes.tsx
│   ├── dashboard-layout.tsx
│   ├── root-layout.tsx
│   └── root-page.tsx
├── componentes/           ← Client Components (UI)
├── modulos/               ← Actions + Queries (Server-side)
├── lib/                   ← Auth, Prisma, Utils
└── config/                ← globals.css, middleware
```
