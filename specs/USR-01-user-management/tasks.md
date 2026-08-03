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

## Ajustes UI — Iteración 2 (pendiente)
Solo `quartz-web`. Invocar skills de diseño (`emil-design-eng`, `impeccable`, `frontend-design`) antes de tocar UI.

- [x] `UsersToolbar.tsx` — quitar outline/borde negro del botón de filtro **y del `MenuList`** (`focus:outline-none focus-visible:outline-none`; el borde reportado era el outline de foco del propio panel del menú, no solo del botón).
- [x] `UsersPage.tsx` — cabecera: h1 + "Crear" en fila 1; Tabs (izq., sin `max-w-md`) + `UsersToolbar` (flex-1, der.) en fila 2.
- [x] `UsersToolbar.tsx` — wrapper `w-full` (ancho controlado por el padre); Tabs compactados (`px-8 py-2`) para igualar altura de la barra.
- [x] `index.css` — utilidad `.thin-scrollbar` (thin, thumb transparente por defecto, visible en hover).
- [x] `FormModal.tsx` — `DialogBody`: `max-h-[70vh] overflow-y-auto thin-scrollbar` (scroll solo al desbordar).
- [x] `UserForm.tsx` — Docente: "Grados a cargo" → "Cursos a cargo" como `Select`+`Option`+`Checkbox` **reales** de material-tailwind (mismo componente que "Sede", con `selected` render-prop para el texto del trigger). Pasó por dos intentos custom (panel inline, luego portal manual) rechazados por el usuario a favor de reutilizar el componente existente — ver `plan.md` § Nota de implementación (final) y memoria `feedback_reuse_material_tailwind`.
- [x] `UserForm.tsx` — Estudiante: Sede + Grado en `grid grid-cols-2 gap-4`; Docente: Sede + Cursos a cargo en `grid grid-cols-2 gap-4`.
- [x] `index.css` — regla global `@layer base`, ampliada a `[role="listbox"], [role="menu"], [role="menuitem"], [role="option"] { outline: none; }`: causa raíz real confirmada con Chrome DevTools — el hijo directo de `MenuList` es promovido a `role="menuitem"` y recibe foco de DOM real al abrir (outline nativo del navegador, no cubierto por la regla original). Ver `plan.md` § tarea 1 "Reaparición 2".

## Verificación (iteración 2)
- [x] `npm run build && npm run lint` en verde (`quartz-web`) — mismos 17 problemas preexistentes de `develop`, ninguno en archivos tocados. Confirmado que la regla `[role="listbox"]`/`[role="menuitem"]` sobrevive el purge de Tailwind (presente en `dist/assets/index-*.css`).
- [x] Manual en navegador (Chrome, vía extensión de automatización, autorizado explícitamente por el usuario para este ajuste): filtro de `UsersToolbar.tsx` sin borde negro al abrir (confirmado con zoom + `document.activeElement` vía JS: `outlineStyle: "none"`); "Sede" y "Cursos a cargo" del modal de Docente sin borde negro al abrir.
- [x] Manual en navegador (Chrome, vía extensión de automatización, **antes** de la reaparición del borde en `Select`): filtro sin borde negro (inicial y tras abrir); tabs+búsqueda en una fila; modal de Docente scrollea con barra delgada visible solo en hover, sin barra en el modal de Estudiante (cabe sin desbordar); "Cursos a cargo" despliega como `Select` real (mismo look/animación que "Sede", label flotante), checkbox marca y el trigger muestra "Transición"; Sede+Grado del estudiante y Sede+Cursos a cargo del docente en 2 columnas. Verificado en `http://localhost:5173/gestion/usuarios` con sesión de Jefe de Área real.
- [ ] Manual pendiente de confirmación del usuario (a petición explícita, sin extensión de Chrome esta vez): borde negro no debe aparecer en ningún `Select`/`Menu` de `/gestion/usuarios` (toolbar y modales de crear/editar).
