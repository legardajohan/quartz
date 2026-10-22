# INF-12 — Tasks

## Backend (`quartz-api`)
- [x] `src/app.ts`: mover `/health` y los 12 routers a un `express.Router()`.
- [x] `src/app.ts`: montar el router solo en `'/'` (sin alias `/api`).
- [x] `CLAUDE.md`: paso 7, montar el feature en el router raíz sin `/api`.

## Frontend (`quartz-web`)
- [x] `SidebarMenu.tsx`: `url("${starryBackground}")` con comillas, más un comentario.
- [x] `docs/known-issues.md`: entrada "asset inline de Vite en `url()` sin comillas → `background` descartado en producción".
- [x] Invocar las skills `emil-design-eng`, `impeccable` y `frontend-design`.
- [x] `login-illustration.svg`: recolorear el acento `#6c63ff` y revisar el contraste de los grises oscuros.
- [x] `PresentationPanel.tsx`: quitar la foto y el overlay, poner el degradado opaco y la `<img>` decorativa sobre el logo.
- [x] Borrar `src/assets/images/login-bg.jpg`.
- [x] `.env`: `VITE_API_BASE_URL="http://localhost:4000"` (aplicado por el usuario).

## Raíz
- [x] `.claude/skills/quartz-feature-scaffold/SKILL.md:21`: montaje sin `/api`.
- [ ] Borrar `images-background/` (material de trabajo, sin versionar). _(pendiente de confirmación del usuario)_

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`).
- [x] `npm run build && npm run lint` en verde (`quartz-web`).
- [x] `/health` responde 200 en local.
- [x] El build contiene `url("data:image/svg+xml`.
- [x] Repaso de aislamiento: ninguna cadena de middlewares cambió.

## Post-merge (manual, usuario)
- [ ] Vercel: `VITE_API_BASE_URL=https://api.quartzedu.co`.
- [ ] Desplegar API y redeployar Vercel en la misma ventana.
- [ ] Health check de App Platform → `/health`.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
