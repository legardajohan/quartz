# INF-06 — Plan técnico

## Archivos
### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/period/queries/usePeriodsQuery.ts` |
| crear | `src/features/subject/queries/useSubjectsQuery.ts` |
| crear | `src/features/school/queries/useSchoolsQuery.ts` |
| crear | `src/features/institution/queries/useInstitutionQuery.ts` |
| tocar | `src/features/institution/queries/useInstitutionShieldQuery.ts` |
| tocar | `src/features/period/components/PeriodsPanel.tsx` |
| tocar | `src/features/subject/components/SubjectsPanel.tsx` |
| tocar | `src/features/school/components/SchoolsPanel.tsx` |
| tocar | `src/features/institution/components/{ReportSettingsPanel,ShiftsPanel,InstitutionShieldPanel}.tsx` |
| tocar | `src/components/common/InstitutionBrand.tsx` |
| tocar | `src/features/users/pages/UsersPage.tsx` (import de `useSchoolsQuery`) |
| tocar | `src/features/{period,subject,school,institution}/types/index.ts` |
| borrar | `src/features/{period,subject,school,institution}/use*Store.ts` + `types/store.ts` |
| borrar | `src/features/users/queries/useSchoolsQuery.ts` |

## Contratos

### Keys
| Factory | Keys | `staleTime` |
|---|---|---|
| `periodKeys` | `all: ['periods']` · `list()` | `STALE_TIME.catalog` |
| `subjectKeys` | `all: ['subjects']` · `list()` | `STALE_TIME.catalog` |
| `schoolKeys` | `all: ['schools']` · `list()` | `STALE_TIME.catalog` |
| `institutionKeys` | `all: ['institution']` · `me: ['institution','me']` · `branding: ['institution','branding']` | `STALE_TIME.catalog` |

### Hooks
| Export | Endpoint | onSuccess |
|---|---|---|
| `usePeriodsQuery()` | `GET /periods` → `PeriodsResponse` | — |
| `useCreatePeriodMutation` / `useUpdatePeriodMutation` / `useDeletePeriodMutation` | `POST /periods` · `PATCH /periods/:id` · `DELETE /periods/:id` | `syncSessionPeriods(fresh)` + invalida `periodKeys.all`, `['dashboard']` |
| `useSubjectsQuery()` | `GET /subjects` → `SubjectsResponse` | — |
| `useCreate/Update/DeleteSubjectMutation` | `POST` · `PATCH /:id` · `DELETE /:id` `/subjects` | `setSubjects(fresh)` + invalida `subjectKeys.all`, `['dashboard']` |
| `useSchoolsQuery({ enabled }?)` | `GET /schools` → `SchoolsResponse` | — |
| `useCreate/Update/DeleteSchoolMutation` | `POST` · `PATCH /:id` · `DELETE /:id` `/schools` | invalida `schoolKeys.all`, `['users']` |
| `useInstitutionQuery()` | `GET /institutions/me` → `InstitutionDto` | — |
| `useInstitutionBrandingQuery()` | `GET /institutions/me/branding` → `InstitutionBrandingDto` (`retry: false`) | — |
| `useUpdateInstitutionSettingsMutation()` | `PATCH /institutions/me` `{ settings }` | `setQueryData(me, updated)` + `setEnabledReports` + `setShifts` |
| `useUploadShieldMutation()` | `PATCH /institutions/me/shield` (multipart `image`) | `setQueryData(me, updated)` + invalida `institutionKeys.branding` |

- **Sincronía `sessionData`** tras periods/subjects: en `onSuccess`, `const fresh = await queryClient.fetchQuery({ queryKey: periodKeys.list(), queryFn, staleTime: 0 })` y luego `useAuthStore.getState().setPeriods(fresh.map(p => ({ _id, name, isActive })))`. Evita reconstruir la lista a mano y deja caché + sesión alineadas con el servidor (p. ej. activar un periodo desactiva otro en backend).
- `UserSchool` (users) y `SchoolDto` (school): `useSchoolsQuery` devuelve `SchoolDto[]`; `UsersPage` lo recibe. Verificar que `SchoolDto` cubra los campos que usa `UserForm` (`_id`, `name`); si no, `UserSchool` se define como `Pick<SchoolDto, …>`.
- Ejemplo (institución compartida por 3 paneles):
```ts
export const institutionKeys = {
  all: ['institution'] as const,
  me: ['institution', 'me'] as const,
  branding: ['institution', 'branding'] as const,
};

export function useInstitutionQuery() {
  return useQuery({
    queryKey: institutionKeys.me,
    queryFn: () => apiGet<InstitutionDto>('/institutions/me'),
    staleTime: STALE_TIME.catalog,
  });
}
```
- `useInstitutionShieldQuery`: `const shieldVersion = useInstitutionBrandingQuery().data?.shieldVersion;` (resto igual).
- `InstitutionBrand`: `const { data: branding } = useInstitutionBrandingQuery();` — se borra el `useEffect(fetchBranding)`.

### Paneles (patrón)
- `const { data: institution, isPending, error } = useInstitutionQuery();` · `isSubmitting` = `mutation.isPending`.
- Los `useEffect` de sincronización formulario ← `institution` (`ReportSettingsPanel:31`, `ShiftsPanel:31`) se conservan: inicializan borradores locales.

## Notas
- `STALE_TIME.catalog` (30 min): estos datos solo cambian desde `/gestion/configuracion`, y esa misma pantalla invalida al mutar. Otra pestaña/usuario que cambie la configuración se refleja al vencer el tier o al recargar; `refreshSession()` en `AppRoot` ya revalida `sessionData` por carga.
- Branding con `retry: false`: hoy el fallo es silencioso y no reintenta.

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual (usuario): Network — abrir `/gestion/configuracion` y recorrer los 5 pasos: 1 sola request a `/institutions/me`; navegar por el sidebar: 0 requests a `/branding`; subir escudo: el sidebar y el PDF usan el nuevo.
