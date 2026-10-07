# INF-10 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/utils/AppError.ts` |
| tocar | `src/middlewares/error.middleware.ts` |
| tocar | `src/features/learning/learning.types.ts` |
| tocar | `src/features/learning/learning.validation.ts` |
| tocar | `src/features/learning/learning.service.ts` |
| tocar | `src/features/learning/learning.controller.ts` |
| tocar | `src/features/student-valuation/student-valuation.model.ts` |
| tocar | `src/features/student-valuation/student-valuation.types.ts` |
| tocar | `src/features/student-valuation/student-valuation.validation.ts` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` |
| tocar | `src/features/report/report.types.ts` |
| tocar | `src/features/report/report.service.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/api/withErrorMessage.ts` |
| crear | `src/components/common/ConflictNotice.tsx` |
| crear | `src/lib/diffChanges.ts` |
| tocar | `src/features/learning/types/api.ts` |
| tocar | `src/features/learning/queries/useLearningsQuery.ts` |
| tocar | `src/features/learning/pages/LearningsPage.tsx` |
| tocar | `src/features/student-valuation/types/` (DTO + `StudentValuationUpdateData`) |
| tocar | `src/features/student-valuation/queries/useStudentValuationQuery.ts` |
| tocar | `src/features/student-valuation/components/StudentValuationDetail.tsx` |
| tocar | `src/features/report/types/` (`ICommunicativeLetterTemplate`, payload de conceptos) |
| tocar | `src/features/report/queries/useReportQuery.ts` |
| tocar | `src/features/report/pages/CommunicativeLetterEditPage.tsx` |
| crear | `src/stores/useDashboardFiltersStore.ts` |
| tocar | `src/features/auth/useAuthStore.ts` (reset en `logout`) |
| tocar | `src/features/dashboard/queries/useDashboardQuery.ts` |
| tocar | `src/features/dashboard/pages/DashboardPage.tsx` |
| tocar | `quartz-web/CLAUDE.md` (tabla de `staleTime`: dashboard sin `gcTime` propio; `src/stores/` incluye dashboard) |

## Contratos
### Errores (api)
- `AppError`: `constructor(message: string, statusCode: number, code?: string)`; `public code?: string`.
- `errorHandler`:
  - `AppError` → `res.status(statusCode).json({ message, ...(code && { code }) })`.
  - `mongoose.Error.VersionError` → `409 { message: 'El registro fue modificado por otro usuario.', code: 'VERSION_CONFLICT' }`.
- Constante `VERSION_CONFLICT = 'VERSION_CONFLICT'` exportada desde `src/utils/AppError.ts`.

### Tipos / DTOs
| Tipo | Cambio |
|---|---|
| `ILearningResponse` (`learning.types.ts`) | `version: number` |
| `UpdateLearningData` | `version: number` (se separa del `$set`) |
| `IStudentValuationDTO` | `version: number` |
| `IStudentValuationLean` | añade `'__v'` al `Pick` |
| `StudentValuationUpdateData` / `StudentValuationConceptsUpdateData` | `version: number` |
| `ICommunicativeLetterTemplate` (`report.types.ts`) | `version: number` |

Mapeo: `version = doc.__v ?? 0` en:
- `mapLearningToResponse`;
- `mapValuationToDTO` (cubre `populateAndMapValuation`);
- `getCommunicativeLetterReport` y el builder de la carta (`report.service.ts:~342`).

### Modelo Mongoose
- `studentValuationSchema`: opción `optimisticConcurrency: true`. `save()` filtra por `__v` y lo incrementa; si cambió entre la lectura y el `save`, lanza `VersionError`.
- `LearningSchema`: sin cambios (el control va en el update).
- Sin índices nuevos: el filtro es `_id` + `institutionId` + `__v`, resuelto por `_id`.

### Zod
- `version: z.number().int().nonnegative()` (requerido) en:
  - `updateLearningSchema.body`;
  - `studentValuationValidation.updateValuation.body`;
  - `studentValuationValidation.updateValuationConcepts.body`.
- Si algún `body` es `.strict()`, añadir `version` dentro del objeto (ver `quartz-api/docs/known-issues.md`).

### Servicios
**`updateLearning(learningId, institutionId, { version, ...data })`**
1. `findOneAndUpdateScoped(LearningModel, institutionId, { _id, __v: version }, { $set: data, $inc: { __v: 1 } }, { new: true })`.
2. Sin match → `findByIdScoped(...).select('_id').lean()`:
   - no existe → `return null` (el controller da `404`);
   - existe → `throw new AppError('Otro usuario modificó este aprendizaje.', 409, VERSION_CONFLICT)`.
3. `invalidatePrefix('dashboard:…')` solo si hubo match.

**`updateStudentValuation` / `updateValuationConcepts`**
- Tras `findOneScoped` y antes de mutar: `if (valuation.__v !== data.version) throw new AppError('Otro usuario modificó esta valoración.', 409, VERSION_CONFLICT)`.
- La carrera entre esa lectura y el `save` la cubre `optimisticConcurrency` (`VersionError` → `409`).
- El `409` "aún no evaluada" se queda sin `code`.

### Endpoints (sin rutas nuevas; cambia el contrato)
| Método | Ruta | Body nuevo | Respuestas nuevas |
|---|---|---|---|
| PATCH | `/api/learnings/:learningId` | `version` | `409 VERSION_CONFLICT` |
| PATCH | `/api/student-valuations/:valuationId` | `version` | `409 VERSION_CONFLICT` |
| PATCH | `/api/student-valuations/:valuationId/concepts` | `version` | `409 VERSION_CONFLICT` |
| GET | `/api/learnings`, `/api/student-valuations/*`, `/api/reports/communicative-letter/:valuationId` | — | `version` en el payload |

Middlewares sin cambios: `authenticateJWT → requireTenant → authorize → validate → asyncHandler`.

### Frontend
**`src/api/withErrorMessage.ts`**
- `export class ApiError extends Error { status?: number; code?: string }`.
- `withErrorMessage` lanza `ApiError` con el mensaje resuelto, más `status` y `code` leídos de `err.response`.
- Helpers:
  - `isVersionConflict(err): boolean` (`status === 409 && code === 'VERSION_CONFLICT'`);
  - `isNotFound(err): boolean`.
- `toast.promise` sigue mostrando `err.toString()`; `ApiError.name = 'Error'` para no cambiar el texto.

**`src/components/common/ConflictNotice.tsx`** (presentacional, sin llamadas API)
- Props:
  ```ts
  export interface ConflictChange {
    label: string;    // p. ej. 'Dimensión'
    from?: string;
    to?: string;
    detail?: string;  // contenido largo expandible (descripción)
  }
  export interface ConflictNoticeProps {
    title: string;
    changes: ConflictChange[];
    summary?: string; // p. ej. '3 ítems y 1 dimensión fueron actualizados'
    isSaving: boolean;
    onKeepMine: () => void;
    onUseCurrent: () => void;
  }
  export default function ConflictNotice(p: ConflictNoticeProps) { … }
  ```
- Texto fijo de la descripción y de los botones según el spec. Botones: `Button` de material-tailwind con `ripple={false}` (ver `docs/known-issues.md`).
- La primaria muestra estado de carga con `isSaving`.
- `role="alert"`; foco al montar (`ref.focus()` sobre el contenedor con `tabIndex={-1}`).
- Entrada con animación corta, respetando `motion-reduce`.
- Estilo ámbar (aviso, no error). Mobile-first, Tailwind.
- Diseño final vía las skills obligatorias de `quartz-web` (`emil-design-eng`, `impeccable`, `frontend-design`).

**`src/lib/diffChanges.ts`** (funciones puras)
- `diffLearning(base: Learning, current: Learning): ConflictChange[]`: compara `subject.name`, `period.name` y `description`.
- `diffValuationItems(base: IStudentValuationDTO, current: IStudentValuationDTO): { itemIds: Set<string>; subjectIds: Set<string>; summary: string }`:
  - ítems por `learningId`;
  - dimensiones por `performanceDescription`;
  - `observations`.
- `diffLetterConcepts(base, current): Set<string>` (subjectIds con concepto distinto).

**`useLearningsQuery.ts`**
- `useUpdateLearningMutation` / `useDeleteLearningMutation`: `onError: (err) => { if (isVersionConflict(err) || isNotFound(err)) invalidate(); }`.

**`LearningsPage.tsx`**
- Estado local:
  - `editBase: Learning | null`: snapshot de `selectedLearning` al abrir el modal; aporta la `version` y la base del diff;
  - `conflict: { current: Learning; changes: ConflictChange[] } | null`.
- El PATCH envía `{ ...learningFormData, version: editBase.version }`. El `toast.promise` actual se conserva para el camino feliz y los errores genéricos.
- En `409`:
  1. sin toast de error;
  2. refetch de la lista;
  3. `current` = el mismo `_id` en la lista nueva;
  4. `conflict = { current, changes: diffLearning(editBase, current) }`;
  5. el modal sigue abierto con `learningFormData` intacto y `<ConflictNotice>` arriba del formulario;
  6. el footer del `FormModal` oculta "Guardar" mientras haya `conflict`.
- "Guardar mis cambios": PATCH con `version: current.version` → éxito: toast "Cambios guardados", cierra el modal. Si hay un nuevo `409`, se repite desde el paso 2.
- "Usar la versión actual": precarga el formulario con `current`, `editBase = current`, `conflict = null`, toast "Se cargó la versión actual". El modal queda abierto para seguir editando o cerrar.
- En `404`: cierra el modal + toast "Este aprendizaje ya no existe: otra persona lo eliminó. La lista se actualizó.".

**`useStudentValuationQuery.ts` / `StudentValuationDetail.tsx`**
- `onError`: `409`/`404` → `invalidateQueries(valuationKeys.detail(...))`.
- El payload de `handleSave` envía `version: baseValuation.version`.
- Estado `conflict: { current: IStudentValuationDTO; itemIds: Set<string>; subjectIds: Set<string>; summary: string } | null`.
- En `409`, tras el refetch: `conflict = { current, ...diffValuationItems(baseValuation, current) }`; `localValuation` intacto.
  - La regla "adopta del servidor solo si no hay borrador" (`StudentValuationDetail.tsx:51`) se mantiene.
  - Con `conflict` activo no se adopta nada automáticamente.
- `<ConflictNotice>` va arriba del acordeón de dimensiones.
  - Los ítems en `itemIds` y las dimensiones en `subjectIds` llevan la marca "Actualizado por otra persona" (prop opcional `isExternallyUpdated` en los componentes de ítem/dimensión).
  - La dimensión afectada se abre automáticamente si ninguna lo está.
- "Guardar mis cambios": `setBaseValuation(current)` + `handleSave()` con `current.version`; éxito → `conflict = null`.
- "Usar la versión actual": `syncFromServer(current)`, `conflict = null`.
- En `404`: la pantalla muestra el estado "Esta evaluación fue eliminada por otra persona." con el botón "Volver a Evaluación". Reutiliza `EmptyState`.
- `useBlocker` sigue protegiendo el borrador al navegar mientras haya `conflict`.

**`useReportQuery.ts` / `CommunicativeLetterEditPage.tsx`**
- `useSaveLetterConceptsMutation` envía `{ assignments, version }`. En `onError`, `409`/`404` → invalida `reportKeys.letter(valuationId)`.
- La página envía `currentLetter.version`.
- En `409`, tras el refetch:
  - `conflict = { current, subjectIds: diffLetterConcepts(currentLetter, current) }`;
  - `selection`/`conceptText` intactos;
  - `<ConflictNotice>` con la marca en las dimensiones afectadas.
- "Guardar mis cambios": `setCurrentLetter(current)` + guardar con `current.version`.
- "Usar la versión actual": adopta `current` y reinicia `selection`/`conceptText` desde ella.
- En `404`: mismo estado vacío que la valoración.

**Dashboard**
- `src/stores/useDashboardFiltersStore.ts` (Zustand, en memoria, sin `persist`):
  - estado `{ filters: DashboardFilterValues; initialized: boolean }`;
  - acciones `setFilters(values)`, `initDefaults(periodId)` (idempotente con `initialized`), `reset()`.
- No se reutiliza `useTableFiltersStore`: su forma es multi-selección (`Record<string, string[]>`) y los filtros del dashboard son valores únicos.
- `useAuthStore.logout()` llama `useDashboardFiltersStore.getState().reset()` (junto a `resetAll()` de tablas).
- `DashboardPage`:
  - lee filtros del store con selector;
  - `useEffect(() => { if (activePeriod) initDefaults(activePeriod._id) }, [activePeriod, initDefaults])`.
- `useDashboardQuery`: se elimina `gcTime: 5 * 60_000` (hereda 30 min); `staleTime`, `refetchOnWindowFocus` y `placeholderData` quedan igual.

## Notas
- **`__v` como token:** ya existe en todos los documentos (default `0`), no requiere migración, y Mongoose lo integra con `optimisticConcurrency`. `updatedAt` se descarta: precisión de ms y no lo verifica `save()`.
- **Learning con `findOneAndUpdate`** no usa versionado automático: el `$inc` explícito es obligatorio, o el token nunca cambia.
- **El segundo guardado gana solo por decisión explícita:** "Guardar mis cambios" sobrescribe después de ver qué cambió la otra persona. No hay merge automático por campo.
- **Diff en el cliente:** el aviso compara la base de edición con la versión actual que ya se refrescó. No se añade un campo `updatedBy` al modelo, así que el aviso no dice quién hizo el cambio: "otra persona".
- **Lista de aprendizajes:** una revalidación en segundo plano puede cambiar `selectedLearning`; por eso `editVersion` se congela al abrir el modal.
- **Primer deploy:** un cliente con el bundle anterior manda PATCH sin `version` → `400`. Aceptable: la SPA se recarga con el deploy.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual (usuario), dos navegadores con dos Jefes de Área:
  - **Aprendizaje:** editar el mismo en A y B; guardar en A y luego en B → B ve el aviso en línea con lo que cambió A y su texto intacto; probar ambas acciones ("Guardar mis cambios" / "Usar la versión actual").
  - **Valoración:** misma prueba en `StudentValuationDetail` (ítems marcados "Actualizado por otra persona") y en la edición de conceptos de la carta.
  - **Borrado:** borrar en A y guardar en B → `404`, toast y la fila desaparece.
  - **Dashboard:** cambiar filtros, ir a otra sección más de 5 min y volver → sin skeleton y con los filtros conservados. F5 → periodo activo por defecto.
