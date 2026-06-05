# GODNETWORK Smoke Suite

Esta suíte cobre os principais fluxos operacionais do domínio Aliado V2, protegendo contra regressões em produção/staging.

## Testes

- `network-context.spec.ts`: Valida Network Context por IDs, slugs, tipos, exibe nomes para auditoria.
- `referral-urls.spec.ts`: Garante unicidade e presença dos links D2D/D2P/P2P.
- `dispatch-lifecycle.spec.ts`: Valida RideStatus e DispatchStage em paralelo.
- `offer-invariant.spec.ts`: Garante no máximo 1 oferta PENDING durante todo o ciclo.
- `contract-integrity.spec.ts`: Valida integridade do contrato Prisma (migrate status + consulta real).

## Execução

```sh
npx playwright test e2e/godnetwork-smoke
```

Ou via workflow:

- `.github/workflows/godnetwork-smoke.yml`

## Requisitos

- Variáveis de ambiente SMOKE_API_URL, usuários seed
- Banco migrado e consistente
- Prisma Client atualizado
