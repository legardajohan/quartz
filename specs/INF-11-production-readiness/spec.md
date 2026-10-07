---
id: INF-11-production-readiness
feature: production-readiness
status: implemented       # draft | approved | implemented | released
created: 2026-10-07
---

# INF-11 — Production readiness (Fase 0 de `00-deploy.md`) (spec)

## Objetivo
Dejar `quartz-api` y `quartz-web` desplegables en Render y Vercel resolviendo los bloqueantes de código de la Fase 0 de [`00-deploy.md`](../../00-deploy.md), sin cambios funcionales.

## Estado de ramas (verificado 2026-10-07)
- `git branch -a --no-merged develop` → solo `origin/main`. Las 30 ramas `feat/*` ya están en `develop` (incluida `feat/RPT-02-communicative-letter`, abierta en el worktree `E:/dev/startup/quartz-rpt-02`).
- `develop` == `origin/develop`. `main` va 115 commits detrás y 0 delante. Sin tags ni `CHANGELOG.md`.
- La Fase 1 de `00-deploy.md` ("mergear las ramas pendientes") ya no aplica: solo queda correr `/sdd-release`.

## Alcance
**Incluye:**
- `quartz-api`: build con `tsc` y `start` sobre `dist/`.
- `JWT_SECRET` obligatorio, sin valor de respaldo.
- Salida con código 1 si falla la conexión a Mongo.
- `GET /api/health`.
- `quartz-web/vercel.json` con rewrite de SPA.
- Eliminar `quartz-api/scripts/generate-hash.js`.
- Actualizar `00-deploy.md` (Fases 0, 1 y 5).

**Fuera:**
- Release (Fase 1): se ejecuta después con `/sdd-release`.
- Infraestructura y despliegue (Fases 2–5).
- Reescritura del historial git.
- `helmet`, rate limit, alertas, backups.
- Runner de tests.

## Criterios de aceptación (EARS)
- [x] Cuando se ejecuta `npm run build` en `quartz-api`, el sistema genera `dist/app.js` con `tsc`.
- [x] Cuando se ejecuta `npm start` en `quartz-api`, el sistema corre `node dist/app.js` sin depender de `ts-node`.
- [x] Si falta `JWT_SECRET` al arrancar, la API registra el error y termina con `process.exit(1)` antes de escuchar.
- [x] Ningún archivo de `quartz-api/src` contiene `'dev_secret'`; firma y verificación de JWT usan `getJwtSecret()`.
- [x] Si `mongoose.connect` falla, la API registra el error y termina con `process.exit(1)`.
- [ ] Cuando se recibe `GET /api/health`, la API responde `200 { "status": "ok" }` sin autenticación ni tenant.
- [ ] Cuando se recarga en Vercel una ruta profunda (`/gestion/usuarios`, `/activar-cuenta?token=…`), el sistema sirve `index.html`.
- [x] `quartz-api/scripts/generate-hash.js` no existe en el árbol de `develop`.
- [x] **Aislamiento:** `/api/health` no lee ni expone datos de ninguna institución; ninguna ruta existente cambia su cadena de middlewares.
- [ ] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.
- [ ] `npm run dev` y `npm run build && npm start` en `quartz-api` arrancan sin errores.

## Dependencias
- Ninguna.
- **Siguiente paso:** PR → `develop`, luego `/sdd-release` (Fase 1).
- **Acción manual del usuario:** rotar las contraseñas que estaban en claro en `generate-hash.js` (siguen en el historial desde `30b1284`).

## Trazabilidad
- Backend:  `quartz-api/package.json`, `quartz-api/src/app.ts`, `quartz-api/src/utils/jwtSecret.ts`, `quartz-api/src/features/auth/auth.service.ts`, `quartz-api/src/middlewares/auth.middleware.ts`
- Frontend: `quartz-web/vercel.json`
- Branch:   `feat/INF-11-production-readiness`
