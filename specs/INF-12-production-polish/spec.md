---
id: INF-12-production-polish
feature: production-polish
status: implemented          # draft | approved | implemented | released
created: 2026-10-22
---

# INF-12 — Ajustes post-despliegue: rutas en la raíz, sidebar en producción, login liviano (spec)

## Objetivo
Corregir tres problemas vistos tras el primer despliegue:
- El doble `api` en `https://api.quartzedu.co/api/...`.
- El sidebar se ve blanco en producción.
- El panel del login tarda en cargar por una foto de 402 KB.

## Alcance
**Incluye:**
- `quartz-api`: rutas montadas solo en la raíz (`/health`, `/auth`, …), sin prefijo `/api` (el alias de transición se descartó: corte directo, con despliegue coordinado de API y Vercel).
- `quartz-web`: comillas en el `url()` del fondo del sidebar (`SidebarMenu.tsx`).
- `quartz-web`: el panel de presentación del login usa la ilustración SVG `src/assets/images/login-illustration.svg` sobre el degradado de marca, en lugar de `login-bg.jpg`.
- Actualizar `.env` local, `quartz-api/CLAUDE.md`, la skill `quartz-feature-scaffold` y `quartz-web/docs/known-issues.md`.

**Fuera:**
- Alias `/api` de compatibilidad.
- Versionado `/v1`, reglas de Cloudflare y proxy de dominio único.
- Reescribir specs históricos que citan `/api/...`.
- Cambios en `credentials: true` de CORS.
- Rediseño del formulario de login.

## Criterios de aceptación (EARS)
- [x] Cuando se recibe `GET /health`, la API responde `200 { "status": "ok" }` sin autenticación.
- [x] Cuando se recibe una petición a `/<recurso>` (p. ej. `POST /auth/login`), la API la atiende con la misma cadena de middlewares que hoy tiene `/api/<recurso>`.
- [x] Cuando se recibe una petición con el prefijo antiguo (`/api/<recurso>`), la API responde `404`.
- [ ] Cuando `quartz-web` corre con `VITE_API_BASE_URL=http://localhost:4000`, login y navegación funcionan sin `404`. _(prueba manual del usuario)_
- [x] Cuando se sirve el build de producción (`npm run build && npm run preview`), el `background` inline del sidebar lleva el SVG en `url("…")` con comillas y el sidebar muestra el degradado morado. _(comillas verificadas en `dist`; degradado: prueba visual del usuario)_
- [x] Cuando se abre `/login`, el panel de presentación no descarga `login-bg.jpg`. Muestra `login-illustration.svg` como `<img>` decorativa (`alt=""`, `aria-hidden="true"`, `width`/`height` fijos) sobre el degradado.
- [x] El acento de la ilustración (`#6c63ff`) queda recoloreado con un tono de la paleta de `tailwind.config.js` que contrasta con el degradado.
- [x] `src/assets/images/login-bg.jpg` no existe y nada lo importa.
- [x] `quartz-web/docs/known-issues.md` documenta el bug: un asset inline de Vite dentro de `url()` sin comillas.
- [x] **Aislamiento:** ninguna ruta cambia su cadena `authenticateJWT → requireTenant → …`. `/health` no lee ni expone datos de ninguna institución.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- INF-11 (`/api/health`, despliegue en App Platform y Vercel).
- **Acciones manuales del usuario, en orden:**
  1. En Vercel, poner `VITE_API_BASE_URL=https://api.quartzedu.co`.
  2. Desplegar la API y redeployar Vercel en la misma ventana (sin alias, el web viejo falla contra la API nueva).
  3. Cambiar el health check de App Platform a `/health`.

## Trazabilidad
- Backend:  `quartz-api/src/app.ts`, `quartz-api/CLAUDE.md`
- Frontend: `quartz-web/src/components/layouts/SidebarMenu.tsx`, `quartz-web/src/features/auth/components/PresentationPanel.tsx`, `quartz-web/src/assets/images/`, `quartz-web/docs/known-issues.md`, `quartz-web/.env`
- Skill:    `.claude/skills/quartz-feature-scaffold/SKILL.md`
- Branch:   `feat/INF-12-production-polish`
