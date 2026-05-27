# tugym-push

Cloudflare Worker + Durable Object para enviar Web Push de "descanso terminado" en TuGym.

## Arquitectura

- **Worker** (`src/index.ts`): router HTTP, CORS, auth por header `X-TuGym-Token`, validación UUID v4, forward al DO.
- **Durable Object `DeviceDO`** (`src/device-do.ts`): un DO por `deviceId`. Guarda subscription, programa `alarm` para el fin del descanso, envía el push cuando dispara.
- **`webpush.ts`**: wrapper sobre `@block65/webcrypto-web-push` (Web Crypto API, sin Node).

## Endpoints

Todos `POST` con header `X-TuGym-Token: <AUTH_TOKEN>` y body JSON con `deviceId` (UUID v4).

| Endpoint | Body extra | Response |
|---|---|---|
| `/api/push/subscribe` | `{ subscription: PushSubscriptionJSON }` | `{ ok: true }` |
| `/api/push/arm` | `{ endsAt: number, exerciseName?: string, url?: string }` | `{ ok: true, firesAt }` |
| `/api/push/disarm` | — | `{ ok: true }` |
| `/api/push/unsubscribe` | — | `{ ok: true }` |

`endsAt` es epoch ms. Debe estar en el futuro y no más de 10 minutos adelante.

## Setup local

```powershell
cd workers/push
npm install
cp .dev.vars.example .dev.vars
# Generar VAPID keys de test:
npx web-push generate-vapid-keys --json
# Pegarlas en .dev.vars
npm run dev
```

`wrangler dev` requiere `wrangler login` previo.

### Test rápido

Subscription real requiere navegador. Hay una test page en `test-page/index.html` que registra un SW, hace `pushManager.subscribe()` con la VAPID pública y postea al Worker. Servila con cualquier static server desde el directorio `test-page/` y abrila apuntando al Worker en `localhost:8787`.

## Deploy

```powershell
# Secrets (solo primera vez):
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put AUTH_TOKEN

# Editar wrangler.toml [vars]:
#   ALLOWED_ORIGIN = "https://tugym.vercel.app"  (o el host real)
#   VAPID_SUBJECT  = "mailto:..."

npm run deploy
```

URL queda en `https://tugym-push.<account>.workers.dev`.

## Notas

- Durable Objects en SQLite-backed (free tier desde sept 2024). Ver `[[migrations]]` con `new_sqlite_classes`.
- El warning de bundling sobre `node:crypto` viene de un fallback de la lib que en Workers nunca se ejecuta (usa `globalThis.crypto`). No requiere `nodejs_compat`.
- Si la subscription expira (404/410 del push service), el DO la borra automáticamente. El front debería re-subscribirse en ese caso (próximo bloque).
