# quartz-web

> **Sistema:** Quartz — Gestión académica para la **evaluación cualitativa** de estudiantes del grado **Transición**.

## Arquitectura
**Frontend:** **SPA desacoplada** que consume la API solo por REST.

## Stack (React + Typescript + Vite) 
`react@18.2` · `vite@5` · `zustand@5` · `@tanstack/react-query@5` · `axios@1` · `react-router-dom@6` · `tailwindcss@3` · `@material-tailwind/react` · `react-hot-toast` · `@heroicons/react`. Alias `@/* → src/*` (vía `vite-tsconfig-paths`).

## Estructura por feature
```
src/features/<feature>/
├── pages/                 # componentes enrutados: <Feature>Page.tsx
├── components/            # UI específica (presentacional, sin llamadas API)
├── types/                # index.ts agrega api.ts / store.ts (o api.ts) / domain.ts
└── queries/use<Feature>Query.ts  # hooks React Query: query + mutaciones + factory de keys (ver "Estado")
```
Transversal: `components/{ui,common,layouts,router,icons}`, `api/{apiClient,withErrorMessage}.ts`, `lib/queryClient.ts`, `stores/` (estado de UI compartido entre rutas; sin datos de servidor ni `apiClient`), `types/domain.ts`. Alias `@/* → src/*`.

## Comunicación con la API
- **Única salida HTTP:** `src/api/apiClient.ts` (`apiGet/apiPost/apiPatch/apiDelete`). **Prohibido** `fetch`/`axios` directo en componentes/stores.
- El interceptor inyecta `Authorization: Bearer <token>` desde `useAuthStore`.
- El interceptor captura `401` y ejecuta `logout()`.
- Base URL: `import.meta.env.VITE_API_BASE_URL`.

## Mapa de paridad Backend ↔ Frontend

| Dominio | Backend (`quartz-api/src/features/`) | Frontend (`quartz-web/src/features/`) |
|---|---|---|
| Autenticación | `auth/` | `auth/` |
| Aprendizajes esperados | `learning/` | `learning/` |
| Plantillas de checklist | `checklist-template/` | `checklist-template/` |
| Valoración de estudiantes | `student-valuation/` | `student-valuation/` |
| Usuarios | `users/` | `users/` |
| Periodos / Materias / Colegios | `period/`, `subject/`, `school/` | `period/`, `subject/`, `school/` (`queries/` propias, sembradas desde la sesión) |

## Estado: React Query (servidor) + Zustand (sesión y UI)
Cada tipo de dato tiene un dueño. Antes de crear estado nuevo, decidir con esta tabla:

| El dato es… | Usar | Ejemplo en el repo |
|---|---|---|
| **Estado de servidor**: cualquier lista/recurso remoto que se lee, cachea, refetchea e invalida tras mutar | **React Query** (`queries/use<Feature>Query.ts`) | `features/learning/queries/useLearningsQuery.ts`, `features/users/queries/useUsersQuery.ts` |
| **Sesión**: token y `sessionData` (solo identidad: `user`), persistidos y revalidados con `refreshSession()` | **Zustand** (`useAuthStore`) | `features/auth/useAuthStore.ts` |
| **UI compartida entre rutas**: búsqueda, filtros y página de tablas que deben sobrevivir a la navegación | **Zustand** en `src/stores/` (en memoria, sin `persist`) | `stores/useTableFiltersStore.ts`, `stores/useDashboardFiltersStore.ts` |
| **Estado de un solo componente/página**: modales, formularios, borradores | `useState` local | páginas CRUD |

**Prohibido** guardar datos de servidor en un store Zustand (`isLoading`, listas, caché, invalidación): eso lo da React Query. Un feature nuevo **no** crea `use<Feature>Store.ts` para datos remotos.

### React Query
- Defaults globales en `src/lib/queryClient.ts`: `staleTime 5min`, `gcTime 30min`, `refetchOnWindowFocus false`, sin reintento en 4xx, `mutations.retry 0`.
- Frescura por tipo de dato con `STALE_TIME` (mismo archivo); una query lo sobrescribe solo si necesita otra frecuencia:

  | Tier | `staleTime` | Recursos |
  |---|---|---|
  | `catalog` | 30 min | subjects, periods, schools, institution, branding |
  | `list` (default) | 5 min | learnings, concepts, checklist-templates, users |
  | `live` | 0 | valoración, carta, reporte (pinta la caché y revalida) |
  | dashboard | 60 s | alineado a su TTL de servidor; sin `gcTime` propio (hereda 30 min) |
- **Keys:** un factory por feature en su archivo `queries/`: `learningKeys = { all: ['learnings'] as const, list: () => [...learningKeys.all, 'list'] as const }`.
- **Mutaciones:** `useMutation` + `mutateAsync` (para `toast.promise`); `onSuccess` invalida `<feature>Keys.all` y los dominios que dependen del recurso (p. ej. aprendizajes/conceptos → `['dashboard']`). Envolver la llamada con `withErrorMessage` (`src/api/withErrorMessage.ts`) para que el toast reciba el mensaje ya resuelto.
- **Conflictos de concurrencia:** las escrituras protegidas (aprendizajes, valoración, conceptos de la carta) envían `version`; `withErrorMessage` lanza `ApiError` (`status`, `code`). Ante `isVersionConflict(err)` no se muestra toast de error: `onError` devuelve el `invalidateQueries` (se espera el refetch), la pantalla lee la versión vigente de la caché y muestra `<ConflictNotice>` conservando el borrador. `isNotFound(err)` → recurso eliminado por otra persona.
- **Carga:** `isPending` = sin datos en caché (spinner); con caché `stale` la UI pinta al instante y revalida en segundo plano (`isFetching`).
- **Seguridad multi-tenant:** `useAuthStore` ejecuta `queryClient.clear()` en `login`, `activateAccount` y `logout`. **Prohibido** `persistQueryClient`/guardar la caché en `localStorage`.

### Zustand
- `useAuthStore` es la fuente de verdad de sesión (`token`, `sessionData.user`); persiste en `localStorage` (`persist` + `partialize`).
- **Siempre con selector.** Prohibido `useAuthStore()` sin argumento: re-renderiza ante cualquier cambio del store (`isLoading`, `error`, …).
  - Una clave: `const role = useAuthStore((s) => s.sessionData?.user.role);` (para permisos, mejor `usePermissions()`).
  - Varias claves: `useAuthStore(useShallow((s) => ({ login: s.login, isLoading: s.isLoading })))` (`useShallow` de `zustand/react/shallow`).
  - El selector devuelve referencias estables: nada de `?? []` u objetos nuevos dentro; el fallback va fuera o en una constante de módulo.
- **`src/stores/`** guarda solo estado de UI que debe sobrevivir a la navegación (p. ej. `useTableFilters('<TableId>')`). Sin `persist` si contiene `_id` del inquilino, y se reinicia en `logout()`. Lo que vive y muere con una página (modal, borrador, pestaña activa) va en `useState`.
- **Inmutabilidad:** nunca mutar estado; crear nuevos objetos/arrays (`[...state.items]`, `state.items.map(...)`).

## Convenciones de export (ESM)
- **`export default`** para el componente principal de un archivo (pages, UI significativa): `export default function LoginPage() {…}`.
- **Named `export`** para utilidades, constantes y tipos agrupados.
- **Híbrido** cuando un archivo expone componente + tipos/hook: `export type XProps = …; export default function X(p: XProps) {…}`.

## Nombrado
- Componentes/archivos `.tsx`: `PascalCase`. Páginas: sufijo `Page`.
- Stores: `use<Feature>Store.ts`. Hooks: `use…` (`camelCase`).
- Handlers: `handle<Evento>`. Tipos/Props: `PascalCase`. Constantes: `SCREAMING_SNAKE_CASE`.

## Estilos
- **Tailwind** para todo; sin `style={{…}}`. Responsive *mobile-first* (`w-full md:w-1/2`). Estética premium.

## Skills de diseño (obligatorio)
Toda tarea que toque `quartz-web` (UI, componentes, páginas, estilos) invoca, antes de escribir código:
- Skill `emil-design-eng` (Emil Kowalski — motion, interacción, taste).
- Skill `impeccable` (craft, contraste, prohibiciones de diseño).
- Plugin oficial de Claude `frontend-design` (dirección visual, tipografía, layout).

## Seguridad / rutas
- Pantallas sensibles bajo `<ProtectedRoute>` (en `App.tsx`, dentro del layout `Dashboard`).
- Toda llamada que pueda fallar va en `try/catch`; feedback con `react-hot-toast`.

## Orden al crear un feature
1. `types/` → 2. `queries/use<Feature>Query.ts` (query + mutaciones con `apiClient`) → 3. `components/` (presentacional) → 4. `pages/<Feature>Page.tsx` → 5. ruta en `App.tsx` (bajo `ProtectedRoute` si es sensible).

> El slice completo back + front lo andamia la skill `quartz-feature-scaffold`; el orden del backend vive en `quartz-api/CLAUDE.md`.

## Incidentes conocidos
Bugs no obvios ya diagnosticados, para no repetirlos: [`docs/known-issues.md`](docs/known-issues.md).
Antes de usar `ripple`/efectos por defecto de un `Button` o `IconButton` de Material
Tailwind en un elemento con `fixed`/`absolute`/`sticky` propio, revisar esa entrada.

## Verificación
`npm run build && npm run lint`

**Prohibido usar Claude in Chrome (`mcp__claude-in-chrome__*`) para verificar UI/UX.** El
usuario hace esa verificación manual él mismo — gasta tokens y no aporta. `npx tsc --noEmit` /
`npm run build && npm run lint` / arranque limpio del servidor son la verificación automática
disponible; para el resto (visual, interacción, flujo en navegador), entregar el cambio y
dejar la prueba manual al usuario.