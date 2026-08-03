# USR-01 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/auth/auth.model.ts` |
| tocar | `src/features/users/users.types.ts` |
| tocar | `src/features/users/users.validation.ts` |
| tocar | `src/features/users/users.service.ts` |
| tocar | `src/features/users/users.controller.ts` |
| tocar | `src/features/users/users.routes.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar  | `src/features/users/types/api.ts` |
| tocar  | `src/features/users/queries/useUsersQuery.ts` |
| crear  | `src/features/users/queries/useSchoolsQuery.ts` |
| crear  | `src/features/users/components/UsersTable.tsx` |
| crear  | `src/features/users/components/UserForm.tsx` |
| crear  | `src/features/users/components/UsersToolbar.tsx` |
| tocar  | `src/features/users/pages/UsersPage.tsx` (reescritura) |
| tocar  | `src/features/report/pages/ReportsPage.tsx` |

## Contratos

### Tipos / DTOs (`users.types.ts`)
```ts
// Reutiliza UserWithValuations (salida GET) ya existente.
export interface NewUser {
  role: 'Estudiante' | 'Docente';
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: IdentificationType;
  identificationNumber: number;
  phoneNumber?: string;
  schoolId: string;
  gradesTaught: GradeLevel[];
  email?: string;     // requerido si role === 'Docente'
  password?: string;  // requerido si role === 'Docente'
}
export type UpdateUser = Partial<Omit<NewUser, 'role'>>; // role inmutable
```

### Modelo Mongoose (`auth.model.ts`)
- `identificationNumber`: quitar `unique: true` inline.
- Nuevo índice compuesto **único**: `UserSchema.index({ institutionId: 1, identificationNumber: 1 }, { unique: true })`.
- `institutionId.ref`: `'EducationalInstitution'` → `'Institution'`.
- Sin cambios en `avatarUrl` (ya existe, ACAD-03).

### Zod (`users.validation.ts`)
- `createUserSchema` — `body` con `z.discriminatedUnion('role', [...])`:
  - Base común: `firstName`, `lastName` (string no vacío), `identificationType ∈ {CC,TI,RC}`, `identificationNumber` (number entero positivo), `schoolId` (objectId), opcionales `middleName`, `secondLastName`, `phoneNumber`.
  - `role: 'Estudiante'` → `gradesTaught: [GradeLevel]` longitud **exactamente 1**; sin `email`/`password`.
  - `role: 'Docente'` → `email` (email válido), `password` (min 8), `gradesTaught` longitud **≥1**.
- `updateUserSchema` — `params: { userId: objectId }`, `body`: versión parcial de la base (sin `role`); `password` opcional min 8; `gradesTaught` opcional (si viene, ≥1).
- `deleteUserSchema` — `params: { userId: objectId }`.
- `uploadStudentPhotoSchema` → renombrar param a `userId` (misma URL).

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET    | `/api/users` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(getUsersSchema) → asyncHandler(getUsers)` |
| POST   | `/api/users` | Jefe de Área | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(createUserSchema) → asyncHandler(createUserController)` |
| PATCH  | `/api/users/:userId` | Jefe de Área | `… → authorize([JEFE_DE_AREA]) → validate(updateUserSchema) → asyncHandler(updateUserController)` |
| DELETE | `/api/users/:userId` | Jefe de Área | `… → authorize([JEFE_DE_AREA]) → validate(deleteUserSchema) → asyncHandler(deleteUserController)` |
| PATCH  | `/api/users/:userId/photo` | Jefe de Área, Docente | `… → authorize([JEFE_DE_AREA, DOCENTE]) → validate(uploadStudentPhotoSchema) → uploadImageSingle → asyncHandler(uploadUserPhotoController)` |

### Service (`users.service.ts`)
- `getUsersByFilters`: aceptar `role ∈ {Estudiante, Docente}` (default `Estudiante` para back-compat). Para `role=Docente`: solo si `requestorRole === JEFE_DE_AREA` (si no → `[]`); filtrar por `schoolId` opcional. El enriquecimiento con `valuations` aplica solo a estudiantes (docentes → `[]` naturalmente).
- `createUser(institutionId, data)`:
  1. Validar `schoolId` con `findByIdScoped(SchoolModel, institutionId, schoolId)` → si no existe `AppError(..., 422)`.
  2. `findOneScoped(User, institutionId, { identificationNumber })` → si existe `AppError('Identificación ya registrada', 409)`.
  3. Si `role === Docente`: `User.findOne({ email })` (global, login es global) → si existe `AppError('Email ya registrado', 409)`; `passwordHash = await bcrypt.hash(password, 10)`.
  4. `createScoped(User, institutionId, { ...data, passwordHash })`.
  5. Devolver DTO enriquecido con `school` (misma forma que `GET`).
- `updateUser(institutionId, userId, data)`:
  1. `findByIdScoped(User, institutionId, userId)` → `404` si no.
  2. Ignorar `role`; si `password` viene → re-hashear; si `identificationNumber` cambia → revalidar unicidad en tenant (`409`); si `schoolId` cambia → validar scoped (`422`).
  3. `findOneAndUpdateScoped(..., { new: true, runValidators: true })` → DTO enriquecido.
- `deleteUser(institutionId, userId)`:
  1. `findOneAndDeleteScoped(User, institutionId, { _id: userId })` → `404` si no.
  2. Si tenía `avatarUrl`: `deleteImage(keyFromPublicUrl(avatarUrl))` best-effort.
- `uploadUserPhoto(institutionId, userId, file, requester)`: como `uploadStudentPhoto` actual pero sin forzar `role=ESTUDIANTE` al buscar; si `requester.role === DOCENTE` exigir target `ESTUDIANTE` y `student.schoolId === requester.schoolId` (preserva ACAD-03).

Controllers sin `try/catch`; `institutionId` de `req.user!.institutionId.toString()`; rol de `req.user!.role`.

### Frontend

**`types/api.ts`** — añadir `NewUser`, `UpdateUser`; reutilizar `UserDto`/`SchoolDto`.

**`queries/useUsersQuery.ts`** — añadir (React Query, invalidan `['users']` en `onSuccess`):
```ts
useCreateUserMutation()  // apiPost<UserDto, NewUser>('/users', data)
useUpdateUserMutation()  // apiPatch<UserDto, UpdateUser>(`/users/${id}`, data)
useDeleteUserMutation()  // apiDelete<void>(`/users/${id}`)
```
Mantener `useUsersQuery` y `useUploadStudentPhotoMutation` (consumidos por `StudentValuationDetail`).

**`queries/useSchoolsQuery.ts`** (nuevo) — `useQuery(['schools'], () => apiGet<SchoolDto[]>('/schools'))`.

**`components/UsersTable.tsx`** — `DataTable<UserDto>` con columnas:
- NOMBRE: `<Avatar src={avatarUrl || '/avatar-default.svg'} size="sm" />` + apellidos (`[lastName, secondLastName]`) y nombres (`[firstName, middleName]`).
- IDENTIFICACIÓN: `identificationType` + `identificationNumber`.
- GRADO: `gradesTaught.join(', ')` (o `—`).
- SEDE: `school?.name`.
- ACCIONES: `PencilIcon` (ver/editar) + `TrashIcon` (eliminar) en `IconButton`+`Tooltip` (patrón `ConceptsTable`); render solo si `canManage` (Jefe de Área).

**`components/UserForm.tsx`** — presentacional (patrón `LearningForm`/`ConceptForm`): estado local + `onFormChange(formData, isDirty)`. Campos: tipo+número ident., nombres (4), sede (`Select` de `useSchoolsQuery`), grados (`Select` — single para Estudiante, múltiple para Docente), `phoneNumber`; para Docente además `email` + `password`. Incluye `ImageCropUploader`:
- Crear: `onUpload` guarda el `blob` en estado local; tras `createUser` exitoso, se sube con la mutación de foto usando el nuevo `_id`.
- Editar: `onUpload` invoca la mutación de foto de inmediato (`currentUrl = avatarUrl`).

**`components/UsersToolbar.tsx`** — `Input` de búsqueda (nombre o identificación) + filtros de sede y grado (patrón `Menu/Checkbox/Chip` de `ConceptsFilters`).

**`pages/UsersPage.tsx`** (reescritura) — layout sin card (`<><div className="w-full relative">`, como `LearningsPage`): título `text-purple-900`; `Tabs` `ESTUDIANTES | DOCENTES` (patrón `ConfigurationPage`) que fijan el `role` del `useUsersQuery`; a la izquierda `UsersToolbar`, a la derecha botón "+ Crear" (`PlusIcon`, `<button>` nativo, solo Jefe de Área); `UsersTable`; `FormModal` (crear/editar) + `ConfirmationModal` (eliminar); filtrado con `useMemo`; feedback con `react-hot-toast`.

**`report/pages/ReportsPage.tsx`** — cambiar wrapper `bg-white p-6 rounded-lg shadow-md` → `w-full relative` (sin card).

- Sin cambios en `App.tsx` (ruta `/gestion/usuarios` ya existe) ni `SidebarMenu.tsx` (item ya existe). La página sigue visible para Docente; las afordancias de escritura se ocultan por rol.

## Notas
1. **Índice único → migración manual.** Pasar de `identificationNumber_1` (single, global) a `{ institutionId, identificationNumber }` exige **dropear** el índice viejo en Mongo; Mongoose no lo elimina automáticamente. Documentado en `tasks.md` (verificación) — al arrancar con `autoIndex` en dev, dropear el índice previo si quedó.
2. **Rename `:studentId` → `:userId`.** La URL del endpoint de foto no cambia; `StudentValuationDetail` sigue llamando `/users/${id}/photo`. Solo cambia el nombre del param y la generalización del servicio.
3. **React Query, no Zustand (deliberado).** El feature `users` ya usa React Query (cableado global en `main.tsx`/`lib/queryClient.ts`) y `StudentValuationDetail` (ACAD-03) comparte su caché de usuarios. Migrar a Zustand forkearía el estado en dos sistemas y tocaría ACAD-03. Se extiende `queries/` en lugar de crear `useUsersStore`. Desviación acotada de la convención de `quartz-web/CLAUDE.md`.
4. **Avatar por defecto.** El feature usa `/avatar-default.svg` (público, ya existe). Las vistas de valoración/informe siguen con `assets/images/default-user.jpg`; unificar ambos defaults queda fuera de alcance.
5. **Imagen en creación = dos pasos.** No hay POST multipart mixto: se crea el usuario (JSON) y luego se sube la foto (multipart) con el `_id` devuelto. Reutiliza el endpoint de foto existente generalizado.
6. **Borrado.** Hard delete; la limpieza de `StudentValuation` huérfanas del estudiante eliminado no entra en este spec.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Crear/editar/eliminar Estudiante y Docente; subir imagen en crear y editar; búsqueda + filtros sede/grado.
- `POST /api/users` como Docente → `403`; identificación duplicada → `409`; email de Docente duplicado → `409`; `schoolId` ajeno → `422`.
- `GET /api/users?role=Docente` como Docente → `[]`; como Jefe de Área → docentes del tenant.
- Confirmar que `/gestion/usuarios` y `/informes` no muestran card blanco.

## Addendum 2026-07-17 — Pulido de búsqueda+filtros, iconos por tab, `email` en el DTO de lectura

Ajuste post-implementación sobre la misma rama (`feat/USR-01-user-management`), aún `implemented`, no `released`.

### 1. Rediseño de `UsersToolbar.tsx` — búsqueda y filtros unificados
**Motivo:** la primera versión separaba la búsqueda (input suelto) de los filtros (fila de botones `Menu` independientes debajo), en dos líneas. El usuario pidió una sola línea y aportó una referencia visual (barra de búsqueda + botón circular de filtros adosado).

**Cambio:** un único control "pill" (`rounded-full border`) que contiene el ícono de lupa, el input, y — a la derecha, en la misma línea — un botón circular de filtros (`AdjustmentsHorizontalIcon`, no `FunnelIcon`) que abre **un solo** `Menu` con ambos grupos (Sede, Grado) apilados dentro de un único `MenuList`.

**Decisión de visibilidad (lo pedido en el punto 3 del usuario):** los filtros quedan **ocultos por defecto**, dentro del menú desplegable del ícono — no hay chips ni checkboxes visibles en la barra. Razones:
- Con solo 2 grupos de filtro (Sede, Grado) —frente a los 3 de `ConceptsFilters`— exponerlos como botones sueltos en línea con el buscador competía visualmente con la barra de búsqueda y rompía el requisito de "misma línea".
- El botón cambia a relleno `purple-600` + badge numérico (`pink-600`) cuando hay ≥1 filtro activo — es la señal de "hay filtros aplicados" sin necesidad de abrir el menú ni de una fila de chips aparte.
- `Menu` de Material Tailwind ya soporta anidar ambos grupos con separador (`border-t`) y un botón "Limpiar" contextual (solo aparece si hay filtros activos) — evita una capa extra de UI para quitar filtros uno a uno fuera del menú.

**Animación del menú:** se fijó `animate={{ mount: {...}, unmount: {...} }}` con entrada `scale 0.95→1 / opacity 0→1` en 150ms `ease-out` y salida más rápida (100ms `ease-in`) — sigue el patrón de Emil Kowalski (nunca animar desde `scale(0)`, salida más rápida que la entrada, solo `transform`+`opacity`). El botón de filtros usa `active:scale-[0.94]` como feedback de presión.

### 2. Iconos en los tabs de `/gestion/usuarios`
**Motivo:** pedido explícito, con `ConfigurationPage.tsx` como referencia de patrón (icono + label, color activo `purple-900` vs `gray-600`, `active:scale-[0.98]` en el `Tab`).

**Cambio:** `AcademicCapIcon` (Estudiantes) y `BriefcaseIcon` (Docentes) — sin el badge numérico circular de `ConfigurationPage` (ese es propio de un wizard secuencial de configuración; aquí los tabs son dos categorías pares, no pasos).

### 3. `email` opcional en el DTO de lectura de usuarios
**Motivo:** el formulario de edición de Docente mostraba el campo de correo siempre vacío porque `GET /api/users` nunca proyectaba `email` — dejarlo en blanco significaba "no cambiar", pero no reflejaba el valor real.

**Cambio:**
- `users.types.ts` (api) — `UserWithValuations.email?: string`.
- `users.service.ts` — `email: 1` añadido al `.select(...)` de `getUsersByFilters`; `mapUserToDTO` ahora incluye `email: user.email`.
- Frontend: `UserDto.email?: string`; `UserForm.tsx` → `formDataFromUser` precarga `email: user.email ?? ""` en vez de `""` fijo.

**Efecto colateral (positivo):** el cálculo de `isDirty` en `UserForm.tsx` ahora compara contra el email real, no contra una cadena vacía fija — antes, escribir y luego revertir el email de un Docente marcaba el formulario como "sucio" incluso sin cambios netos.

### Verificación adicional
- `cd quartz-api && npx tsc --noEmit` — verde.
- `cd quartz-web && npm run build && npm run lint` — verde (mismos 17 problemas preexistentes de `develop`, ninguno en archivos de este feature).
- Pendiente de confirmación visual en navegador (sin herramienta de automatización de navegador disponible en este entorno).

## Addendum 2026-07-28 — Iteración 2: ajustes UI (pendiente)

Solo `quartz-web`, sobre la misma rama (`feat/USR-01-user-management`). Archivos:
`UsersToolbar.tsx`, `UsersPage.tsx`, `FormModal.tsx`, `index.css`, `UserForm.tsx`.
Antes de implementar UI, invocar las skills obligatorias (`emil-design-eng`, `impeccable`,
`frontend-design`) según `quartz-web/CLAUDE.md`.

### 1. Eliminar borde negro del botón de filtro
- `UsersToolbar.tsx`, botón `MenuHandler` (~línea 63) **y** `MenuList` (~línea 75).
- Causa raíz confirmada: el popup (`MenuList`) recibe foco al abrirse; el `className` por defecto de
  material-tailwind solo trae `focus:outline-none`, **no** `focus-visible:outline-none`. Los
  navegadores modernos muestran el outline por defecto vía `:focus-visible`, no `:focus`, así que el
  borde se cuela igual pese al `focus:outline-none` de la librería.
- Fix: `focus:outline-none focus-visible:outline-none` en el botón **y** en `MenuList`
  (`outline-none focus:outline-none focus-visible:outline-none`).
- **Reaparición 1 (2026-07-28, misma sesión):** el mismo defecto apareció en los `Select` de
  `UserForm.tsx` (Sede, Cursos a cargo, Grado, Tipo de identificación) — su listbox interno tiene el
  mismo hueco (`focus:outline-none` sin `focus-visible:outline-none`), pero a diferencia de `MenuList`
  no hay una prop pública para tocar el `className` de ese listbox interno. Fix global (1ra iteración,
  incompleto) en `index.css` § `@layer base`: `[role="listbox"], [role="menu"] { outline: none; }`.
- **Reaparición 2 (2026-07-29, misma sesión) — causa raíz real:** el fix anterior no bastó porque el
  elemento que realmente recibe **foco de DOM** al abrir un `Menu` no es el `MenuList` (`role="menu"`)
  sino su **único hijo directo** — el contenido que le pasamos (`<div className="grid grid-cols-2">`
  con Sede/Grado) — al que material-tailwind promueve automáticamente a `role="menuitem"`. Ese `div` es
  contenido nuestro, sin ninguna clase `outline-none` propia, así que el navegador pinta su outline
  nativo (`outline-style: auto`, color casi negro `rgb(16,16,16)`) alrededor de todo el panel.
  Confirmado con Chrome DevTools vía `document.activeElement` → `role="menuitem"`,
  `outlineColor: rgb(16, 16, 16)`, `outlineStyle: auto`. Fix definitivo en `index.css`:
  `[role="listbox"], [role="menu"], [role="menuitem"], [role="option"] { outline: none; }` (se agregó
  `menuitem` y `option` a la regla existente). Verificado visualmente en el filtro de
  `UsersToolbar.tsx` y en los `Select` de "Sede"/"Cursos a cargo" del modal — sin borde en ningún caso.

### 2. Tabs + búsqueda en la misma fila
- `UsersPage.tsx`, cabecera (~líneas 236-289). Reestructurar:
  - Fila 1: `<h1>Gestión de Usuarios</h1>` + botón "+ Crear" (`flex justify-between items-center`).
  - Fila 2: `flex items-center gap-4` → `<Tabs>` (ancho por contenido, quitar `max-w-md`) a la
    izquierda + `<UsersToolbar>` a la derecha con `flex-1`.
- `UsersToolbar.tsx`: wrapper raíz pasa de `w-full max-w-xl` a `w-full` (ancho controlado por el padre
  vía `flex-1`); aceptar `className` opcional si hace falta afinar.
- Compactar `TabsHeader`/`Tab` (padding) para que la altura del segmented control iguale la de la
  barra de búsqueda (pill ~h-11).

### 3. Scroll delgado en `FormModal` (solo al desbordar, visible en hover/scroll)
- `index.css` — utilidad reutilizable:
  ```css
  .thin-scrollbar { scrollbar-width: thin; scrollbar-color: transparent transparent; }
  .thin-scrollbar::-webkit-scrollbar { width: 6px; }
  .thin-scrollbar::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 9999px; }
  .thin-scrollbar:hover { scrollbar-color: rgb(209 213 219) transparent; } /* gray-300 */
  .thin-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgb(209 213 219); }
  ```
- `FormModal.tsx`, `DialogBody` (~línea 40): añadir `max-h-[70vh] overflow-y-auto thin-scrollbar`.
  `overflow-y-auto` garantiza que el scrollbar **no** aparece cuando el contenido cabe (requisito
  explícito: no debe salir por defecto en modales cortos). Header y footer del `Dialog` quedan fijos;
  solo scrollea el body.

### 4. "Cursos a cargo" como desplegable con checkboxes
- `UserForm.tsx`, bloque Docente. Es el propio `Select` de material-tailwind (mismo componente que
  "Sede"), no un componente custom — ver "Nota de implementación" más abajo para el porqué.
- `GRADE_LEVELS` permanece según la fase del proyecto (hoy `["Transición"]`); el componente ya soporta
  múltiples (el ejemplo "Transición, Primero" es ilustrativo del disparador).

### 5. Estudiante: Sede + Grado en 2 columnas
- `UserForm.tsx` (~líneas 187-239). Hoy "Sede" (Select) se renderiza único para ambos roles y luego el
  condicional docente/estudiante. Reestructurar:
  - **Estudiante:** `<div className="grid grid-cols-2 gap-4">` con el `Select` de Sede + el `Select`
    de Grado dentro.
  - **Docente:** `Select` de Sede a ancho completo + el desplegable "Cursos a cargo" (§4) debajo.
- Conservar las `key` dinámicas de los `Select` (evitan el valor obsoleto al reabrir el modal).

### Verificación iteración 2
- `cd quartz-web && npm run build && npm run lint` — verde.
- Manual: filtro sin borde negro; tabs+búsqueda en una fila; modal largo scrollea con barra delgada
  solo en hover y sin barra en modales cortos; "Cursos a cargo" desplegable con comas; Sede+Grado del
  estudiante en 2 columnas.

### Nota de implementación (final) — §4 "Cursos a cargo" = `Select` + `Option` + `Checkbox` reales

Este campo pasó por tres intentos antes de llegar a la versión correcta. Se documentan los tres
porque dejan una lección de proyecto relevante (ver `feedback_reuse_material_tailwind` en memoria).

1. **Intento 1 — `Menu`/`MenuHandler`/`MenuList` (lo planeado originalmente):** falló dentro del
   `FormModal` con `overflow-y-auto` (§3). El popover se abría correctamente en el DOM (`opacity: 1`,
   `z-index: 999`, rect correcto) pero de forma reproducible **no pintaba en pantalla** y los clics en
   su posición esperada caían sobre el campo de abajo (`elementFromPoint` confirmó el input recibiendo
   el hit, no el checkbox). Forzar `background`/`border` vía DOM tampoco lo hizo visible. Es el
   escenario que la skill `impeccable` (guía de Interacción) advierte explícitamente sobre dropdowns
   `position: absolute` dentro de contenedores con `overflow`.
2. **Intento 2 — panel inline hecho a mano** (`useState` + `<div>` empujando el contenido) y luego
   **intento 3 — portal a `document.body` con posicionamiento manual** (`getBoundingClientRect` +
   `position: fixed` + listeners de scroll/resize/click-afuera): ambos evitaban el bug de `Menu`, pero
   el usuario los rechazó explícitamente — el proyecto ya tiene `Select`/`Input`/`Checkbox` importados
   de `@material-tailwind/react` y la convención es reutilizarlos ajustando props, no reconstruir UI ni
   lógica de posicionamiento a mano.
3. **Implementación final:** el propio `Select` de material-tailwind (mismo componente que "Sede"),
   con cada `Option` renderizando un `Checkbox` + `Typography` custom (`className="p-0"` en `Option`
   para que el checkbox ocupe toda la fila). El prop `selected={() => formData.gradesTaught.join(", ")}`
   controla qué texto se muestra en el trigger cerrado (sin esto, `Select` clona por defecto el
   contenido del `Option` seleccionado — mostraría el checkbox dentro del trigger). `value` se mantiene
   en `formData.gradesTaught.join(", ")` y `onChange` es no-op: el estado real vive en `formData`, no
   en el `Select`. **A diferencia de `Menu`, el popover de `Select` sí renderiza y recibe clics
   correctamente dentro del modal con scroll** — el problema era específico de `Menu`/Popper, no del
   contenedor. `Sede` (`Select`) y "Cursos a cargo" (`Select`) comparten `grid grid-cols-2 gap-4`.

**Limitación conocida:** `Select` cierra el popover tras seleccionar una opción (comportamiento interno
de la librería, no gobernado por `dismiss`). Con `GRADE_LEVELS` actual (`["Transición"]`, fase única del
proyecto) esto es imperceptible. Si en una fase futura se agregan más grados y se requiere marcar varios
sin que el popover se cierre en cada clic, revisar entonces si `Select` expone algún mecanismo para
mantenerlo abierto entre selecciones (no confirmado en esta sesión).
