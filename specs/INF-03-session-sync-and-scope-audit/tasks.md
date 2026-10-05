# INF-03 — Tasks

## 1. Modal «Nueva Plantilla» (`quartz-web`)
- [x] `checklist-template/pages/ChecklistsPage.tsx` — `scrollable={false}` en el `FormModal` de crear (`:171`)
- [x] `checklist-template/components/ChecklistCreateForm.tsx` — `menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}` en el `Select` de periodo; `menuProps={{ placement: "bottom" }}` en el de grado
- [x] `quartz-web/docs/known-issues.md` — entrada nueva: síntoma, causa (`DialogBody` con `overflow-y-auto` recorta el listbox del `Select`), fix, regla general y referencias (`dbe601d`, nota 5 de `ACAD-04`)

## 2. Sesión (`quartz-api`)
- [x] `auth/auth.service.ts` — exportar `getSessionData`
- [x] `auth/auth.controller.ts` — `getSessionController`: `res.json({ sessionData: await getSessionData(req.user!) })`
- [x] `auth/auth.routes.ts` — `router.get('/session', authenticateJWT, requireTenant, asyncHandler(getSessionController))`

## 3. Sesión (`quartz-web`)
- [x] `auth/types/api.ts` — `SessionResponse`; eliminar `ProfileResponse`
- [x] `auth/types/store.ts` — `refreshUser` → `refreshSession: () => Promise<void>`
- [x] `auth/useAuthStore.ts` — implementar `refreshSession` (401 → `logout()`; red/5xx → conservar copia persistida, sin tocar `isLoading` ni `error`); borrar `refreshUser`
- [x] `App.tsx` — en `AppRoot`, `useRef` + `useEffect` de montaje que dispara `useAuthStore.getState().refreshSession()` una sola vez

## 4. Periodo activo (`quartz-web`)
- [x] `period/useActivePeriod.ts` — hook nuevo que lee el periodo con `isActive` de `sessionData`
- [x] `student-valuation/components/StudentValuationDetail.tsx` — usar `useActivePeriod()`; cambiar deps del efecto a `[studentId, activePeriod?._id, fetchValuation, clearValuation]`
- [x] `student-valuation/components/StudentValuationDetail.tsx` — rama «No hay un periodo académico activo» entre `if (error)` y `if (!localValuation)`, con CTA a `/gestion/configuracion` solo para Jefe de Área (`usePermissions`)
- [x] `student-valuation/pages/StudentValuationsPage.tsx` — migrar `:51` al hook
- [x] `report/components/IndividualReportsPanel.tsx` — migrar `:26` al hook
- [x] `learning/pages/LearningsPage.tsx` — migrar `:52` al hook
- [x] `concept/pages/ConceptsPage.tsx` — migrar `:54` al hook

## 5. Alcance por sede (`quartz-api`)
- [x] `student-valuation/student-valuation.service.ts` — reescribir `assertStudentInScope` (`:50`): `findByIdScoped(...).select('role schoolId').lean()` → `404` si no existe o `role !== Estudiante` (todos los roles) → `404` si es Docente y `schoolId` no coincide
- [x] `student-valuation/student-valuation.service.ts` — podar `validateAllExist` (`:322`) a `[[Period, periodId, 'Periodo']]`
- [x] `docs/roles-permissions.md` — fila «Eliminar valoración» → `✅ solo de estudiantes de su sede`
- [x] `docs/roles-permissions.md` — nota de sede en el bloque de Evaluaciones
- [x] `docs/roles-permissions.md` — eliminar la nota «Hueco conocido» (`:82`) y reemplazarla por el estado real (cerrado en `VAL-04`)

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde
- [x] `cd quartz-web && npm run build` en verde
- [x] `cd quartz-web && npm run lint`: sin errores nuevos (10 preexistentes al branch base, ajenos a este spec: `.vite/deps` cacheados, `App.tsx` fast-refresh, `any` en `StudentValuationTable`, fast-refresh en `ValuationChecklist` — confirmado con `git stash` contra la base); 1 warning nuevo (`activePeriod` en deps), mismo patrón tolerado que los warnings preexistentes de `periods`
- [x] Servidor arranca sin errores de compilación ni runtime (`npm run dev` en `quartz-api`, `GET /api/auth/session` responde)
- [ ] Manual — `/academico/lista-chequeo`: el `Select` de periodo se ve completo
- [ ] Manual — `quartz-session` en `localStorage` se actualiza al recargar tras un cambio de periodo hecho desde otra sesión
- [ ] Manual — sin periodo activo, `/evaluacion/:studentId` muestra el estado vacío y no dispara ninguna petición a `/student-valuations`
- [ ] Manual — Docente contra estudiante de otra sede: `404` en las 6 rutas; contra uno de su sede: `200`
- [ ] Manual — cualquier rol contra un `:studentId` que no es Estudiante: `404`
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; `schoolId` y `role` siempre de `req.user`

## Definición de «hecho»
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
