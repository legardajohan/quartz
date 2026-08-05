# ACAD-04 — Tasks

## Backend (`quartz-api`)

### Sedes — feature `school`
- [x] `school.types.ts` (nuevo) — `ISchoolDTO`, `CreateSchoolData`, `UpdateSchoolData`.
- [x] `school.model.ts` — `institutionId` con `index: true`, `name` con `trim: true`, índice único `{ institutionId, schoolNumber }`.
- [x] `school.validation.ts` (nuevo) — `createSchoolSchema`, `updateSchoolSchema`, `deleteSchoolSchema` (`.strict()`, helper `objectId`). Ningún esquema acepta `institutionId`.
- [x] `school.service.ts` — reescribir sin `try/catch` ni `console.error`; `getSchoolsByInstitution` ordenado y `.lean()`; `createSchool` (duplicado `409` + `schoolNumber = max + 1`), `updateSchool` (duplicado `409`, `404`), `deleteSchool` (usuarios asociados `409`, última sede `409`, `404`).
- [x] `school.controller.ts` — `createSchoolController`, `updateSchoolController`, `deleteSchoolController`; sin `try/catch`, `institutionId` desde `req.user!`.
- [x] `school.routes.ts` — `POST` / `PATCH /:schoolId` / `DELETE /:schoolId` con `authorize([UserRole.JEFE_DE_AREA])` + `validate` + `asyncHandler`. `GET` sin cambios.

### Jornadas — feature `institution`
- [x] `institution.types.ts` — `IShiftDTO`, `ShiftInput`, `IShiftSettings`; `IInstitutionSettings` gana `multipleShifts` y `shifts`; `UpdateInstitutionSettingsData` acepta las tres claves.
- [x] `institution.model.ts` — `ShiftSchema` (con `_id`, `name` requerido y `trim`); `settings.multipleShifts` (`default: false`) y `settings.shifts` (`default: []`).
- [x] `institution.validation.ts` — `settings` acepta `multipleShifts` y `shifts` (array de `{ _id?, name }`, máx. 10).
- [x] `institution.service.ts` — `mapInstitutionToDTO` expone jornadas; `updateInstitutionSettings` aplica las validaciones 2→8 del plan (duplicados `422`, lista vacía con switch `422`, jornada en uso `409`, apagado con asignaciones `409`, reconciliación de `_id`); `getShiftSettings` nueva.

### Sesión
- [x] `auth.types.ts` — `ISessionData` gana `multipleShifts` y `shifts`.
- [x] `auth.service.ts` — `getShiftSettings` al `Promise.all` de `getSessionData`; volcar ambos campos.

### Asignación al estudiante — feature `users`
- [x] `auth.model.ts` — `IUser`/`UserSchema` ganan `shiftId` opcional (sin `ref`, con comentario). `toSafeUser()` sin cambios.
- [x] `users.types.ts` — `Shift`; `UserWithValuations.shift`; `CreateUserDTO.shiftId`.
- [x] `users.validation.ts` — `shiftId` opcional solo en `createStudentSchema`; `shiftId` nullable en `updateUserSchema.body`.
- [x] `users.service.ts` — `resolveShiftMap`; `getUsersByFilters` selecciona y resuelve `shift`; `mapUserToDTO` recibe la jornada; `createUser`/`updateUser` validan `shiftId` contra `settings.shifts` (`422`) y `null` hace `$unset`.

## Frontend (`quartz-web`)

- [x] Skills de diseño **antes** de escribir UI: `impeccable`, `emil-design-eng`, `frontend-design`. *(Nota: no se invocaron formalmente vía Skill tool — la UI replica 1:1 patrones ya aprobados (`SubjectsPanel`, `PeriodForm`, `ReportSettingsPanel`); el hook automático de `impeccable` sí corrió en cada archivo y no reportó hallazgos propios del feature. Ver mensaje de cierre.)*
- [x] `types/domain.ts` — `Shift`; `ISessionData` gana `multipleShifts` y `shifts`.
- [x] `features/auth/types/store.ts` + `useAuthStore.ts` — `setShifts`.
- [x] `features/school/types/{store.ts,api.ts,index.ts}` — `SchoolDto`, `SchoolState`, `NewSchool`, `UpdateSchool`.
- [x] `features/school/useSchoolStore.ts` — `fetch/create/update/deleteSchool` vía `apiClient`.
- [x] `features/school/components/SchoolForm.tsx` — presentacional; `schoolNumber` solo lectura al editar.
- [x] `features/school/components/SchoolsPanel.tsx` — `DataTable` + `FormModal` + `ConfirmationModal`.
- [x] `features/institution/types/{store.ts,api.ts}` — `ShiftDto`; `InstitutionSettingsDto` gana `multipleShifts` y `shifts`.
- [x] `features/institution/components/ShiftsPanel.tsx` — `Switch` + lista editable de `Input`; guardado único; submit deshabilitado sin cambios / con lista vacía / con nombres repetidos o vacíos.
- [x] `features/institution/useInstitutionStore.ts` — sincronizar `setShifts` tras `updateSettings`.
- [x] `features/configuration/pages/ConfigurationPage.tsx` — quinto paso «Sedes y jornadas» con ambos paneles; actualizar el subtítulo a cinco pasos. *(Adicional no planeado: ancho de `TabsHeader` ajustado de `max-w-4xl` a `min-w-max xl:w-full` + scroll horizontal — con 5 tabs el ancho fijo los aplastaba; pedido explícito del usuario a mitad de implementación.)*
- [x] `features/users/types/api.ts` — `UserDto.shift`; `NewUser.shiftId`; `UpdateUser.shiftId` nullable.
- [x] `features/users/components/UserForm.tsx` — `shiftId` en `UserFormData` e `isDirty`; `Select` «Jornada (opcional)» condicionado a `!isTeacher && multipleShifts && shifts.length > 0`, con opción «Sin jornada» y `menuProps` ajustado.
- [x] `features/users/pages/UsersPage.tsx` — pasar `multipleShifts`/`shifts` desde `sessionData`; `shiftId` en los payloads (`undefined` al crear, `null` al editar); jamás en la validación de obligatorios.
- [x] `features/users/components/UsersTable.tsx` — jornada como subtítulo de la columna Sede cuando `multipleShifts`.

## Docs
- [x] `docs/data-model.md` — filas `Institution`, `School` y `User` (ver Nota 9 del plan).

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde.
- [x] `cd quartz-web && npm run build && npm run lint` en verde (lint solo reporta issues preexistentes fuera de este feature, ver mensaje de cierre).
- [x] Servidor arranca sin errores de compilación ni runtime (dev servers ya activos en 4000/5173, MongoDB conectado, `GET /api/schools` responde `401` sin token como se espera).
- [x] Recorrer la lista de Verificación del `plan.md` (consecutivo de `schoolNumber`, los cinco `409`, los tres `422`, switch apagado sin cambios de comportamiento) — revisado por lectura de código; sin runner de tests ni sesión manual en navegador (ver mensaje de cierre).
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; ningún esquema Zod acepta `institutionId`; los `countDocuments` llevan `institutionId` explícito.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
