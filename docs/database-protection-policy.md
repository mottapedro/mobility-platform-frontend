# Aliado — Política Oficial de Proteção de Dados Estruturais

## 1. Snapshot Obrigatório
Antes de qualquer migration, refactor, seed, update de relação, auth ou referral, execute:

```bash
pg_dump
```

Snapshots devem ser versionados em `backups/`:
- aliado-v1-network-stable-YYYYMMDD.sql.gz
- aliado-pre-passenger-network.sql.gz
- aliado-before-auth-refactor.sql.gz

## 2. Migrations Incrementais
Sempre use:
```bash
npx prisma migrate dev --name nome_da_migration
```
Nunca use reset destrutivo.

## 3. Proteção dos Testes
Prefixos obrigatórios para massa de teste:
- TEST_EMAIL_PREFIX
- TEST_PHONE_PREFIX
- TEST_REFERRAL_PREFIX

Exemplo:
- @test.com
- ref_test_
- drv_test_
- psg_test_

Cleanup sempre filtrado por prefixo.

## 4. Proibição de Comandos Destrutivos
**PROIBIDO:**
- DROP DATABASE
- prisma migrate reset
- db push destrutivo
- deleteMany global
- truncate sem filtro

## 5. Scripts de Proteção no package.json
```json
{
  "scripts": {
    "db:reset:local": "...",
    "db:snapshot": "...",
    "db:restore": "..."
  }
}
```

Bloqueie resets em produção:
```ts
if (process.env.NODE_ENV === "production") {
  throw new Error("Database reset blocked in production");
}
```

## 6. Isolamento de Ambientes
- .env.local
- .env.test
- .env.production

Nunca execute resets com NODE_ENV=production.

## 7. Banco Operacional x Banco de Testes
- **mobility-db**: preservado, sem resets, dados reais
- **mobility-test-db**: pode resetar, truncar, gerar massa fake

## 8. Versionamento de Snapshots
- v1-network-stable
- v1-passenger-network
- v1-driver-intelligence
- v1-beta-core

## 9. Recomendações Avançadas
- Snapshot automático antes de migration: `npm run db:snapshot`
- Documentar toda alteração estrutural

## 10. O que está sendo protegido
- Validação estrutural
- Arquitetura relacional
- Social graph
- Vínculo operacional
- Dados estratégicos
- Seeds validados

---

**Esta política é obrigatória para todos os colaboradores do Aliado.**
