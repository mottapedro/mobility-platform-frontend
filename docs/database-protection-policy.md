# Diretrizes Oficiais de Banco de Dados — Aliado V2

## Objetivo

Garantir integridade, rastreabilidade, previsibilidade e governança da evolução do domínio, evitando:

- Schema Drift
- Migration Drift
- Contract Drift
- Dados órfãos
- Violação de invariantes do domínio
- Corrupção da GODNETWORK

Esta política é obrigatória para todos os colaboradores.

## 1. O que pode

### 1.1 Evoluir schema via migration versionada

Toda alteração estrutural deve ocorrer via migration versionada.

Permitido:

- CREATE TABLE
- ALTER TABLE
- CREATE INDEX
- ALTER TYPE
- ADD COLUMN
- ADD CONSTRAINT

Exemplo:

```sql
ALTER TABLE "RideRequest"
ADD COLUMN "currentDispatchStage" TEXT;
```

### 1.2 Criar migrations determinísticas

Toda migration deve produzir o mesmo resultado em qualquer ambiente.

Exemplo:

```sql
CREATE TYPE "DispatchStage" AS ENUM (
  'REFERRAL_DIRECT',
  'REFERRAL_NETWORK',
  'REGION',
  'GLOBAL'
);
```

### 1.3 Criar índices de governança

Permitido criar índices que reforcem invariantes de domínio.

Exemplo:

```sql
CREATE UNIQUE INDEX RideOffer_one_pending_per_ride
ON "RideOffer" ("rideRequestId")
WHERE status = 'PENDING';
```

### 1.4 Criar seeds oficiais

Permitido manter seeds oficiais para:

- Smoke
- Staging
- GODNETWORK
- Auditoria

### 1.5 Adicionar novos status e eventos

Permitido evoluir:

- RideStatus
- DispatchStage
- DomainEventType

Desde que sejam atualizados juntos:

- migration
- schema
- client
- runtime
- testes

## 2. O que não pode

### 2.1 Alterar banco manualmente em staging/prod

Proibido executar manualmente em ambiente operacional:

- UPDATE/DELETE/ALTER fora de migration
- ALTER TYPE fora de migration

Toda alteração estrutural deve nascer de migration.

### 2.2 Apagar ou recriar GODNETWORK arbitrariamente

Proibido:

- apagar árvore canônica
- reparenting arbitrário
- reseed com IDs incompatíveis sem governança

A GODNETWORK é canônica, auditável e governada.

### 2.3 Usar mock para GODNETWORK em smoke/governance

Proibido usar mock/fake tree em cenários de validação oficial.

### 2.4 Criar migration condicional sem justificativa

Evitar `IF NOT EXISTS` quando isso gerar resultado divergente entre ambientes.

### 2.5 Renomear coluna/enum sem trilha completa

Qualquer rename exige:

- migration
- atualização de schema
- regeneração de client
- validação de contrato

## 3. Contratos obrigatórios

Nenhuma evolução estrutural pode ocorrer isoladamente. Deve existir alinhamento entre:

Database <-> Prisma Schema <-> Prisma Client <-> Application Code <-> E2E Tests

Observação de escopo:

- Este repositório frontend aplica principalmente governança de contrato/runtime e E2E.
- Validações Prisma completas devem executar no repositório que contém `prisma/schema.prisma`.

## 4. Invariantes de domínio

### 4.1 Dispatch

Obrigatório:

`COUNT(PENDING) <= 1` por RideRequest.

### 4.2 GODNETWORK

Obrigatório:

- sem órfãos
- sem duplicados
- sem ciclos
- sem reparenting arbitrário

### 4.3 Referral

Obrigatório:

`D2D != D2P != P2P`

### 4.4 Dispatch lifecycle

Fluxos válidos mínimos:

- WAITING_REFERRAL -> WAITING_PARTNER -> WAITING_GENERAL
- WAITING_REFERRAL -> MATCHED

## 5. Critério de aceite de PR

Antes de merge, o PR deve passar nos gates configurados:

- checks de migração/contrato aplicáveis ao repositório
- smoke suite obrigatória
- governance suite (quando aplicável)
- sem drift
- sem migration quebrada
- sem alteração indevida da GODNETWORK

Se qualquer item falhar, o PR deve ser rejeitado.

## 6. Backups e isolamento de ambientes

- Snapshot obrigatório antes de mudanças estruturais sensíveis
- Isolamento explícito entre ambiente operacional e banco de testes
- Proibição de reset destrutivo em produção

## 7. Donos e rastreabilidade

- Mudanças desta política exigem revisão de owner técnico
- Registrar data de revisão e motivação no histórico de PR
