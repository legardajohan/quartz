# ACAD-02 — Tasks

> **Bloqueado por `ACAD-01-subject-management`.** Necesita el shell `ConfigurationPage`, `RoleRoute` y la entrada de menú.

## Preparación
- [ ] Confirmar que ACAD-01 está fusionado en `develop`.
- [ ] Crear rama `feat/ACAD-02-period-settings` desde `develop`.

## Backend (`quartz-api`) — `institution`
- [ ] `institution.types.ts` — crear: `ReportKind`, `IInstitutionSettings`, `IInstitutionDTO`, `UpdateInstitutionSettingsData`.
- [ ] `institution.model.ts` — subdocumento `settings` (`periodsPerYear` default 4, `enabledReports` default ambos, `{ _id: false }`, `default: () => ({})`).
- [ ] `institution.validation.ts` — crear: `updateInstitutionSettingsSchema` con `enabledReports` `.nonempty()`.
- [ ] `institution.service.ts` — crear: `getInstitutionById`, `updateInstitutionSettings`. Resolver por `_id === institutionId` del token (la institución es la raíz del tenant, no lleva `institutionId`); `AppError` 404/422.
- [ ] `institution.controller.ts` — crear. Sin `try/catch`.
- [ ] `institution.routes.ts` — crear: `GET /me`, `PATCH /me` con `authorize([UserRole.JEFE_DE_AREA])`.
- [ ] `app.ts` — montar `app.use('/api/institutions', institutionRoutes)`.

## Backend (`quartz-api`) — `period`
- [ ] `period.types.ts` — crear: `IPeriodDTO`, `CreatePeriodData`, `UpdatePeriodData`.
- [ ] `period.model.ts` — añadir `year` (`required`, `index`) y `closingAlertDate` (`default: null`); `institutionId` → `ref: 'Institution'` (**corrige el bug** `'EducationalInstitution'`, línea 17) + `index: true`; índice parcial único `{ institutionId: 1, isActive: 1 }` donde `isActive: true`.
- [ ] Migración puntual de `year` en los periodos existentes: `updateMany` derivando de `$year: '$startDate'`. Dejar el comando en el PR (ver Nota 3 del `plan.md`).
- [ ] `period.validation.ts` — crear: `createPeriodSchema` (+ `.refine` de fechas), `updatePeriodSchema`, `deletePeriodSchema`. Ninguno acepta `institutionId`.
- [ ] `period.service.ts` — `getPeriodsByInstitution`: añadir `year` y `closingAlertDate` al DTO; añadir `createPeriod` / `updatePeriod` / `deletePeriod` sobre `base.repository`.
- [ ] `period.service.ts` — tope por `settings.periodsPerYear` para el `year` → `AppError(409)`.
- [ ] `period.service.ts` — al activar un periodo, desactivar el resto del tenant (`updateMany`); traducir `E11000` del índice parcial a `AppError(409)`.
- [ ] `period.service.ts` — revalidar `endDate > startDate` y `closingAlertDate >= endDate` sobre el documento fusionado en `PATCH` → `AppError(400)`.
- [ ] `period.controller.ts` — añadir los tres controllers nuevos.
- [ ] `period.routes.ts` — añadir `POST /`, `PATCH /:periodId`, `DELETE /:periodId` con `authorize([UserRole.JEFE_DE_AREA])` + `validate(...)` + `asyncHandler`. `GET /` sin cambios.

## Backend (`quartz-api`) — `report`
- [ ] `report.types.ts:18` — quitar el comentario "Derivado de startDate, el modelo Period no lo almacena".
- [ ] `report.service.ts` — leer `period.year` en lugar de `startDate.getFullYear()`.

## Frontend (`quartz-web`)
- [ ] `features/period/types/` → `api.ts`, `store.ts`, `index.ts`.
- [ ] `features/period/usePeriodStore.ts` — `fetch/create/update/delete`; tras cada mutación sincronizar `useAuthStore.setPeriods(...)`.
- [ ] `features/auth/useAuthStore.ts` — acción `setPeriods(periods)`, análoga al `setSubjects` de ACAD-01.
- [ ] `features/period/components/PeriodForm.tsx` — presentacional; propone `closingAlertDate = endDate + 7 días` editable.
- [ ] `features/period/components/PeriodsPanel.tsx` — `DataTable` + `FormModal` + `ConfirmationModal`; marca del periodo activo.
- [ ] `features/institution/types/` → `api.ts`, `store.ts`, `index.ts`.
- [ ] `features/institution/useInstitutionStore.ts` — `fetchInstitution`, `updateSettings`.
- [ ] `features/institution/components/ReportSettingsPanel.tsx` — checkboxes; submit deshabilitado con ambos desmarcados.
- [ ] `features/configuration/pages/ConfigurationPage.tsx` — añadir pestañas **Periodos** e **Informes**.
- [ ] `features/report/pages/ReportsPage.tsx` y `components/ReportsTable.tsx` — respetar `enabledReports`.
- [ ] Acabado visual con las skills `impeccable`, `emil-design-eng` y `frontend-design`.

## Docs
- [ ] `docs/data-model.md` — `Period` deja de ser "cuatrimestral" por definición: 4 pasa a ser el default de `settings.periodsPerYear`. Documentar `year`, `closingAlertDate` e `Institution.settings`.

## Verificación final
- [ ] `npx tsc --noEmit` en verde (`quartz-api`)
- [ ] `npm run build && npm run lint` en verde (`quartz-web`)
- [ ] Servidor arranca sin errores de compilación ni runtime
- [ ] Repaso de aislamiento: ninguna query sin `institutionId` del token; ningún esquema Zod acepta `institutionId`
- [ ] `GET /api/institutions/me` devuelve los defaults sin haberlos escrito nunca
- [ ] Activar un periodo deja exactamente uno activo en la institución
- [ ] Exceder `periodsPerYear` → `409`; fechas invertidas → `400`
- [ ] Desmarcar un informe se refleja en `/informes`; ambos desmarcados no se puede guardar
- [ ] Docente y Estudiante reciben `403` en `/api/institutions/me` y en las mutaciones de periodos

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented` · PR → `develop`.
