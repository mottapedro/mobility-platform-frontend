# Pagamento via PIX — Fatura Transparente

Documenta a feature de pagamento PIX do passageiro (`PixModal`) e o smoke test
automatizado que valida o fluxo ponta a ponta contra o backend real.

## Visão geral do fluxo

```
Passageiro cria corrida ──► Motorista aceita ──► Corrida ACCEPTED
                                                       │
                                                       ▼
                              Passageiro clica "Pagar via PIX"
                                                       │
                                                       ▼
                     POST /rides/:id/payment-intent (createPaymentIntent)
                                                       │
                                                       ▼
                 Backend responde: qrCode/pixCopiaCola, amount, breakdown
                                                       │
                                                       ▼
                    PixModal renderiza QR real + fatura detalhada
```

O botão "Pagar via PIX" só aparece quando a corrida está em `ACCEPTED`,
`MATCHED` ou `IN_PROGRESS` (`src/app/passenger/rides/page.tsx:219`).

## Componentes

### `src/services/payments.ts`
- `PaymentIntentResponse`: contrato tipado da resposta do backend — `qrCode`,
  `pixCopiaCola` (payload EMVCo, começa com `000201`), `amount`, `breakdown`
  (`BreakdownItem[]` com `label`/`value`), `status`.
- `createPaymentIntent(rideId, options?)`: `POST /rides/:id/payment-intent`.
- `extractQrCodeImage(...)`: heurística de fallback para extrair imagem
  base64/URL de QR de payloads de backend com formato inconsistente.

> **Estado atual (não commitado):** há uma edição local em `createPaymentIntent`
> que deixou de enviar `priceBrl`/`amountCents` no corpo da requisição, com o
> comentário "price is authoritative in the DB". Isso reflete uma mudança de
> contrato com o backend em andamento — o preço deixou de ser calculado no
> frontend e passou a ser autoritativo no banco. Ainda não commitada nesta
> sessão.

### `src/components/payment/PixModal.tsx`
Modal bottom-sheet (mobile-first) com:
- **Contador regressivo** (`useCountdown`, TTL de 180s) — expira o QR
  visualmente e desabilita o botão "Já paguei".
- **Valor em destaque** formatado com `Intl.NumberFormat('pt-BR', ...)`.
- **Breakdown dinâmico**: mapeia `payment.breakdown` e destaca em laranja
  (`text-aliado-orange`) qualquer item cujo label bata com `/taxa|plataforma|cyborg/i`
  — sem dados fabricados; se o backend não enviar breakdown, cai para uma
  linha simples "Aliado Mobilidade" + valor total.
- **QR code real** via `qrcode.react`, gerado a partir do payload EMVCo
  (`pixCopiaCola`/`qrCode`). Fallback para uma chave PIX fixa
  (`FALLBACK_PIX_KEY`) só quando o backend não retorna um payload válido.
- **Estado "confirmado"**: `handleConfirm` troca para uma tela de sucesso e
  chama `onPaymentSuccess` após 1.2s.
- Paleta usa tokens semânticos `aliado-*` (`aliado-card`, `aliado-orange`,
  `aliado-success`, `aliado-error`, `aliado-border`, `aliado-input`,
  `aliado-sub`, `aliado-muted`, `aliado-text`) — resultado do redesign da
  PR #63 (`feat/pix-modal-redesign`), que substituiu as cores hex fixas da
  versão anterior.

## Histórico de mudanças (branches/PRs relevantes)

| Commit/PR | Descrição |
|---|---|
| PR #59–#61 (`feat/autocomplete-address`) | Autocomplete de endereço + migração de geocoding para Google Maps |
| `c240b87` (PR #62) | Integração real do payment-intent PIX com backend + breakdown de preço |
| PR #63 (`feat/pix-modal-redesign`) | Redesign do PixModal (timer, valor em destaque, tokens `aliado-*`), 10 tools de WebMCP do motorista, fix `ACCEPTED→STARTED` no botão "A caminho" |

Deploy em produção validado via Vercel (`mobility-platform-frontend`,
deployment `5wBVCoUtVjgBqan8Pcb3pEoBGpaH`, status **Ready**).

## Smoke test automatizado

`e2e/smoke/smoke-pix-payment.spec.ts` — automatiza o script manual de
validação (login passageiro via API, criação de corrida, redirecionamento
para `/passenger/rides`) que antes era executado colando JS no console do
navegador.

### O que o teste faz
1. Login de passageiro e motorista via API (`SmokeApi.loginPassenger/loginDriver`,
   reaproveitado da fixture `actors` já usada em `smoke-happy-path.spec.ts`).
2. Cria a corrida via `api.createRideOrReclaim(...)`, incluindo
   `originLat/Lng`/`destinationLat/Lng` — **o backend passou a exigir
   coordenadas** (`400 Invalid coordinates` sem elas).
3. Agenda a corrida entre 2–7 dias no futuro (aleatório) para não colidir
   com corridas de execuções anteriores (`409 SCHEDULE_CONFLICT`) — não há
   endpoint de cancelamento de corrida no frontend/backend acessível para
   limpeza automática.
4. Espera a oferta chegar ao motorista e aceita (`waitForOfferForRide` +
   `respondOffer`), confirmando `status === 'ACCEPTED'`.
5. Injeta `passengerRideIds` no `localStorage` da página do passageiro e
   navega para `/passenger/rides`.
6. Clica em "Pagar via PIX" e valida que o modal abre com "Total a pagar"
   visível e o botão "Copiar" presente — ou seja, que a fatura foi
   efetivamente gerada com dados reais do backend (não just placeholder/erro).

### Como rodar

```bash
# Contra staging (quando os domínios staging-*.aliado.app estiverem no ar)
npm run test:e2e:smoke:pix

# Contra o dev local (dev server já rodando em :3001)
SMOKE_PASSENGER_URL=http://localhost:3001 SMOKE_DRIVER_URL=http://localhost:3001 \
  npm run test:e2e:smoke:pix
```

Variáveis lidas de `.env.smoke` (não versionado): `SMOKE_API_URL`,
`SMOKE_PASSENGER_EMAIL/PASSWORD`, `SMOKE_DRIVER_EMAIL/PASSWORD`,
`SMOKE_PASSENGER_URL`/`SMOKE_DRIVER_URL` (opcionais, fallback = `SMOKE_API_URL`).

### Limitação conhecida
`SMOKE_PASSENGER_URL`/`SMOKE_DRIVER_URL` em `.env.smoke` apontam para
`staging-passenger.aliado.app` / `staging-driver.aliado.app`, que não
resolvem via DNS neste ambiente (domínio ainda não deployado ou apenas
placeholder). O teste foi validado com sucesso apontando para
`localhost:3001` via override de env var.

### Resultado da validação (execução real)
```
rideId: d13ea029-1c16-4e23-ade1-d68490672d38
offerId: 485e2d31-3c2c-4eab-b6ad-e7d915c499d2
rideStatus: ACCEPTED
selectedDriverId: 91f98e9d-cf0e-4add-a7f9-6ea859823ab3
1 passed (6.5s)
```

## Arquivos alterados/criados nesta tarefa

- `e2e/smoke/smoke-pix-payment.spec.ts` — novo spec (não commitado).
- `e2e/smoke/support/api.ts` — `createRideOrReclaim` passou a aceitar
  `originLat/Lng`/`destinationLat/Lng` opcionais (não commitado).
- `package.json` — novo script `test:e2e:smoke:pix` (não commitado).
- `src/services/payments.ts` — edição local pré-existente não relacionada a
  esta tarefa, sobre o contrato de preço (ver nota acima); não commitada.

## Próximos passos sugeridos

- Commitar `smoke-pix-payment.spec.ts`, o ajuste em `api.ts` e o script do
  `package.json`.
- Decidir separadamente o que fazer com a edição pendente em
  `payments.ts` (contrato de preço autoritativo no backend) — commitar,
  descartar ou revisar com o time de backend.
- Confirmar quando `staging-passenger.aliado.app`/`staging-driver.aliado.app`
  entram no ar para que `npm run test:e2e:smoke:pix` funcione sem override
  de variáveis de ambiente.
