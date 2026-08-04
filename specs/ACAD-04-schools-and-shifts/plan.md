# ACAD-04 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| crear | `src/features/school/school.types.ts` |
| tocar | `src/features/school/school.model.ts` |
| crear | `src/features/school/school.validation.ts` |
| tocar | `src/features/school/school.service.ts` |
| tocar | `src/features/school/school.controller.ts` |
| tocar | `src/features/school/school.routes.ts` |
| tocar | `src/features/institution/institution.types.ts` |
| tocar | `src/features/institution/institution.model.ts` |
| tocar | `src/features/institution/institution.validation.ts` |
| tocar | `src/features/institution/institution.service.ts` |
| tocar | `src/features/auth/auth.model.ts` |
| tocar | `src/features/auth/auth.types.ts` |
| tocar | `src/features/auth/auth.service.ts` |
| tocar | `src/features/users/users.types.ts` |
| tocar | `src/features/users/users.validation.ts` |
| tocar | `src/features/users/users.service.ts` |

`app.ts` no se toca: `/api/schools` y `/api/institutions` ya están montados (líneas 39 y 47).

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/school/types/{api.ts,store.ts,index.ts}` |
| crear | `src/features/school/useSchoolStore.ts` |
| crear | `src/features/school/components/SchoolsPanel.tsx` |
| crear | `src/features/school/components/SchoolForm.tsx` |
| crear | `src/features/institution/components/ShiftsPanel.tsx` |
| tocar | `src/features/institution/types/{api.ts,store.ts}` |
| tocar | `src/features/institution/useInstitutionStore.ts` |
| tocar | `src/features/configuration/pages/ConfigurationPage.tsx` |
| tocar | `src/features/users/types/api.ts` |
| tocar | `src/features/users/components/UserForm.tsx` |
| tocar | `src/features/users/components/UsersTable.tsx` |
| tocar | `src/features/users/pages/UsersPage.tsx` |
| tocar | `src/types/domain.ts` |
| tocar | `src/features/auth/types/store.ts` |
| tocar | `src/features/auth/useAuthStore.ts` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/data-model.md` |

---

## Contratos

### Tipos / DTOs

`school.types.ts` (nuevo):
```typescript
export interface ISchoolDTO {
  _id: string;
  schoolNumber: number;
  name: string;
}

export interface CreateSchoolData { name: string; }
export type UpdateSchoolData = Partial<CreateSchoolData>;
```

`institution.types.ts` (extender):
```typescript
export interface IShiftDTO {
  _id: string;
  name: string;
}

export interface IInstitutionSettings {
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: IShiftDTO[];
}

// El payload de entrada admite jornadas sin _id: son las nuevas.
export type ShiftInput = { _id?: string; name: string };

export type UpdateInstitutionSettingsData = Partial<{
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: ShiftInput[];
}>;

export interface IShiftSettings {
  multipleShifts: boolean;
  shifts: IShiftDTO[];
}
```
`IInstitutionDTO.settings` pasa a exponer los tres campos.

`users.types.ts` (extender):
```typescript
export interface Shift { _id: string; name: string; }

// UserWithValuations gana:
shift?: Shift | null;

// CreateUserDTO gana:
shiftId?: string;

// UpdateUserDTO: Partial<Omit<CreateUserDTO,'role'>> ya lo hereda; el service
// interpreta `null` como desasignación (ver Zod).
```

`auth.types.ts` — `ISessionData` gana:
```typescript
multipleShifts: boolean;
shifts: { _id: string; name: string }[];
```

### Modelo Mongoose

`school.model.ts` — sin campos nuevos; se endurece lo existente:

| Cambio | Detalle |
|---|---|
| `institutionId` | añadir `index: true` |
| `name` | añadir `trim: true` |
| índice | `schoolSchema.index({ institutionId: 1, schoolNumber: 1 }, { unique: true })` |

`institution.model.ts` — subesquema nuevo con `_id` **habilitado** (es la fuente del id único de la jornada):
```typescript
const ShiftSchema = new Schema<IShiftDocument>({
  name: { type: String, required: true, trim: true },
});
```
`InstitutionSettingsSchema` gana:

| Campo | Tipo | Notas |
|---|---|---|
| `multipleShifts` | `Boolean` | `default: false` |
| `shifts` | `[ShiftSchema]` | `default: []` |

`InstitutionSettingsSchema` mantiene `{ _id: false }`; `ShiftSchema` **no** lo lleva.

`auth.model.ts` — `IUser` / `UserSchema` ganan:

| Campo | Tipo | Notas |
|---|---|---|
| `shiftId` | `Schema.Types.ObjectId` | opcional, **sin `ref`** — apunta a `Institution.settings.shifts[]._id`, subdocumento embebido no poblable. Comentar en el schema. |

`toSafeUser()` no lo incluye: `shiftId` no se usa en sesión ni en autorización (ver Nota 4).

### Zod

`school.validation.ts` (nuevo) — mismo helper `objectId` que `users.validation.ts`:

| Esquema | Forma |
|---|---|
| `createSchoolSchema` | `body: { name: string().trim().min(1).max(120) }.strict()` |
| `updateSchoolSchema` | `params: { schoolId: objectId }.strict()` · `body: { name: string().trim().min(1).max(120) }.strict()` |
| `deleteSchoolSchema` | `params: { schoolId: objectId }.strict()` |

`institution.validation.ts` — `updateInstitutionSettingsSchema.body.settings` gana:
```typescript
multipleShifts: z.boolean().optional(),
shifts: z.array(z.object({
  _id: objectId('El ID de la jornada no es un ObjectId válido.').optional(),
  name: z.string().trim().min(1, 'El nombre de la jornada es obligatorio.').max(60),
}).strict()).max(10).optional(),
```
Los conflictos semánticos (duplicados, lista vacía con el switch encendido, jornada en uso) los resuelve el **service** con `AppError`, no Zod — mismo criterio que `enabledReports` vacío en ACAD-02.

`users.validation.ts`:

| Esquema | Cambio |
|---|---|
| `createStudentSchema` | gana `shiftId: objectId('El ID de la jornada no es un ObjectId válido.').optional()` |
| `createTeacherSchema` | **sin cambios** — al ser `.strict()`, un `shiftId` en el payload de docente devuelve `400` |
| `updateUserSchema.body` | gana `shiftId: objectId(…).nullable().optional()` (`null` = desasignar) |

### Endpoints

| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/schools` | Autenticado | `authenticateJWT → requireTenant → asyncHandler` (existente) |
| POST | `/api/schools` | Jefe de Área | `authenticateJWT → requireTenant → authorize([UserRole.JEFE_DE_AREA]) → validate(createSchoolSchema) → asyncHandler` |
| PATCH | `/api/schools/:schoolId` | Jefe de Área | `… → validate(updateSchoolSchema) → asyncHandler` |
| DELETE | `/api/schools/:schoolId` | Jefe de Área | `… → validate(deleteSchoolSchema) → asyncHandler` |
| PATCH | `/api/institutions/me` | Jefe de Área | existente; el body gana `settings.multipleShifts` y `settings.shifts` |
| POST/PATCH | `/api/users`, `/api/users/:userId` | Jefe de Área | existentes; el body gana `shiftId` |

Sin endpoint propio para jornadas: viven en `settings` y se guardan con el `PATCH` de institución.

### Service — `school.service.ts`

Se reescribe con la convención vigente: sin `try/catch` ni `console.error` (hoy los tiene, `school.service.ts:7-11`), `.lean()` en lecturas y `AppError` para fallos esperables.

- `getSchoolsByInstitution(institutionId)` → `findScoped(SchoolModel, institutionId).sort({ schoolNumber: 1 }).lean()` → `ISchoolDTO[]`.
- `createSchool(institutionId, data)`
  1. Duplicado por nombre: `findOneScoped(SchoolModel, institutionId, { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } })` → `AppError('Ya existe una sede con ese nombre.', 409)`.
  2. `schoolNumber`: `findScoped(SchoolModel, institutionId).sort({ schoolNumber: -1 }).limit(1).lean()` → `(último?.schoolNumber ?? 0) + 1`.
  3. `createScoped(SchoolModel, institutionId, { name, schoolNumber })`.
- `updateSchool(institutionId, schoolId, data)` → duplicado excluyendo `_id: { $ne: schoolId }` → `409`; `findOneAndUpdateScoped(..., { new: true, runValidators: true }).lean()`; `null` → `AppError('Sede no encontrada.', 404)`. `schoolNumber` nunca se toca.
- `deleteSchool(institutionId, schoolId)`
  1. `User.countDocuments({ institutionId, schoolId })` > 0 → `AppError(`La sede tiene ${n} usuario(s) asociado(s). Reasígnalos antes de eliminarla.`, 409)`.
  2. `SchoolModel.countDocuments({ institutionId })` === 1 → `AppError('La institución debe tener al menos una sede.', 409)`.
  3. `findOneAndDeleteScoped(...).lean()`; `null` → `AppError('Sede no encontrada.', 404)`.

`countDocuments` no está en `base.repository`; se invoca con `institutionId` explícito en el filtro, que es igualmente tenant-safe (ver Nota 2).

### Service — `institution.service.ts`

`mapInstitutionToDTO` añade `multipleShifts: settings?.multipleShifts ?? false` y `shifts: (settings?.shifts ?? []).map(s => ({ _id: s._id.toString(), name: s.name }))`.

`updateInstitutionSettings(institutionId, data)` — orden de validación:
1. `enabledReports` vacío → `422` (existente).
2. Si viene `shifts`: nombres duplicados tras `trim().toLowerCase()` → `AppError('Hay jornadas con el nombre repetido.', 422)`.
3. Estado resultante: `nextMultiple = data.multipleShifts ?? actual.multipleShifts`; `nextShifts = data.shifts ?? actual.shifts`.
4. `nextMultiple === true && nextShifts.length === 0` → `AppError('Debe registrar al menos una jornada.', 422)`.
5. Jornadas eliminadas (`_id` en `actual.shifts` ausente de `nextShifts`): por cada una, `User.countDocuments({ institutionId, shiftId })` > 0 → `AppError(`La jornada «${name}» tiene ${n} estudiante(s) asignado(s).`, 409)`.
6. `nextMultiple === false && actual.multipleShifts === true` → `User.countDocuments({ institutionId, shiftId: { $exists: true, $ne: null } })` > 0 → `AppError('Hay estudiantes con jornada asignada. Quítasela antes de desactivar las jornadas.', 409)`.
7. Reconciliación del array a persistir: entrada con `_id` conocido → conserva el `_id`; entrada sin `_id` → `new Types.ObjectId()`. Un `_id` que no exista en `actual.shifts` → `AppError('La jornada no existe en la institución.', 422)`.
8. `$set` de `settings.multipleShifts` / `settings.shifts` solo para las claves presentes en `data`.

Apagar el switch **no borra** `settings.shifts` (criterio EARS): los nombres sobreviven al reactivarlo.

Función nueva para la sesión, en el mismo archivo y con el mismo patrón ligero que `getEnabledReports`:
```typescript
export const getShiftSettings = async (institutionId: string): Promise<IShiftSettings>
// Institution.findById(institutionId).select('settings.multipleShifts settings.shifts').lean()
// Sin gate de rol: lo consume getSessionData para cualquier autenticado.
```

### Service — `auth.service.ts`
`getSessionData` añade `getShiftSettings(institutionId)` al `Promise.all` existente y vuelca `multipleShifts` y `shifts` en `sessionData`. Mismo razonamiento que `enabledReports` en ACAD-02 (Nota 0 de su plan): el `Docente` ve `/gestion/usuarios` pero recibe `403` en `/api/institutions/me`.

### Service — `users.service.ts`
- Helper nuevo `resolveShiftMap(institutionId)` → `Map<string, string>` (id → nombre) desde `getShiftSettings`. Una sola lectura por request.
- `getUsersByFilters`: añade `shiftId` al `.select()` y resuelve `shift: map.get(shiftId) ? { _id, name } : null` en el mapeo final. La lectura del mapa se suma al `Promise.all` de valoraciones/sedes, no se hace por usuario.
- `mapUserToDTO`: gana un tercer parámetro `shift: Shift | null`.
- `createUser`: si `data.shiftId` → validar contra `getShiftSettings`: `multipleShifts === false` o `_id` inexistente → `AppError('La jornada no existe o no está habilitada en la institución.', 422)`. Persistir `shiftId: new Types.ObjectId(data.shiftId)`.
- `updateUser`: `shiftId === null` → `$unset: { shiftId: 1 }`; `shiftId` string → misma validación que en `createUser`; `undefined` → no se toca.

### Frontend

**`features/school/`** (nuevo, patrón canónico de `features/subject/`):
- `types/store.ts`: `SchoolDto { _id, schoolNumber, name }`, `SchoolState` (`schools`, `isLoading`, `isSubmitting`, `error`, `fetchSchools`, `createSchool`, `updateSchool`, `deleteSchool`).
- `types/api.ts`: `NewSchool { name }`, `UpdateSchool = Partial<NewSchool>`.
- `useSchoolStore.ts`: convención de `useSubjectStore`: `fetch*` traga el error; `create/update/delete` hacen `set({ error })` **y** `throw` para `toast.promise`.
- `components/SchoolsPanel.tsx`: calco de `SubjectsPanel` — `DataTable` + `FormModal` + `ConfirmationModal`, columnas `Sede N` / Nombre / Acciones, `FormModal scrollable={false}`.
- `components/SchoolForm.tsx`: presentacional, un `Input` (`color="purple"`, `crossOrigin="anonymous"`), sin llamadas API. `schoolNumber` se muestra como texto de solo lectura al editar; nunca es editable.

**`features/institution/components/ShiftsPanel.tsx`** (nuevo):
- `Switch` de `@material-tailwind/react` (`color="purple"`) etiquetado «Maneja varias jornadas».
- Apagado → solo el switch y una línea de ayuda; la lista no se renderiza.
- Encendido → lista de filas `Input` (nombre libre) + `IconButton` de eliminar, más un botón «Agregar jornada». Estado local `ShiftDraft[] = { _id?: string; name: string }`; se guarda todo junto con `updateSettings({ multipleShifts, shifts })`.
- Botón Guardar deshabilitado si no hay cambios, si el switch está encendido con la lista vacía, o si hay nombres vacíos/repetidos (validación en cliente además de la del backend).
- Errores `409` del backend se muestran vía `toast.promise` con el mensaje del `AppError`.

**`features/institution/useInstitutionStore.ts`**: tras `updateSettings`, además del `setEnabledReports` existente, sincroniza `useAuthStore.getState().setShifts(updated.settings.multipleShifts, updated.settings.shifts)` — el modal de usuarios lee de `sessionData`, que solo se puebla en el login.

**`features/configuration/pages/ConfigurationPage.tsx`**: quinta entrada en `STEPS`:
```typescript
{ value: "sedes-jornadas", step: 5, label: "Sedes y jornadas", hint: "Dónde enseñas", icon: BuildingOffice2Icon }
```
`TabPanel` correspondiente = `<SchoolsPanel />` sobre `<ShiftsPanel />`, separados por un divisor. El subtítulo de la página pasa de «en cuatro pasos» a «en cinco pasos» y enumera sedes y jornadas.

**`types/domain.ts`**: `export interface Shift { _id: string; name: string }`; `ISessionData` gana `multipleShifts: boolean` y `shifts: Shift[]`.

**`features/auth/`**: `AuthState` gana `setShifts: (multipleShifts: boolean, shifts: Shift[]) => void`; implementación en `useAuthStore` idéntica a `setEnabledReports`.

**`features/users/`**:
- `types/api.ts`: `UserDto` gana `shift?: Shift | null`; `NewUser` gana `shiftId?: string`; `UpdateUser` hereda `shiftId?: string | null` (se declara explícito porque `null` no sale de `Partial<NewUser>`).
- `UserForm.tsx`: `UserFormData` gana `shiftId: string`; props ganan `shifts: Shift[]` y `multipleShifts: boolean`. El `Select` **Jornada (opcional)** se renderiza solo si `!isTeacher && multipleShifts && shifts.length > 0`, junto al de Grado, con una `Option value="">Sin jornada</Option>` al inicio. Se suma a la comparación de `isDirty`. `menuProps={{ placement: "bottom" }}` — el modal es `size="md"` y scrollable (ver Nota 5).
- `UsersPage.tsx`: lee `multipleShifts`/`shifts` de `useAuthStore().sessionData`, los pasa a `UserForm`, e incluye en los payloads: en creación `shiftId: formData.shiftId || undefined`; en edición `shiftId: formData.shiftId || null`. La jornada **nunca** entra en la validación de campos obligatorios del submit.
- `UsersTable.tsx`: la columna Sede muestra el nombre de la jornada como subtítulo (`text-xs opacity-70`) cuando `multipleShifts` está activo y el usuario tiene `shift`.

**Acabado:** aplicar las skills `impeccable`, `emil-design-eng` y `frontend-design` antes de escribir la UI (obligatorio por `quartz-web/CLAUDE.md`).

---

## Notas

1. **`schoolNumber` autoasignado, no editable.** Hoy es `required` y nadie lo escribe (no había `POST`). Se usa como etiqueta «Sede N» en `ReportsTable.tsx:99` y `StudentValuationTable.tsx:180`, así que debe ser estable: renombrar una sede no lo altera y eliminar la sede 2 de 3 deja `[1, 3]` sin renumerar (renumerar cambiaría la etiqueta de sedes ajenas a la operación). El consecutivo se calcula con `max + 1`, no con `count + 1`, precisamente por eso. El índice único `{ institutionId, schoolNumber }` convierte una carrera entre dos altas simultáneas en `E11000` en vez de en dos sedes con el mismo número; con un solo Jefe de Área por institución el escenario es marginal.

2. **`countDocuments` fuera de `base.repository`.** Las tres comprobaciones de integridad (usuarios por sede, usuarios por jornada, sedes restantes) necesitan un conteo, y el repositorio tenant-safe no lo expone. Se llama al modelo directo **con `institutionId` explícito en el filtro**. Alternativa descartada: añadir `countScoped` al repositorio — se puede hacer si aparece un tercer consumidor, pero hoy sería una abstracción para un solo feature.

3. **Jornadas embebidas: por qué no una colección.** Son 2–4 documentos por inquilino, sin atributos propios más allá del nombre y sin ciclo de vida independiente. Embebidas en `Institution.settings` heredan el aislamiento del documento del inquilino (imposible fugarlas entre instituciones), se leen en la misma consulta que el resto de `settings` y no exigen un feature de 6 archivos. El costo es que `User.shiftId` es una referencia **no poblable**: el nombre se resuelve con un `Map` en memoria (`resolveShiftMap`), que para una lista de este tamaño es más barato que un `populate`.

4. **`shiftId` no viaja en el token ni en `toSafeUser()`.** A diferencia de `schoolId` —que sí gobierna autorización: un `Docente` solo ve estudiantes de su sede (`users.service.ts:82`, `report.service.ts:35`)— la jornada es informativa. Meterla en el token obligaría a reemitirlo al reasignarla, sin ganar nada.

5. **`Select` de jornada dentro del `FormModal`.** El modal de usuarios es `size="md"` con `DialogBody` scrollable, y el `Select` de Material Tailwind ya dio problemas de clipping en ese contexto (`dbe601d`, y la memoria del proyecto sobre popovers en modales con scroll). Reutilizar el componente real con `menuProps` ajustado; no recrear el posicionamiento a mano.

6. **`multipleShifts: false` es el estado por defecto y el camino que no cambia.** La mayoría de inquilinos maneja una sola jornada: con el switch apagado, `/gestion/usuarios` renderiza exactamente el mismo formulario que hoy y el backend no ejecuta ninguna validación adicional. Toda la lógica nueva está detrás de esa bandera.

7. **Instituciones existentes.** `settings` ya se declara con `default: () => ({})` (ACAD-02), así que `multipleShifts: false` y `shifts: []` se resuelven al leer sin migración. No hay script que ejecutar, a diferencia de `Period.year` en ACAD-02.

8. **`useSchoolsQuery` de `/gestion/usuarios` no se toca.** Vive en react-query (`users/queries/useSchoolsQuery.ts`, key `['schools']`) mientras el panel de Configuración usará Zustand, coherente con sus paneles hermanos (`SubjectsPanel`, `PeriodsPanel`). Son dos consumidores independientes del mismo `GET /api/schools`: crear una sede en Configuración y saltar a Usuarios la muestra igualmente, porque la query se revalida al montar. No se comparte caché entre ambos mundos y no hace falta.

9. **`docs/data-model.md`.** Actualizar la fila `Institution` (`settings` ahora incluye `multipleShifts` y `shifts`, con las jornadas como subdocumentos con `_id` propio), la fila `School` (catálogo gestionable por el Jefe de Área, ACAD-04) y la fila `User` (`shiftId` opcional, referencia no poblable a `Institution.settings.shifts[]._id`).

---

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Crear tres sedes seguidas → `schoolNumber` 1, 2, 3. Eliminar la 2 y crear otra → la nueva es la 4.
- Crear una sede con el nombre de otra cambiando mayúsculas o con espacios al final → `409`.
- Eliminar una sede con estudiantes → `409` con el conteo. Eliminar la única sede → `409`.
- Un `Docente` recibe `403` en `POST`/`PATCH`/`DELETE` de `/api/schools` y `200` en `GET`.
- Encender el switch sin jornadas y guardar → `422`. Guardar dos jornadas con el mismo nombre → `422`.
- Asignar jornada a un estudiante, intentar borrar esa jornada → `409`. Intentar apagar el switch → `409`.
- Apagar el switch sin asignaciones, volver a encenderlo → las jornadas guardadas siguen ahí.
- Con el switch apagado: el modal de estudiante no muestra el campo Jornada y el alta funciona igual que antes del feature.
- Crear un estudiante con jornada, cerrar sesión y volver a entrar → `sessionData.shifts` llega poblado y la tabla muestra la jornada bajo la sede.
- Editar ese estudiante y elegir «Sin jornada» → `GET /api/users` devuelve `shift: null`.
- `POST /api/users` con `role: 'Docente'` y `shiftId` → `400`.
- `PATCH /api/users/:id` con un `shiftId` de otra institución → `422`.
