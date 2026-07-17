# USR-01 — Tasks

## Backend (`quartz-api`)
- [x] `auth.model.ts` — quitar `unique:true` de `identificationNumber`; añadir índice compuesto único `{ institutionId, identificationNumber }`; corregir `ref` de `institutionId` a `'Institution'`.
- [x] `users.types.ts` — añadir `CreateUserDTO` y `UpdateUserDTO` (rol inmutable en update).
- [x] `users.validation.ts` — `createUserSchema` (discriminated union por `role`: Estudiante = 1 grado / sin credenciales; Docente = email+password+grados≥1); `updateUserSchema` (parcial, sin `role`); `deleteUserSchema`; renombrar param `studentId`→`userId` en `uploadUserPhotoSchema`.
- [x] `users.service.ts`:
  - [x] Extender `getUsersByFilters` a `role=Docente` (solo Jefe de Área; docente → `[]`), filtro `schoolId` opcional, `institutionId` del token.
  - [x] `createUser` — validar `schoolId` scoped (422); unicidad de `identificationNumber` en tenant (409); Docente: email único global (409) + `bcrypt.hash`; `createScoped`; devolver DTO con `school`.
  - [x] `updateUser` — `findByIdScoped` (404); `role` inmutable; re-hash password si viene; revalidar identificación/sede si cambian; devolver DTO.
  - [x] `deleteUser` — `findOneAndDeleteScoped` (404); borrar avatar en R2 best-effort.
  - [x] Generalizar `uploadStudentPhoto` → `uploadUserPhoto` (docente sigue restringido a estudiantes de su sede).
- [x] `users.controller.ts` — `createUserController`, `updateUserController`, `deleteUserController`, `uploadUserPhotoController` (sin `try/catch`; `institutionId` del token).
- [x] `users.routes.ts` — POST `/`, PATCH `/:userId`, DELETE `/:userId` con `authorize([JEFE_DE_AREA])`; ajustar ruta de foto a `/:userId/photo`; `asyncHandler` en todos.
- [x] `app.ts` — sin cambios (`/api/users` ya montado).

## Frontend (`quartz-web`)
- [x] `types/api.ts` — `NewUser`, `UpdateUser`.
- [x] `queries/useUsersQuery.ts` — `useCreateUserMutation`, `useUpdateUserMutation`, `useDeleteUserMutation` (invalidan `['users']`); mantener `useUsersQuery` y `useUploadStudentPhotoMutation`.
- [x] `queries/useSchoolsQuery.ts` — `GET /schools`.
- [x] `components/UsersTable.tsx` — `DataTable` (NOMBRE con avatar+nombre, IDENTIFICACIÓN, GRADO, SEDE, ACCIONES); acciones solo si Jefe de Área.
- [x] `components/UserForm.tsx` — form por rol + `ImageCropUploader` (crear: diferido; editar: inmediato) + selects de sede/grados.
- [x] `components/UsersToolbar.tsx` — búsqueda (nombre/identificación) + filtros sede/grado.
- [x] `pages/UsersPage.tsx` — reescritura: layout sin card, Tabs ESTUDIANTES|DOCENTES, botón "+ Crear" (solo Jefe), `FormModal` + `ConfirmationModal`, filtrado `useMemo`, toasts.
- [x] `report/pages/ReportsPage.tsx` — quitar card blanco (`bg-white p-6 rounded-lg shadow-md` → `w-full relative`).
- [x] `App.tsx` / `SidebarMenu.tsx` — sin cambios (ruta e item ya existen).

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`).
- [x] `npm run build && npm run lint` en verde (`quartz-web`) — lint muestra 17 problemas preexistentes en `develop` (ninguno en archivos tocados por este feature; verificado por comparación con `git stash`).
- [x] Servidor arranca sin errores; **dropear** el índice viejo `identificationNumber_1` en Mongo si persiste (ver `plan.md` § Notas 1) — pendiente de ejecutar contra la base real (no accesible desde este entorno).
- [ ] Prueba manual en navegador: crear/editar/eliminar Estudiante y Docente; subir imagen en crear y editar; búsqueda + filtros sede/grado; `403` como Docente en escritura; `409` por identificación/email duplicado; `/gestion/usuarios` e `/informes` sin card blanco. **Pendiente — no hay navegador disponible en este entorno de implementación.**
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
