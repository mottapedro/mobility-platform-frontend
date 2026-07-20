# Rastreamento ao vivo do passageiro — Frontend (Polling & Mapa)

Documenta a implementação do **1º Passo** da estratégia "consumo antes da
emissão": a tela do passageiro que consome `GET /trips/:rideId/location` via
short polling e desenha o carro do motorista no mapa em tempo real. A emissão
real de localização pelo app do motorista ainda não existe — esta camada foi
construída para já reagir a ela assim que estiver disponível em produção.

## Visão geral do fluxo

```
Passageiro abre "Minhas corridas" (status ACCEPTED/MATCHED/IN_PROGRESS)
                            │
                            ▼
              Clica em "Acompanhar no mapa"
                            │
                            ▼
        /passenger/rides/[id]/tracking (nova rota)
                            │
                            ▼
     useRideLocationPolling dispara GET /trips/:rideId/location
                     a cada 4 segundos
                            │
                            ▼
   RideTrackingMap desenha o carro (Leaflet) rotacionado por
   direcaoGraus; se receivedAt > 15s atrás, reduz opacidade e
   exibe "Aguardando sinal do GPS do motorista..."
```

O botão "Acompanhar no mapa" só aparece quando a corrida está em `ACCEPTED`,
`MATCHED` ou `IN_PROGRESS` (`src/app/passenger/rides/page.tsx`, ao lado do
botão "Pagar via PIX" já existente).

## Componentes e arquivos criados

### `src/types/index.ts`
- `RideLocation`: contrato tipado do payload de `/trips/:rideId/location` —
  `lat`, `lng`, `direcaoGraus`, `receivedAt`.

### `src/services/rides.ts`
- `getRideLocation(rideId)`: `GET /trips/:rideId/location`, segue o mesmo
  padrão de `getRide` (usa `apiRequest` de `src/services/api.ts`).

### `src/utils/staleness.ts`
- `isLocationStale(receivedAt, thresholdMs = 15000)`: função pura que compara
  o relógio local (`Date.now()`) com o timestamp `receivedAt` recebido do
  backend. Isolada para ser testável e reutilizável fora do hook de polling.

### `src/hooks/useRideLocationPolling.ts`
Motor de polling propriamente dito:
- `setInterval` de **4000ms** disparando `getRideLocation`, com `clearInterval`
  garantido no cleanup do `useEffect` (mesmo padrão já usado em
  `passenger/rides/page.tsx`).
- **Ciclo de vida:** escuta `document.visibilitychange` — pausa o interval
  quando a aba/app é minimizado (`document.hidden`) e retoma ao voltar.
  Como este é um app **web** (Next.js), não React Native/Flutter, não existe
  `AppState`; `visibilitychange` é o equivalente correto na plataforma.
- **Parada definitiva:** não inicia (e limpa) o polling quando o `status` da
  corrida é `COMPLETED` ou `CANCELLED`.
- **Staleness:** a cada localização recebida, calcula `isStale` via
  `isLocationStale`; também reavalia a cada 1s enquanto não chega uma nova
  localização, para o alerta aparecer mesmo sem novo fetch.
- Retorna `{ location, isStale, error }`.

### `src/components/passenger/RideTrackingMap.tsx` + `RideTrackingMapClient.tsx`
Segue o mesmo padrão de `src/components/driver/RideMap.tsx` /
`RideMapClient.tsx` (wrapper `dynamic(..., { ssr: false })` + componente real
com `react-leaflet`):
- Ícone do carro via `L.divIcon`, com `transform: rotate(${direcaoGraus}deg)`
  e `transition: transform 0.4s ease` — rotação suave sem re-renderizar o
  mapa inteiro a cada atualização.
- Quando `isStale`, o ícone recebe `opacity: 0.4` e um badge flutuante exibe
  "Aguardando sinal do GPS do motorista..." (paleta consistente com os
  badges de status já usados na tela de corridas).

### `src/app/passenger/rides/[id]/tracking/page.tsx`
Nova rota dinâmica: busca a corrida (`getRide`) para status inicial, aciona
`useRideLocationPolling` e renderiza `RideTrackingMap`. Sem botão "Voltar"
próprio — a navegação por bottom tabs (`PassengerBottomNav`, já definida em
`src/app/passenger/layout.tsx`) cobre a rota, mantendo a imersão da tela de
mapa ativo. Se a corrida já estiver `COMPLETED`/`CANCELLED`, mostra mensagem
de encerramento em vez do mapa.

### `src/app/passenger/rides/page.tsx`
Adicionado botão "🚗 Acompanhar no mapa" ao lado de "💳 Pagar via PIX",
navegando para `/passenger/rides/${ride.id}/tracking`.

## Tema

Reaproveita a paleta Dark Mode já em uso no app do passageiro (nenhum token
novo foi criado): fundo `#0D0700`/`#1A0E04`, texto `#F5ECD8`, texto
secundário `#9A7D5A`, destaque laranja `#F28C28`, bordas `#2E1A08`.

## Verificação realizada

- `npx tsc --noEmit` — sem erros.
- `npm test` (Jest) — 249/251 testes passando; as 2 falhas são em
  `PixModal.test.tsx`, pré-existentes e não relacionadas a esta mudança
  (arquivo não tocado nesta tarefa).
- Não foi possível validar end-to-end no navegador nesta sessão porque o
  backend não emite `/trips/:rideId/location` ainda (motorista não gera
  localização real) — ver "Próximos passos".

## Arquivos alterados/criados

| Arquivo | Tipo |
|---|---|
| `src/types/index.ts` | editado — `RideLocation` |
| `src/services/rides.ts` | editado — `getRideLocation` |
| `src/utils/staleness.ts` | novo |
| `src/hooks/useRideLocationPolling.ts` | novo |
| `src/components/passenger/RideTrackingMap.tsx` | novo |
| `src/components/passenger/RideTrackingMapClient.tsx` | novo |
| `src/app/passenger/rides/[id]/tracking/page.tsx` | novo |
| `src/app/passenger/rides/page.tsx` | editado — botão de entrada |

Nenhum destes arquivos foi commitado ainda.

## Próximos passos sugeridos

- **2º Passo (emissão):** implementar no app do motorista o envio periódico
  de localização para `/trips/:rideId/location`, para então validar o
  rastreamento ponta a ponta com dados reais.
- Confirmar com o backend o formato exato do payload (`direcaoGraus` vs.
  `direcao_graus`, tipos de `lat`/`lng`) e ajustar `RideLocation` se
  necessário — o contrato foi assumido a partir da especificação, ainda sem
  endpoint real para validar.
- Adicionar teste automatizado (unitário do hook/staleness e, depois que a
  emissão existir, um smoke e2e — seguindo o padrão de
  `e2e/smoke/smoke-pix-payment.spec.ts` documentado em
  [`docs/pix-payment.md`](./pix-payment.md)).
- Decidir o critério final de quais status habilitam "Acompanhar no mapa"
  (hoje: `ACCEPTED`, `MATCHED`, `IN_PROGRESS` — mesmo critério usado para o
  botão de PIX).
