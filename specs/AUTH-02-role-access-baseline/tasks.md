# AUTH-02 — Tasks

## Backend (`quartz-api`)
- [x] `learning/learning.validation.ts` — quitar `institutionId` de `getAllLearningsSchema.query`
- [x] `learning/learning.types.ts` — declarar `ILearningFilter` (`subjectId`, `periodId`, `userId`, `grade`, todos opcionales)
- [x] `learning/learning.service.ts` — tipar `getAllLearnings(institutionId, filter: ILearningFilter)` y descartar claves `undefined`
- [x] `learning/learning.controller.ts` — armar el filtro explícito en vez de reenviar `req.query`
- [x] `learning/learning.routes.ts` — `UserRole.JEFE_DE_AREA` / `UserRole.DOCENTE` en los 4 `authorize`
- [x] `concept/concept.routes.ts` — `const allowedRoles = [UserRole.JEFE_DE_AREA, UserRole.DOCENTE]`

## Frontend (`quartz-web`)
- [x] `features/auth/usePermissions.ts` — hook nuevo (`isAreaLead`, `isTeacher`, `userId`, `schoolId`, `canManageOwned`), con selectores de `useAuthStore`
- [x] `features/concept/pages/ConceptsPage.tsx` — migrar `canManage` a `canManageOwned(concept.author._id)`
- [x] `features/checklist-template/pages/ChecklistsPage.tsx` — migrar `canManage` a `canManageOwned(template.author._id)`
- [x] `components/layouts/SidebarMenu.tsx` — eliminar el subítem "Consolidados" (id 52)
- [x] `App.tsx` — eliminar el import y la ruta `/gestion/consolidados`
- [x] Borrar `src/features/consolidated/`

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde
- [x] `cd quartz-web && npm run build && npm run lint` en verde
- [x] Servidor arranca sin errores de compilación ni runtime
- [x] Sidebar sin "Consolidados" en ambos roles; `/gestion/consolidados` cae en 404
- [x] Conceptos y Listas de Chequeo: mismo comportamiento que antes en ambos roles
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; `GET /api/learnings?institutionId=...` rechazado por Zod

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
