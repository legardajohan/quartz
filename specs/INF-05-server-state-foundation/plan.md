# INF-05 — Plan técnico

## Archivos
### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/lib/queryClient.ts` |
| tocar | `src/features/auth/useAuthStore.ts` |
| crear | `src/features/learning/queries/useLearningsQuery.ts` |
| crear | `src/features/concept/queries/useConceptsQuery.ts` |
| crear | `src/features/checklist-template/queries/useChecklistTemplatesQuery.ts` |
| tocar | `src/features/learning/pages/LearningsPage.tsx` |
| tocar | `src/features/concept/pages/ConceptsPage.tsx` |
| tocar | `src/features/checklist-template/pages/ChecklistsPage.tsx` |
| tocar | `src/features/{learning,concept,checklist-template}/types/index.ts` (quitar re-export de `store`) |
| borrar | `src/features/learning/useLearningStore.ts`, `src/features/learning/types/store.ts` |
| borrar | `src/features/concept/useConceptStore.ts`, `src/features/concept/types/store.ts` |
| borrar | `src/features/checklist-template/useChecklistTemplateStore.ts`, `src/features/checklist-template/types/store.ts` |
| tocar | `quartz-web/CLAUDE.md` § "Estado: Zustand vs. React Query" |

## Contratos

### `src/lib/queryClient.ts`
```ts
export const STALE_TIME = {
  catalog: 30 * 60_000, // subjects, periods, schools, institution, branding
  list: 5 * 60_000,     // default: learnings, concepts, checklist-templates, users
  live: 0,              // valoración, carta, reporte: pinta caché y revalida
} as const;

const shouldRetry = (failureCount: number, error: unknown) =>
  failureCount < 1 && !(isAxiosError(error) && (error.response?.status ?? 0) < 500 && (error.response?.status ?? 0) >= 400);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: STALE_TIME.list, gcTime: 30 * 60_000, retry: shouldRetry, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});
```
- `import { isAxiosError } from 'axios'` **directo**, no desde `@/api/apiClient`: `apiClient.ts` importa `useAuthStore`, que importará `queryClient` → ciclo `queryClient → apiClient → useAuthStore → queryClient`. `queryClient.ts` no importa nada de `src/`.

### `useAuthStore.ts`
- `import { queryClient } from '@/lib/queryClient'`.
- `logout`: `queryClient.clear()` antes del `set(...)`.
- `login` / `activateAccount`: `queryClient.clear()` justo antes del `set({ token, sessionData, ... })` de éxito.

### Query keys (factory por feature, en el mismo archivo `queries/`)
| Feature | Factory | Keys |
|---|---|---|
| learning | `learningKeys` | `all: ['learnings']` · `list: () => ['learnings','list']` |
| concept | `conceptKeys` | `all: ['concepts']` · `list: (q?: GetConceptsQuery) => ['concepts','list', q]` |
| checklist-template | `checklistTemplateKeys` | `all: ['checklist-templates']` · `list: () => ['checklist-templates','list']` |

### Hooks
| Archivo | Export | Endpoint | onSuccess |
|---|---|---|---|
| `useLearningsQuery.ts` | `useLearningsQuery()` | `GET /learnings` → `LearningsResponse` | — |
| | `useCreateLearningMutation()` | `POST /learnings` (`NewLearning` → `Learning`) | invalida `learningKeys.all`, `['dashboard']` |
| | `useUpdateLearningMutation()` | `PATCH /learnings/:id` (`{ id, data: UpdateLearning }`) | ídem |
| | `useDeleteLearningMutation()` | `DELETE /learnings/:id` (`id`) | ídem |
| `useConceptsQuery.ts` | `useConceptsQuery(query?)` | `GET /concepts` (`params: query`) → `ConceptDto[]` | — |
| | `useCreateConceptMutation` / `useUpdateConceptMutation` / `useDeleteConceptMutation` | `POST` / `PATCH /:id` / `DELETE /:id` `/concepts` | invalida `conceptKeys.all`, `['dashboard']` |
| `useChecklistTemplatesQuery.ts` | `useChecklistTemplatesQuery()` | `GET /checklist-templates` → `ChecklistTemplateDto[]` | — |
| | `useCreate…` / `useUpdate…` / `useDeleteChecklistTemplateMutation` | `POST` / `PATCH /:id` / `DELETE /:id` `/checklist-templates` | invalida `checklistTemplateKeys.all` |

- Errores: `mutationFn` envuelve la llamada y relanza `new Error(extractErrorMessage(err, '<texto actual del store>'))` para conservar los mensajes de toast. En `createChecklistTemplate`, rama `409` igual a la del store actual.
- Ejemplo canónico:
```ts
export const learningKeys = {
  all: ['learnings'] as const,
  list: () => [...learningKeys.all, 'list'] as const,
};

export function useLearningsQuery() {
  return useQuery({ queryKey: learningKeys.list(), queryFn: () => apiGet<LearningsResponse>('/learnings') });
}

export function useUpdateLearningMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLearning }) => {
      try {
        return await apiPatch<Learning, UpdateLearning>(`/learnings/${id}`, data);
      } catch (err: unknown) {
        throw new Error(extractErrorMessage(err, 'Falló la actualización del aprendizaje.'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

### Páginas (patrón)
```tsx
const { data: learnings = [], isPending, error } = useLearningsQuery();
const createMutation = useCreateLearningMutation();
const isSubmitting = createMutation.isPending || updateMutation.isPending;
// toast.promise(createMutation.mutateAsync(payload), {...}) — textos actuales
```
- Se borra el `useEffect(() => useXStore.getState().fetchX(), [])`.
- `isLoading` del store → `isPending` de la query (solo `true` sin caché). `error` → `error?.message`.
- Los filtros y `hasInitializedFilter` siguen en `useState`/`useRef` (INF-08 los mueve).

### `quartz-web/CLAUDE.md` § "Estado" (nuevo contenido, resumido)
- Tabla: **dato de servidor → React Query** (`queries/use<Feature>Query.ts`) · **sesión** → `useAuthStore` · **UI efímera compartida** (filtros) → Zustand en `src/stores/`.
- Tiers `STALE_TIME` y cuándo sobrescribir por query.
- Factory `<feature>Keys` con `all` + variantes; mutaciones invalidan `all` + dominios dependientes.
- `queryClient.clear()` en cambio de sesión; prohibido `persistQueryClient`.
- Se elimina el párrafo "No migrar un store existente…" y la subsección "Si es Zustand" pasa a describir solo `useAuthStore` + stores UI.
- Estructura por feature: `use<Feature>Store.ts` deja de ser opción para datos de servidor.

## Notas
- `isPending` (v5) = sin datos en caché; con caché stale es `false` y `isFetching` es `true` → no hay spinner al volver. Es el mecanismo del "instantáneo + revalida".
- Sin `setQueryData` en mutaciones de esta fase: las listas son pequeñas y `invalidateQueries` refetchea solo las keys montadas; simplicidad sobre un request ahorrado.
- `['dashboard']` se invalida por prefijo; el backend ya invalida su caché TTL al escribir aprendizajes/conceptos (INF-04).
- `queryClient.clear()` en `login` cubre el caso de sesión expirada sin `logout()` explícito.
- **Añadido en implementación:** `src/api/withErrorMessage.ts` — `withErrorMessage(request, fallback | (err) => string)` relanza `new Error(extractErrorMessage(...))`. Evita repetir el `try/catch` en las 9 mutaciones y conserva los textos de toast actuales.
- **Añadido en implementación:** `Learning` vivía en `learning/types/store.ts`; se movió a `learning/types/api.ts` al borrar el store.
- Los defaults `= []` de las páginas son constantes de módulo (`NO_LEARNINGS`, …) para mantener estables las dependencias de `useMemo` mientras la query está `pending`.

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev`: cero errores en consola.
- Manual (usuario): Network + Devtools — Aprendizajes → Usuarios → Aprendizajes (< 5 min): 0 requests a `/learnings` en la vuelta; logout → login con otra cuenta: Devtools sin queries previas.
