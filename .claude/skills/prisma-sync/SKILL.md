---
name: prisma-sync
description: Sincronizar schema Prisma com Supabase. Use quando alterar models/enums no schema.prisma ou precisar rodar migrations.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# Prisma Sync — Sincronizar Schema com Supabase

Quando o schema Prisma for alterado, execute na ordem:

1. **Verificar alterações**:
   ```bash
   cd /Users/rafaelmenezescancado/Desktop/olharr-v2
   git diff prisma/schema.prisma
   ```

2. **Push para Supabase** (sem migration, direto):
   ```bash
   npx prisma db push
   ```

3. **Gerar client**:
   ```bash
   npx prisma generate
   ```

4. **Verificar build**:
   ```bash
   npx next build
   ```

## Regras
- Client gerado vai para `src/generated/prisma/` — NUNCA editar
- Imports SEMPRE de `@/generated/prisma/client`
- Se houver conflito de enum/tabela antiga, dropar via SQL direto no Supabase antes do push
- Em produção (Vercel), a DATABASE_URL usa Transaction Pooler (porta 6543)
