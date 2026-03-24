# Tarefas — Notas de Redesign

## Modelos de visualização planejados

### 1. Kanban (já existe)
- Colunas: Pendente → Em andamento → Concluída
- Cards arrastáveis entre colunas

### 2. Matriz de Eisenhower (NOVO)
- 4 quadrantes:
  - **Urgente + Importante** → Fazer agora
  - **Importante + Não urgente** → Agendar
  - **Urgente + Não importante** → Delegar
  - **Não urgente + Não importante** → Eliminar
- Cards arrastáveis entre quadrantes
- Cada tarefa precisa de campos: `urgente: boolean`, `importante: boolean`
- Toggle entre visualização Kanban ↔ Eisenhower

### Mudanças necessárias no schema
```prisma
model Tarefa {
  // campos existentes...
  urgente    Boolean @default(false)  // NOVO
  importante Boolean @default(false)  // NOVO
}
```
