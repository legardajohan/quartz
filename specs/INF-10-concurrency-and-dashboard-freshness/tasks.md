# INF-10 — Tasks

## Backend (`quartz-api`)
- [x] `utils/AppError.ts` — `code?: string` opcional en el constructor + `export const VERSION_CONFLICT`.
- [x] `middlewares/error.middleware.ts` — incluir `code` en el JSON del `AppError`; mapear `mongoose.Error.VersionError` → `409 VERSION_CONFLICT`.
- [x] `learning.types.ts` — `version` en `ILearningResponse` y `UpdateLearningData`.
- [x] `learning.validation.ts` — `version: z.number().int().nonnegative()` en `updateLearningSchema.body`.
- [x] `learning.service.ts` — `updateLearning`:
  - filtro `{ _id, __v: version }` scoped + `{ $set, $inc: { __v: 1 } }`;
  - sin match → `null` (no existe) o `AppError(409, VERSION_CONFLICT)`;
  - `invalidatePrefix` solo si hubo match.
- [x] `learning.controller.ts` — `mapLearningToResponse` devuelve `version` (sin `try/catch`).
- [x] `student-valuation.model.ts` — `optimisticConcurrency: true` en `studentValuationSchema`.
- [x] `student-valuation.types.ts` — `version` en `IStudentValuationDTO`, `StudentValuationUpdateData`, `StudentValuationConceptsUpdateData`; `'__v'` en `IStudentValuationLean`.
- [x] `student-valuation.validation.ts` — `version` requerido en `updateValuation.body` y `updateValuationConcepts.body`.
- [x] `student-valuation.service.ts`:
  - `mapValuationToDTO` → `version: __v ?? 0`;
  - `updateStudentValuation` y `updateValuationConcepts` → `__v !== version` lanza `AppError(409, VERSION_CONFLICT)` antes de mutar;
  - el `409` "aún no evaluada" queda sin `code`.
- [x] `report.types.ts` + `report.service.ts` — `version` en `ICommunicativeLetterTemplate` (desde la valoración) en los builders de la carta.

## Frontend (`quartz-web`)
- [x] Invocar las skills de diseño obligatorias (`emil-design-eng`, `impeccable`, `frontend-design`) antes de escribir UI.
- [x] `api/withErrorMessage.ts` — `ApiError` (`status`, `code`) + `isVersionConflict`, `isNotFound`; el mensaje del toast no cambia.
- [x] `components/common/ConflictNotice.tsx`:
  - aviso en línea ámbar, `role="alert"` con foco al montar;
  - lista de cambios (expandible para textos largos) + `summary`;
  - acciones "Guardar mis cambios" (con carga) / "Usar la versión actual";
  - `ripple={false}` y `motion-reduce`.
- [x] `lib/diffChanges.ts` — `diffLearning`, `diffValuationItems`, `diffLetterConcepts` (funciones puras).
- [x] `learning/types/api.ts` — `version` en `Learning` y `UpdateLearning`.
- [x] `learning/queries/useLearningsQuery.ts` — `onError` `409`/`404` → `invalidate()` en update/delete.
- [x] `learning/pages/LearningsPage.tsx`:
  - `editBase` congelado al abrir el modal, con su `version` enviada en el PATCH;
  - en `409`: refetch + `ConflictNotice` en el modal con `diffLearning`, formulario intacto y "Guardar" oculto;
  - acciones: guardar sobre `current.version` / precargar `current`;
  - en `404`: cierra el modal + toast "ya no existe… La lista se actualizó.".
- [x] `student-valuation/types/` — `version` en DTO y en el payload de update.
- [x] `student-valuation/queries/useStudentValuationQuery.ts` — `onError` `409`/`404` → invalida `valuationKeys.detail`.
- [x] `student-valuation/components/StudentValuationDetail.tsx`:
  - envía `version: baseValuation.version`;
  - en `409`: refetch + `ConflictNotice` con `diffValuationItems` y `localValuation` intacto;
  - marca "Actualizado por otra persona" en ítems/dimensiones (prop `isExternallyUpdated`) y abre la dimensión afectada;
  - acciones: guardar sobre `current` / `syncFromServer(current)`;
  - en `404`: `EmptyState` "Esta evaluación fue eliminada por otra persona." + "Volver a Evaluación".
- [x] `report/types/` — `version` en `ICommunicativeLetterTemplate` y en el payload de conceptos.
- [x] `report/queries/useReportQuery.ts` — `useSaveLetterConceptsMutation` envía `version`; `onError` `409`/`404` → invalida `reportKeys.letter(valuationId)`.
- [x] `report/pages/CommunicativeLetterEditPage.tsx`:
  - envía `currentLetter.version`;
  - en `409`: refetch + `ConflictNotice` con `diffLetterConcepts` y dimensiones marcadas, sin pisar `selection`/`conceptText`;
  - acciones: guardar sobre `current` / adoptar `current`;
  - en `404`: estado vacío equivalente al de la valoración.
- [x] `stores/useDashboardFiltersStore.ts` — en memoria, `setFilters`, `initDefaults(periodId)` idempotente, `reset()`.
- [x] `auth/useAuthStore.ts` — `logout()` llama `useDashboardFiltersStore.getState().reset()`.
- [x] `dashboard/queries/useDashboardQuery.ts` — quitar `gcTime`.
- [x] `dashboard/pages/DashboardPage.tsx` — filtros desde el store (selector); `initDefaults(activePeriod._id)` en `useEffect` cuando llega `activePeriod`.
- [x] `quartz-web/CLAUDE.md`:
  - fila "dashboard" de la tabla de tiers sin `gcTime` propio;
  - `src/stores/` lista `useDashboardFiltersStore`;
  - patrón de conflicto (`isVersionConflict`) en "Mutaciones".

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`)
- [x] Servidor arranca sin errores de compilación ni runtime
- [x] Repaso de aislamiento: el filtro de versión se suma al scoped (`findOneAndUpdateScoped`/`findOneScoped`); ninguna query sin `institutionId` del token
- [ ] Prueba manual (usuario) de los escenarios de `plan.md` → Verificación

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
