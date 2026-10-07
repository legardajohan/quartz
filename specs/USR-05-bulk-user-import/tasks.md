# USR-05 — Tasks

## Preparación
- [x] Rama `feat/USR-05-bulk-user-import` desde `feat/INF-10-concurrency-and-dashboard-freshness`
- [x] `cd quartz-api && npm i exceljs`

## Backend (`quartz-api`)
- [x] `middlewares/upload.middleware.ts` — `uploadSpreadsheetSingle` (campo `file`, xlsx, 1 MB, sin archivo → 422)
- [x] `repositories/base.repository.ts` — `insertManyScoped` (fuerza `institutionId`, `ordered: false`)
- [x] `services/spreadsheet.service.ts` — `buildWorkbook` (hoja `Listas` oculta + validaciones) y `readSheetRows` (firma ZIP, encabezados, filas vacías, celdas → string)
- [x] `features/users/users.types.ts` — `IMPORT_KINDS`, `ImportKind`, `IMPORT_MAX_ROWS`, `ImportRowDTO`, `ImportRowError`, `ImportPreview`, `ImportResult`
- [x] `features/users/users.validation.ts` — `importTemplateSchema`, `previewImportSchema`, `confirmImportSchema` (+ `refine` de máximo por `kind`)
- [x] `features/users/users.service.ts` — exportar `issueInvitation`, `normalizeEmail`, `isStaffRole`
- [x] `features/users/users-import.service.ts` — `IMPORT_COLUMNS`, `loadImportContext`, `parseRawRow`, `checkDuplicates`, `buildImportTemplate`, `previewImport`, `confirmImport` (filtro `institutionId`, `.lean()`, `AppError`, invitaciones secuenciales)
- [x] `features/users/users.controller.ts` — `getImportTemplateController`, `previewImportController`, `confirmImportController` (sin `try/catch`)
- [x] `features/users/users.routes.ts` — 3 rutas **antes de `/:userId`**, `authorize([JEFE_DE_AREA])`, `asyncHandler`

## Frontend (`quartz-web`)
- [x] `features/users/types/api.ts` + `index.ts` — espejo de DTOs de import e `IMPORT_KINDS`
- [x] `features/users/queries/useUserImportQuery.ts` — `downloadImportTemplate`, `usePreviewImportMutation`, `useConfirmImportMutation` (invalida `['users']`, `['dashboard']`)
- [x] `features/users/components/UserImportModal.tsx` — pasos `select → preview → result`, errores 422 en paso 1, reset al cerrar
- [x] `features/users/pages/UsersPage.tsx` — botón "Cargue masivo" junto a "Crear" (solo Jefe de Área), `kind` según pestaña

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`)
- [x] Servidor arranca sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación (pendiente: lo hace el usuario)
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token (salvo unicidad global de correo, ya establecida en USR-04)

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
