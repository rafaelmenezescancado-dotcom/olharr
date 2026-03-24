---
name: deploy-check
description: Verificar status do deploy no Vercel e diagnosticar erros. Use após git push ou quando o site apresentar erro.
allowed-tools: Bash, Read
---

# Deploy Check — Verificar Deploy Vercel

## Passos

1. **Verificar status do deploy**:
   ```bash
   cd /Users/rafaelmenezescancado/Desktop/olharr-v2
   npx vercel ls 2>&1 | head -8
   ```

2. **Se status = Error**, verificar logs:
   ```bash
   npx vercel logs <deployment-url> 2>&1 | tail -50
   ```

3. **Se status = Building**, aguardar ~40s e verificar novamente.

4. **Se status = Ready**, confirmar ao usuário que está no ar.

## Diagnóstico comum de erros

- **"The PNG is not in RGBA format"**: Favicon precisa ser RGBA. Regerar com Pillow: `img.convert('RGBA')`
- **Build error em imports**: Verificar se imports Prisma usam `@/generated/prisma/client`
- **Runtime error 500**: Verificar env vars no Vercel (`npx vercel env ls`)
- **Module not found**: Rodar `npm install` e verificar se o pacote está no package.json

## Build local para debug
```bash
cd /Users/rafaelmenezescancado/Desktop/olharr-v2
npx next build 2>&1 | tail -30
```
