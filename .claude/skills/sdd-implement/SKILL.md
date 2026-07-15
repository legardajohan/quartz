---
name: sdd-implement
description: Implementa un feature SDD de Quartz ejecutando sus tasks (specs/<ID>-<slug>/tasks.md), creando la rama feat/<ID>-<slug> y el código en quartz-api/ y/o quartz-web/. Úsala con /sdd-implement <ID>-<slug>.
argument-hint: <ID>-<slug>
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(git status *), Bash(git branch *), Bash(git checkout *), Bash(git add *), Bash(npx tsc *), Bash(npm run *)
---

# SDD · Fase 2 — Implementación

**Rol:** Sr Software Developer.

- **Entrada:** `$ARGUMENTS` = `<ID>-<slug>`. Lee `specs/<ID>-<slug>/{spec,plan,tasks}.md`.
- **Salida:** código en `quartz-api/src/features/<feature>/` y/o `quartz-web/src/features/<feature>/`.
- **No escribas tests ni documentación** (los tests quedan pendientes de runner; las docs van en `/sdd-release`).

> **Reglas de código (no se repiten aquí):** skills `quartz-feature-scaffold`, `typescript-strict-mode`, `clean-code-solid` + `quartz-api/CLAUDE.md` (backend: CommonJS, funcional, 6 archivos) y `quartz-web/CLAUDE.md` (front: `apiClient`, Zustand, Tailwind).
> **Negocio y datos:** `docs/domain.md`, `docs/data-model.md`, `docs/data-base.md`.
> **Multi-tenancy:** `institutionId` **siempre** desde el token. Una fuga entre instituciones es severidad máxima.

## Pasos
1. Lee el `plan` y las `tasks`. ¿Algo ambiguo o en conflicto con el `spec`? **Pregunta antes de codear.**
2. **Git:** árbol limpio → crea la rama `feat/<ID>-<slug>` desde `develop`.
3. **Código:** ejecuta las tasks **en orden**, lo mínimo para cubrir los criterios EARS.
   - Backend: `types → model → validation → service → controller → routes` → montar en `app.ts`.
   - Frontend: `types → store → components → page` → ruta en `App.tsx`.
   - Nada fuera del `plan`. Si aparece algo necesario y no planeado, dilo y anótalo en el `plan`.
4. Marca las casillas de `tasks.md` a medida que avanzas.
5. **No cierres hasta verde:**
   - `cd quartz-api && npx tsc --noEmit` (no hay script `typecheck`).
   - `cd quartz-web && npm run build && npm run lint` (si tocaste el front).
   - `npm run dev` en los paquetes tocados: arranca sin errores de compilación ni de runtime en consola.
6. Verde → marca los criterios cubiertos en `spec.md` y cambia `status: draft` (o `approved`) a `status: implemented`.

## Antes de cerrar
- [ ] Rama `feat/<ID>-<slug>` creada desde `develop`.
- [ ] Código conforme a las skills y los `CLAUDE.md`.
- [ ] **Aislamiento:** toda query filtra `institutionId` del token; ninguna escritura lo toma del `body`/`params`.
- [ ] Servicios lanzan `AppError`; controllers sin `try/catch`; routes con `asyncHandler`.
- [ ] Todas las casillas de `tasks.md` marcadas.
- [ ] `npx tsc --noEmit` en verde; `build && lint` en verde si aplica; servidor arranca limpio.
- [ ] Criterios EARS marcados y `spec.md` con `status: implemented`.
- [ ] Sin tests ni documentación.
