# AUTH-02 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/learning/learning.routes.ts` |
| tocar | `src/features/learning/learning.validation.ts` |
| tocar | `src/features/learning/learning.controller.ts` |
| tocar | `src/features/learning/learning.service.ts` |
| tocar | `src/features/concept/concept.routes.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/auth/usePermissions.ts` |
| tocar | `src/features/concept/pages/ConceptsPage.tsx` |
| tocar | `src/features/checklist-template/pages/ChecklistsPage.tsx` |
| tocar | `src/components/layouts/SidebarMenu.tsx` |
| tocar | `src/App.tsx` |
| borrar | `src/features/consolidated/` (carpeta completa) |

## Contratos

### Frontend — `usePermissions`

```ts
// src/features/auth/usePermissions.ts
export interface Permissions {
  role: UserRole | undefined;
  userId: string | undefined;
  schoolId: string | undefined;
  isAreaLead: boolean;
  isTeacher: boolean;
  canManageOwned: (authorId: string) => boolean;
}

export function usePermissions(): Permissions;
```

- Lee de `useAuthStore` con **selectores**, no destructuring del store completo, para no re-renderizar en cada cambio de sesión (`sessionData.user` es estable entre navegaciones).
- `canManageOwned(authorId)` = `isAreaLead || authorId === userId`. Es exactamente la regla que hoy está duplicada literal en `ConceptsPage.tsx:61-64` y `ChecklistsPage.tsx:56-65`.
- `canManageOwned` se devuelve memoizado (`useCallback`) porque los consumidores lo pasan como prop a tablas memoizadas.
- **No** contiene reglas de pantalla (qué botón se ve dónde): eso vive en cada página. El hook responde *quién es* el usuario, no *qué muestra* cada vista.

### Frontend — consumidores migrados

| Archivo | Antes | Después |
|---|---|---|
| `ConceptsPage.tsx:61-64` | `useCallback` con `currentUser.role === 'Jefe de Área' \|\| concept.author._id === currentUser._id` | `const { canManageOwned } = usePermissions();` → `canManage={(c) => canManageOwned(c.author._id)}` |
| `ChecklistsPage.tsx:56-65` | idéntico, con `template.author._id` | `canManageOwned(template.author._id)` |

Sin cambio de comportamiento: la regla resultante es la misma para ambos roles.

### Frontend — navegación

| Archivo | Cambio |
|---|---|
| `SidebarMenu.tsx:93` | eliminar `{ id: 52, label: "Consolidados", path: "/gestion/consolidados" }` del array `menuItems`. El item `53` (Configuración, `roles: ["Jefe de Área"]`) se mantiene intacto |
| `App.tsx:15` | eliminar `import ConsolidatedPage` |
| `App.tsx:110` | eliminar `<Route path="/gestion/consolidados" ... />` |

`src/features/consolidated/pages/ConsolidatedPage.tsx` es un placeholder de 12 líneas sin lógica; el consolidado real vive en el tab "Consolidado" de `/informes` (`ConsolidatedReportsPanel.tsx`). Se borra la carpeta entera.

### Backend — enum en rutas

`learning.routes.ts` (L16, 25, 34, 43) y `concept.routes.ts` (L21) declaran los roles como literales de texto:

```ts
authorize(['Jefe de Área', 'Docente'])              // antes
authorize([UserRole.JEFE_DE_AREA, UserRole.DOCENTE]) // después
```

Import: `import { UserRole } from '../auth/auth.types';`. Es el patrón vigente en `users`, `report`, `institution` y `student-valuation`. `authorize(allowedRoles: string[])` acepta el enum sin cambios (`role.middleware.ts:3`), así que el middleware no se toca.

`checklist-template.routes.ts:21` tiene el mismo literal, pero queda fuera: no es un feature de esta spec y su constante `allowedRoles` se toca en ninguna otra. Se deja anotado como deuda menor.

### Backend — query de `GET /api/learnings`

`getAllLearningsSchema` (`learning.validation.ts:42-58`) acepta `institutionId` como query param opcional, y el controller pasa `req.query` crudo como filtro Mongo:

```ts
const learnings = await getAllLearnings(institutionId, req.query);  // learning.controller.ts:37
```

No hay fuga hoy porque `findScoped` pone el tenant al final del spread (`base.repository.ts:15`: `model.find({ ...filter, institutionId })`), pero es superficie innecesaria. Cambios:

1. `learning.validation.ts` — borrar la clave `institutionId` del objeto `query`. El schema pasa a aceptar solo `subjectId`, `periodId`, `userId`, `grade`. **Añadido durante la implementación:** el objeto `query` necesita `.strict()` (patrón ya usado en `concept.validation.ts`, `report.validation.ts`, `checklist-template.validation.ts`); sin él, Zod descarta en silencio cualquier clave desconocida (incluida `institutionId`) en vez de rechazar la petición, lo que incumple el criterio EARS "el sistema la rechaza por validación Zod".
2. `learning.controller.ts:37` — construir el filtro explícitamente en vez de reenviar `req.query`:
   ```ts
   const { subjectId, periodId, userId, grade } = req.query as GetLearningsQuery;
   const learnings = await getAllLearnings(institutionId, { subjectId, periodId, userId, grade });
   ```
3. `learning.service.ts` — tipar el segundo parámetro como un `ILearningFilter` explícito en lugar de `FilterQuery<ILearningDocument>` (L37-39), y descartar las claves `undefined` antes de armar la query.

## Notas
- Esta spec **no cambia permisos efectivos**. Si un rol gana o pierde acceso al probarla, es un bug de la migración, no del diseño.
- El hook se llama `usePermissions` y no `useAuth` a propósito: `useAuthStore` ya es la fuente de sesión, y un `useAuth` paralelo invitaría a duplicar estado.
- `RoleRoute` (`components/router/RoleRoute.tsx`) ya resuelve el gating de rutas y no necesita cambios; `USR-02` decidirá si alguna ruta más lo necesita.
- El `initiallyOpenAccordion` de `SidebarMenu.tsx:112-113` se calcula una sola vez en el `useState` inicial. Quitar un subítem no lo afecta, pero conviene verificar que el accordion "Gestión" siga abriéndose al entrar por `/gestion/usuarios`.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual: con sesión de Jefe de Área y de Docente, el sidebar no muestra "Consolidados" y `/gestion/consolidados` cae en el 404.
- Manual: Conceptos y Listas de Chequeo se comportan exactamente igual que antes para ambos roles.
