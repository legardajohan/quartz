# quartz-web

> **Sistema:** Quartz — Gestión académica para la **evaluación cualitativa** de estudiantes del grado **Transición**.

## Arquitectura
**Frontend:** **SPA desacoplada** que consume la API solo por REST.

## Stack (React + Typescript + Vite) 
`react@18.2` · `vite@5` · `zustand@5` · `axios@1` · `react-router-dom@6` · `tailwindcss@3` · `@material-tailwind/react` · `react-hot-toast` · `@heroicons/react`. Alias `@/* → src/*` (vía `vite-tsconfig-paths`).

## Estructura por feature
```
src/features/<feature>/
├── pages/                 # componentes enrutados: <Feature>Page.tsx
├── components/            # UI específica (presentacional, sin llamadas API)
├── types/                # index.ts agrega api.ts / store.ts / domain.ts
└── use<Feature>Store.ts  # store Zustand (estado + acciones API)
```
Transversal: `components/{ui,common,layouts,router,icons}`, `api/apiClient.ts`, `types/domain.ts`. Alias `@/* → src/*`.

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
| Periodos / Materias / Colegios | `period/`, `subject/`, `school/` | (consumidos vía `sessionData`) |

## Estado (Zustand)
- Un store por feature (`use<Feature>Store.ts`). Acciones con API manejan `isLoading`/`isSubmitting`/`error`.
- `useAuthStore` es la fuente de verdad de sesión (`token`, `sessionData.user`); persiste en `localStorage` (`persist` + `partialize`).
- Acceso a rol: `const role = useAuthStore().sessionData?.user.role;`
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
1. `types/` → 2. `use<Feature>Store.ts` (acciones con `apiClient`) → 3. `components/` (presentacional) → 4. `pages/<Feature>Page.tsx` → 5. ruta en `App.tsx` (bajo `ProtectedRoute` si es sensible).

> El slice completo back + front lo andamia la skill `quartz-feature-scaffold`; el orden del backend vive en `quartz-api/CLAUDE.md`.

## Verificación
`npm run build && npm run lint`