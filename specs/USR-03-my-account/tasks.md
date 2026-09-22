# USR-03 — Tasks

## Backend (`quartz-api`)
- [x] `auth/auth.types.ts` — `ISessionData.user.avatarUrl?: string`
- [x] `auth/auth.service.ts` — `toSessionUser` mapea `avatarUrl`
- [x] `users/users.validation.ts` — `updateOwnProfileSchema`, `changeOwnPasswordSchema` (`.strict()` en `body`, refines de coincidencia y distinta de la actual)
- [x] `users/users.types.ts` — `OwnProfile`, `UpdateOwnProfileDTO`, `ChangeOwnPasswordDTO`, `ProfileRequestor`
- [x] `users/users.service.ts` — extraer `assertUniqueIdentification`, `assertUniqueEmail`, `assertSchoolInTenant`, `replaceUserPhoto`; `updateUser`/`uploadUserPhoto` los reutilizan sin cambio de comportamiento
- [x] `users/users.service.ts` — `getOwnProfile`, `updateOwnProfile` (403 Docente con `email`/`schoolId`), `changeOwnPassword` (422 si actual incorrecta), `uploadOwnPhoto` (filtro `institutionId`, `.lean()`, `AppError`)
- [x] `users/users.controller.ts` — `getOwnProfileController`, `updateOwnProfileController`, `changeOwnPasswordController` (204), `uploadOwnPhotoController`; `userId` de `req.user!._id`; sin `try/catch`
- [x] `users/users.routes.ts` — 4 rutas `/me*` **antes** de `/:userId`, con `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE])` + `asyncHandler`

## Frontend (`quartz-web`)
- [x] Invocar skills `emil-design-eng`, `impeccable:impeccable`, `frontend-design:frontend-design`
- [x] `types/domain.ts` — `IDENTIFICATION_TYPES as const` (fuente de `IdentificationType`); `UserForm.tsx` lo importa
- [x] `features/account/types/{api,index}.ts` — `OwnProfile`, `UpdateOwnProfile`, `ChangeOwnPassword`
- [x] `features/account/queries/useAccountQuery.ts` — query + 3 mutaciones; `onSuccess` invalida `['account','me']` y llama `refreshSession()` (perfil/foto)
- [x] `features/account/components/ProfileForm.tsx` — foto (`ImageCropUploader`), campos comunes, `email`/sede solo lectura para Docente, payload solo con cambios, "Guardar" deshabilitado sin cambios
- [x] `features/account/components/ChangePasswordForm.tsx` — 3 campos, toggle visibilidad, `autocomplete`, validación en cliente, reset tras éxito
- [x] `features/account/pages/AccountPage.tsx` — sección Mi perfil o Cambiar contraseña según `?tab=` (sin pestañas), loading/error, toasts
- [x] `App.tsx` — ruta `/mi-cuenta` dentro de `Dashboard`
- [x] `components/common/UserMenu.tsx` — 3 ítems lucide (`UserRound`, `KeyRound`, `LogOut`), `ChevronDown`, navegación, avatar `avatarUrl ?? AVATAR_FALLBACK`; eliminar ítems sobrantes e imports de heroicons/`user.png`

## Docs
- [ ] _(diferido a `/sdd-release`: `/sdd-implement` no toca documentación)_ `docs/roles-permissions.md` — "Mi cuenta": ambos roles editan datos propios y contraseña; solo Jefe de Área cambia su correo y sede

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build` en verde (`quartz-web`)
- [ ] `npm run lint` — 0 problemas nuevos; persisten 17 preexistentes (9 errores, 8 warnings) idénticos en `feat/INF-04-dashboard`, fuera de alcance
- [x] Servidores arrancan sin errores de compilación ni runtime
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; ningún `/me*` lee id de usuario del cliente

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
