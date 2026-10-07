# INF-11 — Tasks

## Preparación
- [x] Rama `feat/INF-11-production-readiness` desde `develop`

## Backend (`quartz-api`)
- [x] `package.json` — `build`, `start`, `main`, `engines`
- [x] `src/utils/jwtSecret.ts` — `getJwtSecret()` con lectura perezosa
- [x] `src/features/auth/auth.service.ts` — quitar constante, usar `getJwtSecret()` en `jwt.sign`
- [x] `src/middlewares/auth.middleware.ts` — quitar constante, usar `getJwtSecret()` en `jwt.verify`
- [x] `src/app.ts` — fail-fast de `JWT_SECRET`
- [x] `src/app.ts` — `process.exit(1)` en el `.catch` de `mongoose.connect`
- [x] `src/app.ts` — `GET /api/health` → `200 { status: 'ok' }`
- [x] `git rm scripts/generate-hash.js`

## Frontend (`quartz-web`)
- [x] `vercel.json` — rewrite `/(.*)` → `/index.html`

## Docs
- [x] `00-deploy.md` — Fases 0.6, 1 y 5

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [ ] `npm run build && npm start` → `/api/health` responde 200 — build ✓; pendiente en vivo: Atlas rechaza la IP local
- [x] Arranque sin `JWT_SECRET` → exit 1
- [x] `MONGODB_URI` inválida → exit 1
- [ ] `npm run dev` + login en local OK — pendiente (misma causa)
- [x] `grep -rn dev_secret quartz-api/src` vacío
- [ ] `npm run build && npm run lint` en verde (`quartz-web`) — build ✓; lint con 8 errores preexistentes en `develop` (no se tocó `quartz-web/src`)
- [x] Repaso de aislamiento: `/api/health` no toca datos; cadenas de middlewares existentes sin cambios

## Manual (usuario)
- [ ] Rotar las contraseñas que estaban en `generate-hash.js`

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented` · PR → `develop` · siguiente: `/sdd-release`.
