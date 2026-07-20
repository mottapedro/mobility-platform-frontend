# Convite D2D (Driver-to-Driver) — Landing, captura e injeção do referral

Documenta o fluxo de indicação de motorista-para-motorista: a landing page
`/invite/d2d/[code]`, a captura do código de indicação e sua injeção
silenciosa no cadastro, incluindo o bug de lock de role encontrado e
corrigido em produção.

## Visão geral do fluxo

```
Motorista compartilha link ──► /invite/d2d/pedro-motta-zn-elite
                                          │
                                          ▼
                    InviteD2DClient grava o code em sessionStorage
                    (setStoredReferralCode) e renderiza a landing
                    (título, texto com o code, 4 cards de benefício)
                                          │
                                          ▼
                  Clique em "Aceitar Convite e Cadastrar"
                                          │
                                          ▼
                         router.push('/register')  ← SEM ?ref=
                                          │
                                          ▼
        RegisterPageClient renderiza os dois toggles (Passageiro/Motorista)
        livres — usuário escolhe "Motorista" e preenche os campos oficiais
                                          │
                                          ▼
              No submit, sessionReferralCode é lido do sessionStorage
              e injetado silenciosamente no payload de POST /auth/register
                                          │
                                          ▼
              sessionStorage limpo após cadastro bem-sucedido; novo
              motorista aparece na árvore "Rede D2D" do indicador
```

## Componentes

### `src/app/invite/d2d/[code]/page.tsx`
Server component: extrai `[code]` da URL (`decodeURIComponent`) e delega para
`InviteD2DClient`. Rota estática (`d2d`) tem prioridade sobre a rota
dinâmica `src/app/invite/[flow]/[code]/page.tsx` (shim que redireciona
outros flows, ex. `d2p`, para `/r/[slug]?flow=...`) — não há conflito de
roteamento no Next.js entre segmento estático e dinâmico.

### `src/app/invite/d2d/[code]/InviteD2DClient.tsx`
Client component com a landing conversiva (tema Dark Mode Default,
`#1C1008`/`#C25E14`):
- Título "Seja um motorista Aliado na minha rede.", texto exibindo o `code`
  recebido, 4 cards de benefício (`Sua rede vale mais`, `Mais corridas na
  sua região`, `Ganhos com recorrência`, `Crescimento sustentável`).
- `useEffect` grava o código via `setStoredReferralCode(sessionStorage,
  code)` (`src/utils/referral.ts`).
- CTA chama `router.push('/register')` — **sem** `?ref=`.

### `src/app/register/RegisterPageClient.tsx`
- Lê `getStoredReferralCode(sessionStorage)` em um `useEffect` e guarda em
  `sessionReferralCode`.
- No submit, o payload de `register()` inclui `referralCode:
  activeReferralCode || sessionReferralCode` — `activeReferralCode` (vindo
  do fluxo `?ref=` governado pelo backend via `fetchOnboardingContext`) tem
  prioridade; `sessionReferralCode` é o fallback silencioso do fluxo D2D.
- Crucial: `sessionReferralCode` **não** entra em `lockedRole` nem no banner
  "Convite ativo" — os campos oficiais do formulário e o toggle
  Passageiro/Motorista permanecem intactos, como exigido pelo onboarding
  congelado.
- `clearStoredReferralCode(sessionStorage)` limpa o valor após
  `register(payload)` resolver com sucesso.

## Bug encontrado e corrigido: lock indevido da aba Motorista

**Sintoma:** a primeira versão do CTA redirecionava para
`/register?ref=<code>`. Esse `?ref=` aciona `fetchOnboardingContext` no
servidor (`src/app/register/page.tsx`), que — dependendo de como o backend
classificava aquele código — retornava `expectedActor: 'passenger'` e
travava `lockedRole` no `RegisterPageClient`, escondendo completamente o
toggle "Motorista" e fixando o formulário em "Passageiro".

**Causa raiz:** o `RegisterPageClient` foi desenhado deliberadamente para
nunca ler referral de storage (comentário no código: "Backend is the source
of truth... We never read/write referral state from localStorage") — o
único mecanismo de referral era o `?ref=` na URL, resolvido no servidor.
Isso funciona bem para os fluxos `/r/[slug]` (D2P e outros, já
backend-governados), mas o link D2D usa um código sintético que o backend
não resolve da mesma forma, então o lock disparava incorretamente.

**Correção:** desacoplar a landing D2D do mecanismo `?ref=`. O código passa
a viajar por `sessionStorage` (não `localStorage`, para não vazar entre
abas/sessões de convites diferentes) e é injetado no payload apenas no
submit — sem qualquer efeito colateral na UI do formulário.

## Validação

- `npx tsc --noEmit` — sem erros.
- `npm test` — 249/251; as 2 falhas em `PixModal.test.tsx` são pré-existentes
  e não relacionadas.
- Validação manual em produção (`mobility-platform-frontend.vercel.app`):
  - `/invite/d2d/pedro-motta-zn-elite` renderiza a landing completa.
  - CTA leva a `/register` (sem `?ref=`) com os dois toggles
    Passageiro/Motorista visíveis e livres.
  - Cadastro efetuado como Motorista aparece corretamente na árvore
    **Rede D2D** do indicador (`/driver/network?tab=drivers`), classificado
    como `MOTORISTA · Líder · Nível 1` — confirma que o `referralCode`
    chegou no payload de `POST /auth/register` e foi associado pelo backend.

## Histórico (commits/PRs)

| Commit/PR | Descrição |
|---|---|
| PR #66 (`fix/pix-payment-intent-contract`) | Landing `/invite/d2d/[code]` inicial — CTA redirecionava para `/register?ref=<code>` |
| `e97693d` (PR #67) | Fix: CTA passa a redirecionar para `/register` puro; código movido para `sessionStorage`; injeção silenciosa no `RegisterPageClient` |

O mesmo PR #66 também incluiu, na mesma branch, dois fixes correlatos de
motorista (não documentados aqui em detalhe):
- **Lifecycle RPC**: `PATCH /rides/:id` é RPC-style e só aceita `action:
  reject_referral|reschedule`; os botões "A caminho"/"Finalizar corrida"
  passaram a usar `POST /rides/:id/lifecycle/start` e
  `.../lifecycle/complete` (`src/services/rides.ts`).
- **Polling 1s → 8s**: `useOffers`/`useDriverRides` reduziram o intervalo de
  polling para evitar sobrecarga de rede e drenagem de bateria.

## Próximos passos sugeridos

- Confirmar com o backend por que `fetchOnboardingContext` classifica
  códigos D2D sintéticos como `expectedActor: 'passenger'` — se for possível
  corrigir na origem, o fluxo `?ref=` volta a ser viável e mais simples que
  o `sessionStorage` (menos estado client-side para gerenciar).
- Adicionar teste automatizado cobrindo o caminho `sessionReferralCode` no
  `RegisterPageClient` (hoje validado apenas manualmente em produção).
- Aplicar o mesmo padrão de `sessionStorage` caso surjam outros links de
  convite sintéticos (fora do `/r/[slug]` backend-governado) que precisem
  do mesmo tratamento.
