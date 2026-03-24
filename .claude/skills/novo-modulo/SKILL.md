---
name: novo-modulo
description: Criar ou implementar um novo módulo no OLHARR v2 seguindo os padrões do projeto. Use quando for construir uma nova tela/feature.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Agent
---

# Novo Módulo — Implementar Feature no OLHARR v2

## Argumento esperado
`/novo-modulo <nome-do-modulo>` — Ex: `/novo-modulo talentos`

## Workflow obrigatório

### 1. Verificar se já existe
```
src/app/(dashboard)/<modulo>/page.tsx
src/components/<modulo>/
src/modules/<modulo>/
```

### 2. Se houver preview HTML, ler primeiro
```
modelos-atuais/preview-<modulo>.html
```

### 3. Criar/atualizar schema se necessário
- Adicionar models/enums em `prisma/schema.prisma`
- Rodar `/prisma-sync`

### 4. Criar backend
```
src/modules/<modulo>/queries.ts   → Queries (findMany, findUnique, aggregates)
src/modules/<modulo>/actions.ts   → Server Actions (criar, atualizar, deletar)
```

**Padrão de Server Action:**
```typescript
'use server'
import { requireRole } from '@/lib/auth/require-role'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

const schema = z.object({ ... })

export async function criarAlgo(formData: FormData) {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Dados inválidos' }
  try {
    await prisma.model.create({ data: parsed.data })
    revalidatePath('/<modulo>')
    return { success: true }
  } catch { return { error: 'Erro ao criar' } }
}
```

### 5. Criar componentes
```
src/components/<modulo>/<modulo>-list.tsx   → Client Component principal ('use client')
```

**Estilo visual:** bg-white, border-slate-200, rounded-xl, shadow-sm, indigo como cor de destaque.

### 6. Criar page
```typescript
// src/app/(dashboard)/<modulo>/page.tsx
import { requireRole } from '@/lib/auth/require-role'
import { getDados } from '@/modules/<modulo>/queries'
import { Component } from '@/components/<modulo>/<modulo>-list'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireRole(['ADMIN', 'PRODUTOR'])
  const dados = await getDados()
  return (
    <div className="p-6 min-h-full" style={{ background: 'var(--color-background)' }}>
      <Component dados={dados} />
    </div>
  )
}
```

### 7. Verificar
```bash
cd /Users/rafaelmenezescancado/Desktop/olharr-v2
node_modules/.bin/tsc --noEmit
npx next build
```

### 8. Commit e deploy
```bash
git add -A
git commit -m "feat: implementar módulo <modulo>"
git push origin main
```

## Checklist
- [ ] Imports Prisma de `@/generated/prisma/client`
- [ ] Server Actions com requireRole
- [ ] Zod com `{ error: '...' }`
- [ ] Client components com `'use client'`
- [ ] Build sem erros
