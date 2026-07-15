# ACAD-02 — Tasks

> **Bloqueado por `ACAD-01-subject-management`.** Necesita el shell `ConfigurationPage`, `RoleRoute` y la entrada de menú.

## Preparación
- [x] Confirmar que ACAD-01 está fusionado en `develop`. — Rama creada desde `feat/ACAD-01-subject-management` (commiteada y pusheada), no desde `develop`: ACAD-01 aún no tiene PR mergeado; decisión del usuario.
- [x] Crear rama `feat/ACAD-02-period-settings`.

## Backend (`quartz-api`) — `institution`
- [x] `institution.types.ts` — crear: `ReportKind`, `IInstitutionSettings`, `IInstitutionDTO`, `UpdateInstitutionSettingsData`.
- [x] `institution.model.ts` — subdocumento `settings` (`enabledReports` default ambos, `{ _id: false }`, `default: () => ({})`).
- [x] `institution.validation.ts` — crear: `updateInstitutionSettingsSchema`. `enabledReports` **sin** `.nonempty()` (a diferencia del plan): el vacío debe traducirse a `422` desde el service, no a `400` de Zod. Ver plan.md.
- [x] `institution.service.ts` — crear: `getInstitutionById`, `updateInstitutionSettings`, y **`getEnabledReports`** (no estaba en el plan original, ver Nota 0). Resuelve por `_id === institutionId` del token; `AppError` 404/422.
- [x] `institution.controller.ts` — crear. Sin `try/catch`.
- [x] `institution.routes.ts` — crear: `GET /me`, `PATCH /me` con `authorize([UserRole.JEFE_DE_AREA])`.
- [x] `app.ts` — montar `app.use('/api/institutions', institutionRoutes)`.

## Backend (`quartz-api`) — `period`
- [x] `period.types.ts` — crear: `IPeriodDTO`, `CreatePeriodData`, `UpdatePeriodData`.
- [x] `period.model.ts` — añadir `year` (`required`, `index`) y `closingAlertDate` (`default: null`); `institutionId` → `ref: 'Institution'` (**corrige el bug** `'EducationalInstitution'`, línea 17) + `index: true`; índice parcial único `{ institutionId: 1, isActive: 1 }` donde `isActive: true`. **Corrección adicional sobre el plan:** `isActive` default `true` → `false` (el default original hacía que cada periodo nuevo naciera activo sin pasar por la desactivación de los demás; ver plan.md Nota 1 actualizada).
- [x] Migración puntual de `year`: `quartz-api/scripts/migrate-period-year.js` (`updateMany` con `$year: '$startDate'`), a ejecutar una vez con `node scripts/migrate-period-year.js`.
- [x] `period.validation.ts` — crear: `createPeriodSchema` (+ `.refine` de fechas), `updatePeriodSchema`, `deletePeriodSchema`. Ninguno acepta `institutionId`.
- [x] `period.service.ts` — `getPeriodsByInstitution`: añade `year` y `closingAlertDate` al DTO (vía controller mapper); añade `createPeriod` / `updatePeriod` / `deletePeriod` sobre `base.repository`.
- [x] ~~`period.service.ts` — tope por `settings.periodsPerYear` para el `year` → `AppError(409)`.~~ Revertido — ver `spec.md` Addendum: sin límite de cantidad de periodos por año.
- [x] `period.service.ts` — al activar un periodo, desactivar el resto del tenant (`updateMany`); traducir `E11000` del índice parcial a `AppError(409)`.
- [x] `period.service.ts` — revalidar `endDate > startDate` y `closingAlertDate >= endDate` sobre el documento fusionado en `PATCH` → `AppError(400)`.
- [x] `period.controller.ts` — añadir los tres controllers nuevos + mapper a `IPeriodDTO`.
- [x] `period.routes.ts` — añadir `POST /`, `PATCH /:periodId`, `DELETE /:periodId` con `authorize([UserRole.JEFE_DE_AREA])` + `validate(...)` + `asyncHandler`. `GET /` sin cambios.

## Backend (`quartz-api`) — `report`
- [x] `report.types.ts:18` — quitar el comentario "Derivado de startDate, el modelo Period no lo almacena".
- [x] `report.service.ts` — leer `period.year` en lugar de `startDate.getFullYear()`.

## Backend (`quartz-api`) — `auth` (añadido, ver plan.md Nota 0)
- [x] `auth/auth.types.ts` — `ISessionData` gana `enabledReports: ReportKind[]`.
- [x] `auth/auth.service.ts` — `getSessionData()` puebla `enabledReports` vía `institution.service.ts:getEnabledReports`. Necesario porque `/informes` es visible para `Docente`, que no puede llamar `GET /api/institutions/me` (solo Jefe de Área).

## Frontend (`quartz-web`)
- [x] `features/period/types/` → `api.ts`, `store.ts`, `index.ts`.
- [x] `features/period/usePeriodStore.ts` — `fetch/create/update/delete`; tras cada mutación sincroniza `useAuthStore.setPeriods(...)`.
- [x] `features/auth/useAuthStore.ts` — acción `setPeriods(periods)` + **`setEnabledReports(enabledReports)`** (añadida, ver plan.md Nota 0).
- [x] `features/period/components/PeriodForm.tsx` — presentacional; propone `closingAlertDate = endDate + 7 días` editable, con botón para quitarla.
- [x] `features/period/components/PeriodsPanel.tsx` — `DataTable` + `FormModal` + `ConfirmationModal`; marca del periodo activo. **Ajuste posterior (ver spec.md Addendum):** columna "Año" retirada de la tabla, columna "Fechas" separada en "Inicio" y "Cierre"; control de "Periodos por año" agregado y luego retirado junto con `periodsPerYear`.
- [x] `features/institution/types/` → `api.ts`, `store.ts`, `index.ts`.
- [x] `features/institution/useInstitutionStore.ts` — `fetchInstitution`, `updateSettings` (sincroniza `setEnabledReports` tras éxito).
- [x] `features/institution/components/ReportSettingsPanel.tsx` — checkboxes de informes habilitados (un solo PATCH); submit deshabilitado con ambos desmarcados o sin cambios.
- [x] `features/configuration/pages/ConfigurationPage.tsx` — añadidas pestañas **Periodos** e **Informes** como flujo guiado de 3 pasos numerados (Dimensiones → Periodos → Informes), navegación libre entre pestañas.
- [x] `features/report/pages/ReportsPage.tsx` y `components/ReportsTable.tsx` — leen `sessionData.enabledReports` (no `/institutions/me`, por el motivo de rol arriba) y ocultan el ícono del informe deshabilitado.
- [x] Acabado visual con las skills `impeccable`, `emil-design-eng` y `frontend-design`.

## Docs
- [x] `docs/data-model.md` — `Period` deja de describirse como "cuatrimestral" fijo; documentado `year`, `closingAlertDate`, índice de periodo único activo e `Institution.settings`. De paso, corregida una inexactitud preexistente: `Subject.institutionId` ya no es opcional/global desde ACAD-01 (la fila aún decía "Opcional (nulo = global)").

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`)
- [x] Servidor arranca sin errores de compilación ni runtime
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; ningún esquema Zod acepta `institutionId`
- [x] `GET /api/institutions/me` devuelve los defaults sin haberlos escrito nunca
- [x] Activar un periodo deja exactamente uno activo en la institución
- [x] Fechas invertidas → `400`; sin límite en la cantidad de periodos por año
- [x] Desmarcar un informe se refleja en `/informes`; ambos desmarcados no se puede guardar
- [x] Docente y Estudiante reciben `403` en `/api/institutions/me` y en las mutaciones de periodos

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented` · PR → `develop`.
