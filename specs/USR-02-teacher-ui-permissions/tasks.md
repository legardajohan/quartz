# USR-02 — Tasks

## Backend (`quartz-api`)
- [x] `users.types.ts` — tipo del solicitante para `updateUser` (`{ role: UserRole; schoolId?: string }`) — declarado como `UpdateUserRequestor` en `users.service.ts` (mismo patrón que `PhotoUploadRequester` en el mismo archivo)
- [x] `users.service.ts` — `updateUser` recibe el solicitante y aplica el guard: Docente solo sobre Estudiante de su sede (404), y `schoolId` en el payload → 403
- [x] `users.controller.ts` — `updateUserController` propaga rol y sede del token
- [x] `users.routes.ts` — `PATCH /:userId`: añadir `UserRole.DOCENTE` al `authorize`
- [x] Verificar que `createUser` y `deleteUser` siguen siendo exclusivos del Jefe de Área

## Frontend (`quartz-web`)

### Aprendizajes
- [x] `learning/pages/LearningsPage.tsx` — botón "Crear" solo con `isAreaLead`
- [x] `learning/components/LearningsTable.tsx` — prop `canManage: boolean`; la columna "Acciones" se añade condicionalmente al array `columns`
- [x] Borrar `learning/components/LearningCard.tsx` (código muerto, sin referencias)

### Conceptos
- [x] `concept/components/ConceptsTable.tsx` — reemplazar el `—` por el marcador de solo lectura: `LockClosedIcon` en un `span` de `h-8 w-8`, `text-blue-gray-300`, sin hover ni borde, dentro de un `Tooltip` "Solo su autor puede editarlo", con `role="img"` y `aria-label`

### Informes
- [x] `report/pages/ReportsPage.tsx` — `usePermissions()` + preselección de la sede del Jefe de Área con guard `useRef`
- [x] `report/pages/ReportsPage.tsx` — omitir el grupo de filtro "Sede" cuando el rol no es Jefe de Área

### Usuarios
- [x] `users/pages/UsersPage.tsx` — partir `canManage` en `canCreate` / `canEdit` / `canDelete`
- [x] `users/pages/UsersPage.tsx` — botón "Crear" solo con `canCreate`; `ROLE_TABS` solo "Estudiantes" para Docente; filtro de sede omitido para Docente
- [x] `users/components/UsersTable.tsx` — lápiz con `canEdit`, papelera con `canDelete`; marcador de solo lectura si no hay ninguno
- [x] `users/components/UserForm.tsx` — `disabled` en los Select de sede y jornada cuando el rol no es Jefe de Área

## Documentación
Diferido a `/sdd-release`, conforme a la skill `sdd-implement` ("no escribas... documentación; las docs van en `/sdd-release`"). El contenido queda anotado en `plan.md` para esa fase.
- [ ] `docs/roles-permissions.md` — eliminar valoración ✅ para Docente; desdoblar crear/editar/eliminar usuarios; reescribir la nota final (hueco cerrado por VAL-04) y anotar las dos deudas menores (403 vs 404 en `report.service.ts`; `deleteUser` sin check de rol del objetivo)
- [ ] `docs/domain.md:13` — el Docente queda restringido a su sede

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde
- [x] `cd quartz-web && npm run build && npm run lint` en verde
- [x] Servidor arranca sin errores de compilación ni runtime
- [ ] `PATCH /api/users/:userId`: 200 en su sede · 404 en otra sede o rol distinto · 403 con `schoolId` en el body (manual, pendiente del usuario)
- [ ] Docente: Aprendizajes solo lectura · candado en conceptos ajenos · Informes sin filtro de sede con ambas descargas · Usuarios sin Crear ni papelera ni pestaña Docentes, con edición y foto (manual)
- [ ] Jefe de Área: las cuatro pantallas sin cambios, salvo la sede preseleccionada en Informes (manual)
- [x] La carga de imagen de usuario existe únicamente en el modal de `/gestion/usuarios`
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; `schoolId` siempre de `req.user`

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
