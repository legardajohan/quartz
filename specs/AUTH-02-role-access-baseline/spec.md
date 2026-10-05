---
id: AUTH-02-role-access-baseline
feature: role-access-baseline
status: implemented
created: 2026-09-15
---

# AUTH-02 — Base de acceso por rol (spec)

## Objetivo
Centralizar las reglas de permiso de UI en una fuente única y limpiar las superficies muertas de navegación, para que las specs `VAL-04` y `USR-02` construyan sobre una base común en vez de duplicar `role === 'Jefe de Área'` por pantalla.

## Alcance
**Incluye:**
- Hook `usePermissions` en `quartz-web` como única fuente de verdad de permisos de UI.
- Migración de los consumidores actuales de la regla de ownership (`ConceptsPage`, `ChecklistsPage`) al hook.
- Eliminación completa de `/gestion/consolidados` (sidebar + ruta + feature).
- Endurecimiento de tipos: `UserRole` en lugar de strings en `learning.routes.ts` y `concept.routes.ts`.
- Cierre de la superficie `institutionId` en el query de `GET /api/learnings`.

**Fuera:**
- Cambios de permisos efectivos: ningún rol gana ni pierde acceso en esta spec.
- Gating de pantallas (va en `USR-02`) y aislamiento por sede (va en `VAL-04`).
- Rol `Estudiante`: sigue sin acciones en esta fase.

## Criterios de aceptación (EARS)
- [x] Cuando un componente necesita saber si el usuario puede gestionar un recurso propio, el sistema expone esa decisión desde `usePermissions` y no desde una comparación literal en la página.
- [x] Cuando `ConceptsPage` o `ChecklistsPage` evalúan `canManage`, el sistema resuelve la regla a través de `usePermissions().canManageOwned(authorId)`.
- [x] Cuando cualquier rol abre el sidebar, el sistema no muestra el ítem "Consolidados".
- [x] Si un usuario navega a `/gestion/consolidados`, el sistema responde con la vista 404 de `App.tsx` (la ruta deja de existir).
- [x] Cuando se registran las rutas de `learning` y `concept`, el sistema declara los roles con el enum `UserRole` y no con literales de texto.
- [x] Si una petición a `GET /api/learnings` envía `institutionId` en el query, el sistema la rechaza por validación Zod.
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`/`query`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- Ninguna. Es la base de `VAL-04-teacher-valuation-scope` y `USR-02-teacher-ui-permissions`.

## Trazabilidad
- Backend:  `quartz-api/src/features/learning/`, `quartz-api/src/features/concept/`
- Frontend: `quartz-web/src/features/auth/`, `quartz-web/src/components/layouts/`, `quartz-web/src/App.tsx`
- Branch:   `feat/AUTH-02-role-access-baseline`
