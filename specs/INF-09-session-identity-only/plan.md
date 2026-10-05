# INF-09 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/institution/institution.types.ts` (reutiliza `IInstitutionSettings`; sin tipo nuevo) |
| tocar | `src/features/institution/institution.service.ts` (`getInstitutionSettings`) |
| tocar | `src/features/institution/institution.controller.ts` (`getMyInstitutionSettingsController`) |
| tocar | `src/features/institution/institution.routes.ts` (`GET /me/settings`) |
| tocar | `src/features/period/period.service.ts` (exportar `mapPeriodToDTO`, movido del controller) |
| tocar | `src/features/period/period.controller.ts` (importa `mapPeriodToDTO`) |
| tocar | `src/features/subject/subject.service.ts` (exportar `mapSubjectToDTO`, movido del controller) |
| tocar | `src/features/subject/subject.controller.ts` (importa `mapSubjectToDTO`) |
| tocar | `src/features/auth/auth.service.ts` (`getSessionData`) |
| tocar | `src/features/auth/auth.types.ts` (`ISessionData`) |
| tocar | `src/features/checklist-template/checklist-template.service.ts` (borrar `getChecklistTemplatesForSession`) |
| tocar | `src/features/checklist-template/checklist-template.types.ts` (borrar `IChecklistTemplateForSession`, si no tiene otro uso) |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/auth/seedSessionCatalogs.ts` |
| tocar | `src/features/auth/useAuthStore.ts` |
| tocar | `src/features/auth/types/store.ts`, `src/features/auth/types/api.ts` |
| tocar | `src/types/domain.ts` (`ISessionData`, borrar `ChecklistTemplates`) |
| tocar | `src/features/period/queries/usePeriodsQuery.ts` |
| tocar | `src/features/subject/queries/useSubjectsQuery.ts` |
| tocar | `src/features/institution/queries/useInstitutionQuery.ts` |
| tocar | `src/features/period/useActivePeriod.ts`, `src/features/subject/useSubjectAxisLabel.ts` |
| tocar | `ChecklistsPage`, `ConceptsPage`, `LearningsPage`, `UsersPage`, `StudentValuationsPage`, `StudentValuationDetail`, `IndividualReportsPanel`, `ConsolidatedReportsPanel`, `DashboardFilters` |

## Contratos

### Backend

**Endpoint**
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/institutions/me/settings` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → asyncHandler(getMyInstitutionSettingsController)` |

- Respuesta: `IInstitutionSettings` = `{ enabledReports: ReportKind[]; multipleShifts: boolean; shifts: IShiftDTO[] }`.
- Servicio: `getInstitutionSettings(institutionId: string): Promise<IInstitutionSettings>` = `Promise.all([getEnabledReports(id), getShiftSettings(id)])` → `{ enabledReports, ...shiftSettings }`. Mismos defaults que hoy.
- Controller: `institutionId = req.user!.institutionId.toString()`; sin `try/catch`.
- Declarar la ruta junto a `/me/branding`.

**`getSessionData`**
- Quitar `getChecklistTemplatesForSession` del `Promise.all`; reemplazar `getEnabledReports` + `getShiftSettings` por `getInstitutionSettings`.
- `periods: periods.map(mapPeriodToDTO)` y `subjects: subjects.map(mapSubjectToDTO)` (mismo DTO que `GET /periods` y `GET /subjects`).
- `ISessionData` (`auth.types.ts`): `periods: IPeriodDTO[]`, `subjects: ISubjectDTO[]`; se elimina `checklistTemplates`; `enabledReports`/`multipleShifts`/`shifts` sin cambios.
- `mapPeriodToDTO`/`mapSubjectToDTO` se mueven tal cual (misma firma y campos) del controller al service del feature y se exportan.

### Frontend

**Tipos**
```ts
// domain.ts — payload de /auth/*: se siembra y se descarta; no se guarda entero.
export interface ISessionData {
  user: Pick<User, '_id' | 'institutionId' | 'role' | 'firstName' | 'lastName' | 'secondLastName' | 'schoolId' | 'avatarUrl'>;
  periods: PeriodDto[];      // import type de features/period/types
  subjects: SubjectDto[];
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: Shift[];
}
// auth/types/store.ts
export type SessionUser = ISessionData['user'];
export type SessionIdentity = { user: SessionUser };
// AuthState.sessionData: SessionIdentity | null
```
- `Period` de `domain.ts` (`_id`, `name`, `isActive`) se conserva: `PeriodDto` es su superconjunto y `useActivePeriod` lo sigue devolviendo asignable a `Period`.
- Eliminar `ChecklistTemplates` de `domain.ts`.

**Keys y hook nuevo — `institution/queries/useInstitutionQuery.ts`**
```ts
export const institutionKeys = {
  all: ['institution'] as const,
  me: ['institution', 'me'] as const,
  settings: ['institution', 'settings'] as const,
  branding: ['institution', 'branding'] as const,
};

export function useInstitutionSettingsQuery() {
  return useQuery({
    queryKey: institutionKeys.settings,
    queryFn: () => apiGet<InstitutionSettingsDto>('/institutions/me/settings'),
    staleTime: STALE_TIME.catalog,
  });
}
```
- `useUpdateInstitutionSettingsMutation.onSuccess`: `setQueryData(institutionKeys.me, updated)` + `setQueryData(institutionKeys.settings, updated.settings)`. Se borran `setEnabledReports`/`setShifts` y el import de `useAuthStore`.
- `useUploadShieldMutation`: sin cambios.

**Mutaciones de periodos y dimensiones**
- `refreshPeriods`/`refreshSubjects` y `syncSessionPeriods` se eliminan. `onSuccess`: `invalidateQueries({ queryKey: periodKeys.all })` (o `subjectKeys.all`) + `['dashboard']`, igual que `useInvalidateLearnings`. Se borran los imports de `useAuthStore` y `QueryClient`.

**`seedSessionCatalogs(payload: ISessionData)`** (`features/auth/seedSessionCatalogs.ts`)
```ts
queryClient.setQueryData(periodKeys.list(), payload.periods);
queryClient.setQueryData(subjectKeys.list(), payload.subjects);
queryClient.setQueryData(institutionKeys.settings, {
  enabledReports: payload.enabledReports,
  multipleShifts: payload.multipleShifts,
  shifts: payload.shifts,
});
```
- Importa `queryClient` de `@/lib/queryClient` y las key factories; **no** importa `useAuthStore` (las queries ya no lo importan tras este spec → sin ciclo).

**`useAuthStore`**
| Acción | Cambio |
|---|---|
| `login`, `activateAccount` | `queryClient.clear()` → `seedSessionCatalogs(sessionData)` → `set({ token, sessionData: { user: sessionData.user }, … })` |
| `refreshSession` | tras `apiGet<SessionResponse>`: `seedSessionCatalogs(sessionData)` → `set({ sessionData: { user: sessionData.user } })`; el manejo de 401/red/5xx no cambia |
| `setSubjects/setPeriods/setEnabledReports/setShifts` | se eliminan (también de `AuthState`) |
| `persist` | `version: 1` + `migrate` (ver abajo); `name: 'quartz-session'` y `partialize` sin cambios de forma |

```ts
migrate: (persisted) => {
  const old = persisted as { token?: string | null; sessionData?: { user?: SessionUser } | null };
  return { token: old.token ?? null, sessionData: old.sessionData?.user ? { user: old.sessionData.user } : null };
}
```
- Sin `migrate`, un `version` distinto descartaría el estado guardado y forzaría re-login; con él se conserva `token` + `user` y se descartan los catálogos.
- `setQueryData` marca los datos como frescos (`dataUpdatedAt = ahora`) → cuentan los 30 min de `STALE_TIME.catalog`.

**Hooks de lectura (reemplazan lecturas de `useAuthStore`)**
| Antes | Después |
|---|---|
| `useActivePeriod`: `useAuthStore(s => s.sessionData?.periods?.find(p => p.isActive))` | `useQuery` sobre `periodKeys.list()` con `select: findActivePeriod` (función de módulo, referencia estable) |
| `useSubjectAxisLabel`/`useSubjectTypeLabel` | leen `useSubjectsQuery().data` (con `EMPTY_SUBJECTS` de módulo como fallback) |
| `sessionData?.periods ?? []` | `const { data: periods = NO_PERIODS } = usePeriodsQuery()` |
| `sessionData?.subjects ?? []` | `const { data: subjects = NO_SUBJECTS } = useSubjectsQuery()` |
| `sessionData?.enabledReports`, `multipleShifts`, `shifts` | `const { data: settings } = useInstitutionSettingsQuery()` → `settings?.enabledReports ?? DEFAULT_ENABLED_REPORTS`, `settings?.multipleShifts ?? false`, `settings?.shifts ?? NO_SHIFTS` |

- Fallbacks como constantes de módulo (patrón `NO_PERIODS` de INF-06): un `?? []` inline crea una referencia nueva por render y dispara efectos/memos.
- `usePeriodsQuery`/`useSubjectsQuery`/`useInstitutionSettingsQuery` comparten key con la siembra y con los paneles de `/gestion/configuracion`: una sola caché.
- `IndividualReportsPanel` conserva su fallback actual `['checklist','communicative-letter']`; `StudentValuationsPage.isLetterEnabled` es `false` hasta que llegan los ajustes (igual que `?? []` hoy).
- `DashboardFilters`/`ConsolidatedReportsPanel` conservan `key={periods.length}` del `Select` de periodos.
- Cada archivo migrado conserva `const { sessionData } = useAuthStore()` solo si aún lee `user`; si solo usaba catálogos, la línea se borra. El cambio a selectores atómicos es de INF-08.

**Efectos que aplican un default una sola vez** (`LearningsPage`, `ConceptsPage`, `StudentValuationsPage`): verificar que esperan a que `activePeriod` exista antes de marcar el flag `hasInitialized*`; hoy el dato está en el primer render, tras F5 llegará después.

## Notas
- **Por qué DTO completo en la sesión:** sembrar `['periods','list']` con el recorte `{ _id, name, isActive }` dejaría `PeriodsPanel` con `year`/fechas `undefined` durante 30 min. El costo es unos bytes por periodo.
- **Por qué `/me/settings` y no abrir `/me`:** `/me` expone al Docente DANE, rector, email y dirección. `/me/settings` solo devuelve lo que el Docente ya recibe hoy en la sesión.
- **Dos keys para los ajustes:** `['institution','me']` (administrativo, solo Jefe de Área) y `['institution','settings']` (transversal). La mutación escribe ambas para no dejar una obsoleta.
- **`refreshSession` también re-siembra** (p. ej. tras editar el perfil en `useAccountQuery`): el servidor es la fuente, así que sobrescribir es seguro y mantiene alineada la caché.
- **Parpadeo tras F5:** aceptado. `login`/`activateAccount` siembran antes de fijar `token`, por lo que el primer render autenticado ya tiene catálogos; solo el F5 los pide a la respuesta de `refreshSession`.
- Un fallo de `GET /institutions/me/settings` en el Docente cae a los fallbacks (`enabledReports` por defecto, sin jornadas); no se muestra toast.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint` (misma línea base de lint que INF-06: sin errores nuevos)
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual (usuario):
  - Network tras login: ninguna request a `/periods`, `/subjects` ni `/institutions/me/settings`; abrir `/gestion/configuracion` → `PeriodsPanel` muestra fechas completas sin request.
  - Docente: sesión con la caché caducada (o `queryClient.clear()` desde la consola) → `/institutions/me/settings` responde 200.
  - F5 con sesión del formato anterior en `localStorage`: no pide login; `quartz-session` queda sin catálogos.
  - Cambiar el periodo activo y las jornadas desde configuración: filtros de Aprendizajes, Dashboard e Informes reflejan el cambio sin recargar.
