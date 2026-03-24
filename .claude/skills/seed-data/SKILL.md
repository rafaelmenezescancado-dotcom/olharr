---
name: seed-data
description: Inserir ou limpar dados de seed no Supabase do OLHARR v2. Use para popular o banco com dados de teste ou limpar tudo.
allowed-tools: Bash, Read, Write, Edit, Grep
---

# Seed Data — Gerenciar dados no Supabase

## Comandos

### Rodar seed existente
```bash
cd /Users/rafaelmenezescancado/Desktop/olharr-v2
npx tsx prisma/seed.ts
```

### Limpar todos os dados (manter usuários)
Criar script temporário em `scripts/clear-seed.ts`:

```typescript
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // Deletar na ordem correta de FK (filhos antes de pais)
  // Ajustar conforme os models existentes no schema
  const results = await prisma.$transaction([
    // ... deleteMany de cada tabela na ordem FK
  ])
  console.log('Dados removidos:', results.length, 'tabelas')
  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
```

Rodar: `npx tsx scripts/clear-seed.ts`
Depois: `rm scripts/clear-seed.ts`

## Regras
- NUNCA deletar a tabela `users` (usuário admin precisa existir)
- Usuário ativo: `contato@olharr.com.br` (authId: `c8b5678e-8c7a-45da-ba35-d3e2d45e6fd7`)
- Sempre deletar na ordem FK correta (filhos → pais)
- Usar `prisma.$transaction` para atomicidade
- Scripts temporários devem ser deletados após uso
