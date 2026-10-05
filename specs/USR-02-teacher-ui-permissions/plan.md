# USR-02 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/users/users.routes.ts` |
| tocar | `src/features/users/users.controller.ts` |
| tocar | `src/features/users/users.service.ts` |
| tocar | `src/features/users/users.types.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/learning/pages/LearningsPage.tsx` |
| tocar | `src/features/learning/components/LearningsTable.tsx` |
| borrar | `src/features/learning/components/LearningCard.tsx` |
| tocar | `src/features/concept/components/ConceptsTable.tsx` |
| tocar | `src/features/report/pages/ReportsPage.tsx` |
| tocar | `src/features/users/pages/UsersPage.tsx` |
| tocar | `src/features/users/components/UsersTable.tsx` |
| tocar | `src/features/users/components/UserForm.tsx` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/roles-permissions.md` |
| tocar | `docs/domain.md` |

## Contratos

### Backend — `PATCH /api/users/:userId`

| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| PATCH | `/api/users/:userId` | Jefe de Área · **Docente** | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(updateUserSchema) → asyncHandler` |

Firma nueva del service:

```ts
updateUser(
  institutionId: string,
  userId: string,
  data: UpdateUserDTO,
  requestor: { role: UserRole; schoolId?: string }
): Promise<UserWithValuations>
```

Guard al inicio de `updateUser`, justo después del `findByIdScoped` que ya resuelve `existing` (`users.service.ts:249-252`):

```
si requestor.role === DOCENTE:
  si existing.role !== ESTUDIANTE            → AppError('Usuario no encontrado.', 404)
  si existing.schoolId !== requestor.schoolId → AppError('Usuario no encontrado.', 404)
  si data.schoolId !== undefined              → AppError('No puedes cambiar la sede de un usuario.', 403)
```

- **404 y no 403** en los dos primeros casos, por la misma razón que en `VAL-04`: un 403 confirmaría que ese `userId` existe. Es el criterio ya vigente en `uploadUserPhoto` (`users.service.ts:379-384`).
- **403 y sí 403** en el tercero: ahí el recurso es suyo y el rechazo es sobre el campo, no sobre la existencia.
- El **`role` ya es inmutable por contrato**: no forma parte de `UpdateUserDTO` (`users.types.ts:59-61`) y `updateUserSchema` es `.strict()` (`users.validation.ts:66`). No hace falta guard adicional.
- El `shiftId` sí se le permite al Docente: es una propiedad operativa de su propia sede.

`users.controller.ts:35-40` propaga `{ role: req.user!.role, schoolId: req.user!.schoolId?.toString() }`. `deleteUser` y `createUser` no cambian: siguen siendo solo Jefe de Área por `authorize`.

### Frontend — regla de diseño para acciones sin permiso

Dos casos, dos respuestas. La diferencia es si la restricción varía **por fila** o es **uniforme para el rol**:

| Caso | Respuesta | Por qué |
|---|---|---|
| Uniforme para el rol (Aprendizajes: el Docente no gestiona ninguno) | **Se elimina la columna entera** | Una columna que solo contiene el mismo marcador repetido es una columna sin información. El ancho liberado va a la descripción |
| Varía por fila (Conceptos: propios sí, ajenos no) | **Marcador de solo lectura en la celda** | La columna sí informa: distingue lo que el usuario puede tocar de lo que no. Quitarla escondería una diferencia real |

### Frontend — Aprendizajes

- `pages/LearningsPage.tsx` — `const { isAreaLead } = usePermissions();`; envolver el botón "Crear" (L205-214) en `{isAreaLead && ...}`. La condición existente `!isDescriptionModeSelected` (L195) se conserva y se combina.
- `components/LearningsTable.tsx` — nueva prop `canManage: boolean`. La columna "Acciones" (L80-106) se añade al array `columns` de forma condicional, no se renderiza vacía:
  ```ts
  const columns: Column<Learning>[] = [
    ...baseColumns,
    ...(canManage ? [actionsColumn] : []),
  ];
  ```
- `components/LearningCard.tsx` no está referenciado desde ningún archivo (`grep` solo encuentra su propia definición y su `export default`). Se elimina como código muerto en lugar de arrastrarle la misma prop.

### Frontend — Conceptos: marcador de solo lectura

`components/ConceptsTable.tsx:119-123` — sustituir el `—`:

```tsx
<Tooltip content="Solo su autor puede editarlo" size="sm">
  <span
    role="img"
    aria-label="Solo lectura"
    className="flex h-8 w-8 items-center justify-center min-w-[50px] text-blue-gray-300"
  >
    <LockClosedIcon className="h-4 w-4" />
  </span>
</Tooltip>
```

Decisiones, y el porqué de cada una:

- **No es un `IconButton` deshabilitado.** Un botón apagado promete una acción que no existe e invita a insistir en el clic. El candado no promete nada.
- **`h-8 w-8`** iguala la caja del `IconButton size="sm"` de la rama con permiso. Sin eso, la fila sin acciones es más baja que la fila con acciones y la tabla "respira" distinto según quién mire — el tipo de detalle que nadie nota conscientemente y que, en conjunto, hace que algo se sienta bien hecho.
- **Sin `hover`, sin `transition`, sin borde.** Todo lo accionable de esta tabla tiene borde y `hover:shadow-md`; la ausencia de ambos es la señal de que esto no lo es.
- **`text-blue-gray-300`**: presente pero claramente subordinado. Para un Docente la mayoría de las filas serán ajenas, así que este es el estado **dominante** de la columna y tiene que ser silencioso; un `Chip` "Solo lectura" repetido veinte veces gritaría más que la información de la tabla.
- **El tooltip explica la regla, no repite el dato.** El autor ya está en su propia columna, dos posiciones a la izquierda (`ConceptsTable.tsx:63-76`); repetirlo en el tooltip sería redundante. Lo que falta es el *porqué*.
- El botón "Crear" de `ConceptsPage.tsx:215-222` **no se toca**: el Docente sí puede crear conceptos.

### Frontend — Informes

`pages/ReportsPage.tsx` — mismo patrón que `StudentValuationsPage` en `VAL-04`:
- `const { isAreaLead, schoolId } = usePermissions();`
- Preselección de `selectedSchools` con la sede propia, una sola vez, con guard `useRef`, y solo si ese `schoolId` aparece entre las sedes derivadas de los usuarios (`:31-35`).
- El grupo "Sede" de `filterGroups` (`:49-55`) se omite cuando `!isAreaLead`.

`ConsolidatedReportsPanel.tsx` (`:35-38`, `:113-120`) ya bloquea la sede del Docente y **no se toca**. `ReportsTable.tsx:110-178` tampoco: la habilitación de descarga depende de `valuation.status === "Evaluado"` y de `enabledReports` de la institución, que es lo correcto para ambos roles.

### Frontend — Usuarios

`pages/UsersPage.tsx` — el `canManage` monolítico de `:35` se parte en tres:

```ts
const { isAreaLead } = usePermissions();
const canCreate = isAreaLead;
const canDelete = isAreaLead;
const canEdit   = true;   // ambos roles; el backend acota al Docente a su sede
```

| Elemento | Antes | Después |
|---|---|---|
| Botón "Crear" (`:262-271`) | `canManage` | `canCreate` |
| `ROLE_TABS` (`:25-28`) | siempre las dos pestañas | solo "Estudiantes" cuando `!isAreaLead` — `GET /users?role=Docente` le devuelve `[]` por diseño (`users.service.ts:86-88`), así que la pestaña solo llevaría a una tabla vacía |
| Filtro de sede (`selectedSchools`, `:49`) | visible | omitido cuando `!isAreaLead` |
| `UsersTable` props | `canManage` | `canEdit` + `canDelete` |

`components/UsersTable.tsx:89-120` — la celda se arma por partes en vez de con el ternario todo-o-nada actual:
- lápiz "Ver / Editar" (`:94-103`) si `canEdit`
- `TrashIcon` (`:104-113`) si `canDelete`
- si no hay ninguno, el mismo marcador de solo lectura de Conceptos (aquí sí uniforme, pero la columna se conserva porque el lápiz sigue presente para el Docente)

`components/UserForm.tsx`:
- El `Select` de **sede** (`:198-207` para Estudiante, `:247-256` para Docente) y el de **jornada** (`:276-289`) reciben `disabled={!isAreaLead}`.
- El `ImageCropUploader` (`:126-135`) se mantiene y pasa a ser el **único punto de carga de foto de usuario** de toda la app tras `VAL-04`. El otro uso que queda (`InstitutionShieldPanel.tsx:37`) es el escudo de la institución, no un usuario.

### Documentación

`docs/roles-permissions.md`:
- Evaluaciones → "Eliminar valoración": Docente pasa de ❌ a ✅ (acotado a su sede).
- Gestión → "Crear / editar / eliminar usuarios": desdoblar en tres filas; el Docente queda ✅ solo en editar, acotado a estudiantes de su sede.
- Reescribir la nota final: el "Hueco conocido" de `student-valuation` queda cerrado por `VAL-04`. Dejar anotada la inconsistencia menor que persiste: `report.service.ts:226-227` responde 403 donde `student-valuation` y `users` responden 404.

`docs/domain.md:13` — la fila del Docente dice hoy *"Ver estudiantes (su sede por defecto; filtra otras sedes sin editar)"*. Pasa a: **restringido a su sede**, sin acceso a otras.

## Notas
- El Docente **no** gana acceso a crear ni eliminar usuarios: solo actualizar. Es la asimetría que pidió el usuario y la razón de partir `canManage` en tres banderas en vez de dos.
- `deleteUser` (`users.service.ts:341-356`) no comprueba el rol del objetivo — un Jefe de Área puede borrar a otro Jefe de Área de su institución. Es un hallazgo real pero ajeno a esta spec; se anota en `docs/roles-permissions.md` como deuda, no se corrige aquí.
- Skills de diseño invocadas antes de escribir el cambio de `ConceptsTable`, según `quartz-web/CLAUDE.md`: `emil-design-eng`, `impeccable`, `frontend-design`. `impeccable` pide un `PRODUCT.md` que este repo no tiene; no se crea — el contexto de producto vive en `CLAUDE.md` raíz y `docs/domain.md`.

**Añadido durante la implementación (bug real, no contemplado en el plan original):** `UsersPage.tsx` construía el `payload` de `PATCH /api/users/:userId` incluyendo siempre `schoolId: formData.schoolId`, sin condicionar al rol. Con el Select de sede deshabilitado para el Docente (`UserForm.tsx`), `formData.schoolId` conserva el valor actual — pero el guard del backend rechaza con `403` **cualquier** payload que incluya la clave `schoolId` viniendo de un Docente, sin importar si el valor cambió. Sin este fix, el camino feliz de "Docente edita un estudiante de su sede" habría fallado siempre con 403. Corregido: el campo solo se añade al payload `if (isAreaLead)`.
- Documentación (`docs/roles-permissions.md`, `docs/domain.md`) **diferida a `/sdd-release`**: la skill `sdd-implement` prohíbe escribir documentación en esta fase. El contenido exacto a aplicar queda descrito arriba, en la sección "Documentación" de este plan, para que `/sdd-release` lo ejecute sin tener que re-derivarlo.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Backend, token de Docente de la Sede A:
  ```
  PATCH /api/users/:id   (estudiante de su sede)       → 200
  PATCH /api/users/:id   (estudiante de la Sede B)     → 404
  PATCH /api/users/:id   (docente de su sede)          → 404
  PATCH /api/users/:id   body con schoolId             → 403
  POST  /api/users                                     → 403 (sin cambios)
  DELETE /api/users/:id                                → 403 (sin cambios)
  ```
- Manual (Docente): Aprendizajes sin Crear ni Acciones · Conceptos con candado en los ajenos y tooltip legible · Informes sin filtro de sede y con descargas individual y consolidada cuando el estado es "Evaluado" · Usuarios sin Crear, sin papelera, sin pestaña Docentes, con edición y carga de foto.
- Manual (Jefe de Área): las cuatro pantallas igual que hoy, salvo la sede preseleccionada en Informes.
- Manual (ambos): la carga de imagen de un usuario solo existe en el modal de `/gestion/usuarios`.
