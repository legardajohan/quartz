# ACAD-04 — Tasks

## Backend (`quartz-api`)

### Sedes — feature `school`
- [ ] `school.types.ts` (nuevo) — `ISchoolDTO`, `CreateSchoolData`, `UpdateSchoolData`.
- [ ] `school.model.ts` — `institutionId` con `index: true`, `name` con `trim: true`, índice único `{ institutionId, schoolNumber }`.
- [ ] `school.validation.ts` (nuevo) — `createSchoolSchema`, `updateSchoolSchema`, `deleteSchoolSchema` (`.strict()`, helper `objectId`). Ningún esquema acepta `institutionId`.
- [ ] `school.service.ts` — reescribir sin `try/catch` ni `console.error`; `getSchoolsByInstitution` ordenado y `.lean()`; `createSchool` (duplicado `409` + `schoolNumber = max + 1`), `updateSchool` (duplicado `409`, `404`), `deleteSchool` (usuarios asociados `409`, última sede `409`, `404`).
- [ ] `school.controller.ts` — `createSchoolController`, `updateSchoolController`, `deleteSchoolController`; sin `try/catch`, `institutionId` desde `req.user!`.
- [ ] `school.routes.ts` — `POST` / `PATCH /:schoolId` / `DELETE /:schoolId` con `authorize([UserRole.JEFE_DE_AREA])` + `validate` + `asyncHandler`. `GET` sin cambios.

### Jornadas — feature `institution`
- [ ] `institution.types.ts` — `IShiftDTO`, `ShiftInput`, `IShiftSettings`; `IInstitutionSettings` gana `multipleShifts` y `shifts`; `UpdateInstitutionSettingsData` acepta las tres claves.
- [ ] `institution.model.ts` — `ShiftSchema` (con `_id`, `name` requerido y `trim`); `settings.multipleShifts` (`default: false`) y `settings.shifts` (`default: []`).
- [ ] `institution.validation.ts` — `settings` acepta `multipleShifts` y `shifts` (array de `{ _id?, name }`, máx. 10).
- [ ] `institution.service.ts` — `mapInstitutionToDTO` expone jornadas; `updateInstitutionSettings` aplica las validaciones 2→8 del plan (duplicados `422`, lista vacía con switch `422`, jornada en uso `409`, apagado con asignaciones `409`, reconciliación de `_id`); `getShiftSettings` nueva.

### Sesión
- [ ] `auth.types.ts` — `ISessionData` gana `multipleShifts` y `shifts`.
- [ ] `auth.service.ts` — `getShiftSettings` al `Promise.all` de `getSessionData`; volcar ambos campos.

### Asignación al estudiante — feature `users`
- [ ] `auth.model.ts` — `IUser`/`UserSchema` ganan `shiftId` opcional (sin `ref`, con comentario). `toSafeUser()` sin cambios.
- [ ] `users.types.ts` — `Shift`; `UserWithValuations.shift`; `CreateUserDTO.shiftId`.
- [ ] `users.validation.ts` — `shiftId` opcional solo en `createStudentSchema`; `shiftId` nullable en `updateUserSchema.body`.
- [ ] `users.service.ts` — `resolveShiftMap`; `getUsersByFilters` selecciona y resuelve `shift`; `mapUserToDTO` recibe la jornada; `createUser`/`updateUser` validan `shiftId` contra `settings.shifts` (`422`) y `null` hace `$unset`.

## Frontend (`quartz-web`)

- [ ] Skills de diseño **antes** de escribir UI: `impeccable`, `emil-design-eng`, `frontend-design`.
- [ ] `types/domain.ts` — `Shift`; `ISessionData` gana `multipleShifts` y `shifts`.
- [ ] `features/auth/types/store.ts` + `useAuthStore.ts` — `setShifts`.
- [ ] `features/school/types/{store.ts,api.ts,index.ts}` — `SchoolDto`, `SchoolState`, `NewSchool`, `UpdateSchool`.
- [ ] `features/school/useSchoolStore.ts` — `fetch/create/update/deleteSchool` vía `apiClient`.
- [ ] `features/school/components/SchoolForm.tsx` — presentacional; `schoolNumber` solo lectura al editar.
- [ ] `features/school/components/SchoolsPanel.tsx` — `DataTable` + `FormModal` + `ConfirmationModal`.
- [ ] `features/institution/types/{store.ts,api.ts}` — `ShiftDto`; `InstitutionSettingsDto` gana `multipleShifts` y `shifts`.
- [ ] `features/institution/components/ShiftsPanel.tsx` — `Switch` + lista editable de `Input`; guardado único; submit deshabilitado sin cambios / con lista vacía / con nombres repetidos o vacíos.
- [ ] `features/institution/useInstitutionStore.ts` — sincronizar `setShifts` tras `updateSettings`.
- [ ] `features/configuration/pages/ConfigurationPage.tsx` — quinto paso «Sedes y jornadas» con ambos paneles; actualizar el subtítulo a cinco pasos.
- [ ] `features/users/types/api.ts` — `UserDto.shift`; `NewUser.shiftId`; `UpdateUser.shiftId` nullable.
- [ ] `features/users/components/UserForm.tsx` — `shiftId` en `UserFormData` e `isDirty`; `Select` «Jornada (opcional)» condicionado a `!isTeacher && multipleShifts && shifts.length > 0`, con opción «Sin jornada» y `menuProps` ajustado.
- [ ] `features/users/pages/UsersPage.tsx` — pasar `multipleShifts`/`shifts` desde `sessionData`; `shiftId` en los payloads (`undefined` al crear, `null` al editar); jamás en la validación de obligatorios.
- [ ] `features/users/components/UsersTable.tsx` — jornada como subtítulo de la columna Sede cuando `multipleShifts`.

## Docs
- [ ] `docs/data-model.md` — filas `Institution`, `School` y `User` (ver Nota 9 del plan).

## Verificación final
- [ ] `cd quartz-api && npx tsc --noEmit` en verde.
- [ ] `cd quartz-web && npm run build && npm run lint` en verde.
- [ ] Servidor arranca sin errores de compilación ni runtime.
- [ ] Recorrer la lista de Verificación del `plan.md` (consecutivo de `schoolNumber`, los cinco `409`, los tres `422`, switch apagado sin cambios de comportamiento).
- [ ] Repaso de aislamiento: ninguna query sin `institutionId` del token; ningún esquema Zod acepta `institutionId`; los `countDocuments` llevan `institutionId` explícito.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
