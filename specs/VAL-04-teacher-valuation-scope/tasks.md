# VAL-04 — Tasks

## Backend (`quartz-api`)
- [x] `student-valuation.types.ts` — declarar `RequestorScope { role: UserRole; schoolId?: string }`
- [x] `student-valuation.service.ts` — helper `assertStudentInScope(studentId, institutionId, scope)`: no-op para Jefe de Área, `AppError('Valoración no encontrada.', 404)` para Docente fuera de su sede
- [x] `student-valuation.service.ts` — aplicar el guard en `initializeStudentValuation` (antes de crear)
- [x] `student-valuation.service.ts` — aplicar el guard en `getStudentValuations`
- [x] `student-valuation.service.ts` — aplicar el guard en `getStudentValuationById` (tras el `findOneScoped`)
- [x] `student-valuation.service.ts` — aplicar el guard en `updateStudentValuation` (tras el 404 de tenant, antes de mutar)
- [x] `student-valuation.service.ts` — aplicar el guard en `updateValuationConcepts`
- [x] `student-valuation.service.ts` — reescribir `deleteStudentValuation`: `findOneScoped` → guard → `deleteOneScoped`
- [x] `student-valuation.controller.ts` — armar `scope` desde `req.user!.role` / `req.user!.schoolId?.toString()` y propagarlo en los 6 controllers
- [x] `student-valuation.routes.ts` — añadir `UserRole.DOCENTE` al `authorize` del `DELETE /:valuationId`

## Frontend (`quartz-web`)
- [x] `components/StudentValuationDetail.tsx` — quitar `PHOTO_UPLOAD_ROLES`, `canUploadPhoto`, `useUploadStudentPhotoMutation`, `handlePhotoUpload` y la rama `ImageCropUploader`; dejar `<Avatar>` de solo lectura
- [x] `components/StudentValuationDetail.tsx` — limpiar imports que queden sin usar (`ImageCropUploader`, `Progress`)
- [x] `pages/StudentValuationsPage.tsx` — `usePermissions()` + preselección de la sede del Jefe de Área con guard `useRef`
- [x] `pages/StudentValuationsPage.tsx` — omitir el grupo de filtro "Sede" cuando el rol no es Jefe de Área

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde
- [x] `cd quartz-web && npm run build && npm run lint` en verde
- [x] Servidor arranca sin errores de compilación ni runtime
- [ ] Las 6 rutas devuelven `404` a un Docente contra un estudiante de otra sede, y `200` contra uno de la suya (prueba manual pendiente del usuario)
- [ ] Docente: `/evaluacion` sin filtro "Sede", CRUD completo sobre sus estudiantes (manual)
- [ ] Jefe de Área: `/evaluacion` con su sede preseleccionada y modificable (manual)
- [ ] `/evaluacion/:studentId` sin uploader de foto en ambos roles (manual)
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; `schoolId` siempre de `req.user`

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
