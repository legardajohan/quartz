# USR-03 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/users/users.types.ts` |
| tocar | `src/features/users/users.validation.ts` |
| tocar | `src/features/users/users.service.ts` |
| tocar | `src/features/users/users.controller.ts` |
| tocar | `src/features/users/users.routes.ts` |
| tocar | `src/features/auth/auth.types.ts` |
| tocar | `src/features/auth/auth.service.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/types/domain.ts` — `IDENTIFICATION_TYPES` |
| tocar | `src/features/users/components/UserForm.tsx` — importa `IDENTIFICATION_TYPES` |
| crear | `src/features/account/types/api.ts` |
| crear | `src/features/account/types/index.ts` |
| crear | `src/features/account/queries/useAccountQuery.ts` |
| crear | `src/features/account/components/ProfileForm.tsx` |
| crear | `src/features/account/components/ChangePasswordForm.tsx` |
| crear | `src/features/account/components/AccountPageHeader.tsx` |
| crear | `src/features/account/pages/ProfilePage.tsx` |
| crear | `src/features/account/pages/ChangePasswordPage.tsx` |
| tocar | `src/App.tsx` |
| tocar | `src/components/common/UserMenu.tsx` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/roles-permissions.md` — fila "Mi cuenta" por rol |

## Contratos
### Tipos / DTOs (`users.types.ts`)
```ts
type UpdateOwnProfileDTO = z.infer<typeof updateOwnProfileSchema>['body'];
type ChangeOwnPasswordDTO = z.infer<typeof changeOwnPasswordSchema>['body'];
interface OwnProfile {
  _id: string; role: UserRole;
  firstName: string; middleName?: string; lastName: string; secondLastName?: string;
  identificationType: IdentificationType; identificationNumber: number;
  phoneNumber?: string; email?: string;
  school: School; avatarUrl?: string;
}
interface ProfileRequestor { userId: string; role: UserRole }
```
`auth.types.ts` → `ISessionData.user` añade `avatarUrl?: string`; `toSessionUser` lo mapea.

### Modelo Mongoose
Sin cambios (`User` en `auth.model.ts`).

### Zod (`users.validation.ts`)
`.strict()` solo en objetos internos (ver `quartz-api/docs/known-issues.md`).
- `updateOwnProfileSchema` → `{ body }`: `firstName`, `middleName`, `lastName`, `secondLastName`, `identificationType`, `identificationNumber`, `phoneNumber`, `email`, `schoolId` — todos `.optional()`, mismas reglas que `updateUserSchema`; `body.strict()`.
- `changeOwnPasswordSchema` → `{ body }`: `currentPassword: z.string().min(1)`, `newPassword: z.string().min(8)`, `confirmPassword: z.string()`; `body.strict()` + `.refine(newPassword === confirmPassword, path ['confirmPassword'])` + `.refine(newPassword !== currentPassword, path ['newPassword'])`.
- Foto: sin schema (no hay params); `uploadImageSingle` + guarda `req.file` en controller (patrón `uploadUserPhotoController`).

### Service (`users.service.ts`)
| Función | Comportamiento |
|---|---|
| `getOwnProfile(institutionId, userId)` | `findByIdScoped(User…)`.lean() + sede → `OwnProfile`; `404` si no existe |
| `updateOwnProfile(institutionId, data, requestor)` | Docente con `email`/`schoolId` → `AppError(403)`; identificación duplicada → `409`; email duplicado global → `409`; sede inexistente en tenant → `422`; `findOneAndUpdateScoped` con `$set` + `updatedAt` |
| `changeOwnPassword(institutionId, userId, data)` | `findOneScoped(User…).select('+passwordHash')`; sin hash o `bcrypt.compare` falso → `AppError('La contraseña actual es incorrecta.', 422)`; `bcrypt.hash(newPassword, 10)` |
| `uploadOwnPhoto(institutionId, userId, file)` | delega en `replaceUserPhoto` |
| `replaceUserPhoto(institutionId, userId, file)` (interna) | extraída de `uploadUserPhoto`: `assertWebp`, sube a R2, `$set avatarUrl`, borra la previa. `uploadUserPhoto` la reutiliza tras su chequeo de permisos |

Extraer también de `updateUser` los chequeos compartidos (`assertUniqueIdentification`, `assertUniqueEmail`, `assertSchoolInTenant`) como funciones internas; `updateUser` y `updateOwnProfile` los consumen. Sin cambio de comportamiento en `updateUser`.

### Endpoints (`users.routes.ts`, declarados **antes** de `/:userId`)
| Método | Ruta | Rol | Middlewares | Respuesta |
|---|---|---|---|---|
| GET | `/api/users/me` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([...]) → asyncHandler(getOwnProfileController)` | `200 OwnProfile` |
| PATCH | `/api/users/me` | Jefe de Área, Docente | `… → validate(updateOwnProfileSchema) → asyncHandler(updateOwnProfileController)` | `200 OwnProfile` |
| PATCH | `/api/users/me/password` | Jefe de Área, Docente | `… → validate(changeOwnPasswordSchema) → asyncHandler(changeOwnPasswordController)` | `204` |
| PATCH | `/api/users/me/photo` | Jefe de Área, Docente | `… → uploadImageSingle → asyncHandler(uploadOwnPhotoController)` | `200 OwnProfile` |

Controllers: `userId = req.user!._id.toString()`, `institutionId = req.user!.institutionId.toString()`, `role = req.user!.role`. Sin `try/catch`.

### Frontend
**Estado:** React Query (dato de servidor). `queries/useAccountQuery.ts`:
- `accountQueryKey = ['account', 'me'] as const`
- `useOwnProfileQuery()` → `apiGet<OwnProfile>('/users/me')`
- `useUpdateOwnProfileMutation()` → `apiPatch<OwnProfile, UpdateOwnProfile>('/users/me', data)`
- `useUploadOwnPhotoMutation()` → `apiPatch<OwnProfile, FormData>('/users/me/photo', fd, multipart)` (patrón `useUploadStudentPhotoMutation`)
- `useChangeOwnPasswordMutation()` → `apiPatch<void, ChangeOwnPassword>('/users/me/password', data)`
- `onSuccess` de perfil y foto: `invalidateQueries(accountQueryKey)` + `void useAuthStore.getState().refreshSession()`.

**Tipos** (`types/api.ts`): `OwnProfile`, `UpdateOwnProfile` (Partial de campos editables), `ChangeOwnPassword { currentPassword; newPassword; confirmPassword }`. Reusa `UserSchool` de `features/users/types`. En `@/types/domain.ts` crear `IDENTIFICATION_TYPES = ['CC','TI','RC'] as const` (mismo patrón que `SUBJECT_TYPES`) y derivar `IdentificationType` de él; `UserForm.tsx` y `ProfileForm.tsx` lo importan (se elimina la constante local homónima de `UserForm.tsx:7`).

**Componentes:**
- `ProfileForm.tsx` — props `{ profile, isAreaLead, schools, onSubmit, onUploadPhoto, isSubmitting, isUploading }`. Cabecera con `ImageCropUploader` (`shape="circle"`, `size="lg"`), nombre y rol. Campos con `Input`/`Select` de Material Tailwind; `email` y sede `disabled` + hint para Docente. Payload = solo campos cambiados; `identificationNumber` → `number`. "Guardar" deshabilitado sin cambios.
- `ChangePasswordForm.tsx` — 3 `Input type="password"` con toggle `Eye`/`EyeOff` (lucide), `autocomplete` correcto, errores inline (mín. 8, coinciden, distinta de la actual); reset tras éxito.

**Páginas** (default export, sin pestañas; título y descripción vía `components/AccountPageHeader.tsx`):
- `pages/ProfilePage.tsx` — consulta perfil y sedes (`useSchoolsQuery` con `enabled: isAreaLead`); `Skeleton` en carga, error con "Reintentar"; toasts de perfil y foto.
- `pages/ChangePasswordPage.tsx` — solo la mutación de contraseña; no consulta el perfil.

**Rutas** en `App.tsx`, dentro del bloque `Dashboard` (sin `RoleRoute`: ambos roles): `/mi-cuenta/perfil` → `ProfilePage`, `/mi-cuenta/contrasena` → `ChangePasswordPage`, `/mi-cuenta` → `<Navigate to="/mi-cuenta/perfil" replace />`.

**`UserMenu.tsx`:** array `PROFILE_MENU_ITEMS` `{ label, icon, to? | action }` con `UserRound`, `KeyRound`, `LogOut`, `ChevronDown` de `lucide-react`; quita imports de `@heroicons` y `user.png`; `useNavigate` para los dos primeros; estilo destructivo (pink) solo en "Cerrar sesión"; avatar `user?.avatarUrl ?? AVATAR_FALLBACK`.

## Notas
- Contraseña actual incorrecta devuelve `422`, no `401`: `apiClient.ts` hace `logout()` ante cualquier `401`.
- `/me*` antes de `/:userId`: aunque `validate(objectId)` rechazaría "me", el orden evita ambigüedad y un 400 engañoso.
- Endpoints propios en vez de reutilizar `PATCH /api/users/:userId`: ese endpoint es de gestión (Docente → 404 sobre sí mismo) y aceptar el id del cliente abre IDOR; `/me` fija el objetivo desde el token.
- El JWT no cambia al editar el perfil (`authenticateJWT` relee el usuario en cada request), por eso basta `refreshSession()`.
- Diseño: invocar `emil-design-eng`, `impeccable:impeccable` y `frontend-design:frontend-design` antes de escribir UI; reutilizar Material Tailwind (memoria: no recrear Select/Menu a mano).

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola. Prueba manual de UI la hace el usuario.

## Desvíos durante la implementación
- `updateOwnProfile` normaliza `email` a `trim().toLowerCase()` en el service: el login lo busca en minúsculas y `validate()` no reinyecta el resultado de Zod en `req.body`, así que un `.toLowerCase()` en el schema no tendría efecto.
- Mutaciones de perfil y foto usan `queryClient.setQueryData(accountQueryKey, profile)` en vez de `invalidateQueries`: la API ya devuelve el `OwnProfile` actualizado, se evita un GET extra.
- `useSchoolsQuery` acepta `{ enabled }` (default `true`, sin cambio para sus consumidores) para no pedir sedes cuando el usuario es Docente.
- Constante de dominio nombrada `IDENTIFICATION_TYPES` (patrón vecino `SUBJECT_TYPES`) en lugar de `IDENTIFICATION_TYPE_VALUES`.
- Sin pestañas y con rutas propias en lugar de `?tab=` (pedido del usuario tras la primera versión): cada opción del menú es una pantalla, igual que `/gestion/usuarios` o `/gestion/configuracion`.
