# GODNETWORK Governance Suite

Valida integridade relacional e projeção da árvore canônica GODNETWORK.

## Testes

- `canonical-tree.spec.ts`: Valida árvore por IDs, parentId, depth, sem órfãos/duplicatas, exibe nomes para auditoria.

## Execução

```sh
npx playwright test e2e/godnetwork-governance
```

Ou via workflow:

- `.github/workflows/godnetwork-governance.yml`

## Requisitos

- Variáveis de ambiente SMOKE_API_URL, usuários seed
- Banco migrado e consistente
