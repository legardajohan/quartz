# INF-03 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta | Qué |
|---|---|---|
| tocar | `src/features/auth/auth.service.ts` | `export` de `getSessionData` (hoy privada, `:24`) |
| tocar | `src/features/auth/auth.controller.ts` | `getSessionController` |
| tocar | `src/features/auth/auth.routes.ts` | `GET /session` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` | endurecer `assertStudentInScope` (`:50`) y podar `validateAllExist` (`:322`) |

### quartz-web
| Acción | Ruta | Qué |
|---|---|---|
| tocar | `src/features/checklist-template/pages/ChecklistsPage.tsx` | `scrollable={false}` en el `FormModal` de crear (`:171`) |
| tocar | `src/features/checklist-template/components/ChecklistCreateForm.tsx` | `menuProps` en los dos `Select` |
| crear | `src/features/period/useActivePeriod.ts` | fuente única del periodo activo |
| tocar | `src/features/auth/types/api.ts` | `SessionResponse` |
| tocar | `src/features/auth/types/store.ts` | `refreshUser` → `refreshSession` |
| tocar | `src/features/auth/useAuthStore.ts` | implementación de `refreshSession` |
| tocar | `src/App.tsx` | disparo único de `refreshSession` en `AppRoot` |
| tocar | `src/features/student-valuation/components/StudentValuationDetail.tsx` | hook + estado vacío «sin periodo activo» + deps del efecto |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` | migrar a `useActivePeriod` (`:51`) |
| tocar | `src/features/report/components/IndividualReportsPanel.tsx` | migrar a `useActivePeriod` (`:26`) |
| tocar | `src/features/learning/pages/LearningsPage.tsx` | migrar a `useActivePeriod` (`:52`) |
| tocar | `src/features/concept/pages/ConceptsPage.tsx` | migrar a `useActivePeriod` (`:54`) |

### docs
| Acción | Ruta | Qué |
|---|---|---|
| tocar | `docs/roles-permissions.md` | fila «Eliminar valoración» (`:45`) y nota «Hueco conocido» (`:82`) |
| tocar | `quartz-web/docs/known-issues.md` | entrada nueva: `Select` recortado por `DialogBody` scrollable |

---

## Contratos

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/auth/session` | Jefe de Área · Docente | `authenticateJWT → requireTenant` |

Respuesta `200`: `{ sessionData: ISessionData }` — mismo objeto que devuelve `POST /api/auth/login` en su campo `sessionData`, producido por la **misma** función `getSessionData(req.user!)`. Sin Zod: no hay `body`, `params` ni `query`.
Respuesta `401`: la que ya emite `authenticateJWT` (token ausente, inválido, expirado o usuario borrado).

### Backend — `auth`
```typescript
// auth.service.ts — hoy `async function getSessionData(...)`, pasa a exportarse tal cual
export async function getSessionData(user: SafeUser): Promise<ISessionData>

// auth.controller.ts
export async function getSessionController(req: Request, res: Response) {
  res.json({ sessionData: await getSessionData(req.user!) });
}

// auth.routes.ts
router.get('/session', authenticateJWT, requireTenant, asyncHandler(getSessionController));
```
`getProfileController` y `GET /profile` se conservan intactos.

### Backend — guard de `student-valuation`
`assertStudentInScope` pasa de «no-op para todo lo que no sea Docente» a validar siempre identidad del objetivo, y solo después la sede:

```typescript
async function assertStudentInScope(
  studentId: Types.ObjectId | string,
  institutionId: string,
  scope: RequestorScope
): Promise<void> {
  const student = await findByIdScoped(User, institutionId, studentId)
    .select('role schoolId')
    .lean();

  // Inexistente, de otra institución o no-estudiante: 404 para cualquier rol.
  if (!student || student.role !== UserRole.ESTUDIANTE) {
    throw new AppError('Valoración no encontrada.', 404);
  }

  if (scope.role !== UserRole.DOCENTE) return;

  if (!scope.schoolId || student.schoolId.toString() !== scope.schoolId) {
    throw new AppError('Valoración no encontrada.', 404);
  }
}
```

`initializeStudentValuation` (`:322`) reduce su `validateAllExist` a `[[Period, periodId, 'Periodo']]`: la existencia del estudiante ya la cubre el guard, que corre antes (`:308`).

Sin cambios en `student-valuation.types.ts`, `.model.ts`, `.validation.ts`, `.controller.ts` ni `.routes.ts`: los 6 controllers ya arman y propagan `RequestorScope` (`VAL-04`).

### Frontend — sesión
```typescript
// features/auth/types/api.ts
export interface SessionResponse {
  sessionData: ISessionData;
}

// features/auth/types/store.ts — sustituye a `refreshUser`
refreshSession: () => Promise<void>;

// features/auth/useAuthStore.ts
refreshSession: async () => {
  if (!get().token) return;
  try {
    const { sessionData } = await apiGet<SessionResponse>('/auth/session');
    set({ sessionData });
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.status === 401) {
      get().logout();
      return;
    }
    // Red o 5xx: se conserva la copia persistida. No se toca `error` ni `isLoading`:
    // el banner de error es del formulario de login y la UI no debe parpadear.
  }
},
```
No toca `isLoading` (criterio: sin pantalla de carga durante la revalidación). `ProfileResponse` y el bloque `refreshUser` se eliminan del store.

```tsx
// App.tsx — dentro de AppRoot
const didRefreshSession = useRef(false);

useEffect(() => {
  if (didRefreshSession.current) return;
  didRefreshSession.current = true;
  void useAuthStore.getState().refreshSession();
}, []);
```
`AppRoot` envuelve todas las rutas y monta una sola vez por carga de página: una petición por arranque, cero al navegar. Se lee del store con `getState()` para no suscribir `AppRoot` a `refreshSession`.

### Frontend — periodo activo
```typescript
// features/period/useActivePeriod.ts
import { useAuthStore } from "../auth/useAuthStore";
import type { Period } from "@/types/domain";

/** Periodo con `isActive: true` de la sesión, o `undefined` si la institución no tiene ninguno. */
export function useActivePeriod(): Period | undefined {
  return useAuthStore((state) => state.sessionData?.periods?.find((p) => p.isActive));
}
```

`StudentValuationDetail.tsx`:
- `const activePeriod = useActivePeriod();` reemplaza el `find` de `:38`.
- El efecto de carga (`:37-44`) pasa a depender de `[studentId, activePeriod?._id, fetchValuation, clearValuation]` en vez de `sessionData`. **Obligatorio**, no cosmético: con la revalidación, `sessionData` cambia de identidad al arrancar y el efecto actual se reejecutaría, disparando `clearValuation()` + un segundo `POST` en carrera con el primero.
- Rama nueva, **antes** de `if (!localValuation)` (`:131`) y después de `if (error)`:

```tsx
if (!activePeriod) {
  return (
    <div className="...">
      <Typography>No hay un periodo académico activo</Typography>
      <Typography variant="small">
        {isAreaLead
          ? "Activa un periodo en Configuración para poder valorar estudiantes."
          : "Pide al Jefe de Área que active el periodo académico."}
      </Typography>
      {isAreaLead && <Button onClick={() => navigate("/gestion/configuracion")}>Ir a Configuración</Button>}
      <Button variant="text" onClick={() => navigate("/evaluacion")}>Volver</Button>
    </div>
  );
}
```
`isAreaLead` de `usePermissions()`. Tono neutro (no error): mismo lenguaje visual que el `emptyMessage` de `DataTable`, no el panel rojo.

`StudentValuationsPage.tsx:51`, `IndividualReportsPanel.tsx:26`, `LearningsPage.tsx:52`, `ConceptsPage.tsx:54`: sustituyen su `find` por `useActivePeriod()`. `LearningsPage` y `ConceptsPage` conservan `periods` para las opciones del filtro.

### Frontend — modal «Nueva Plantilla»
- `ChecklistsPage.tsx:171` → `<FormModal ... scrollable={false}>`. El formulario son tres campos: no necesita scroll propio y así el `DialogBody` deja de recortar el listbox.
- `ChecklistCreateForm.tsx` → `menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}` en el `Select` de periodo, y `menuProps={{ placement: "bottom" }}` en el de grado. `placement` evita que el menú se abra hacia arriba y quede fuera del diálogo; `max-h` le da scroll propio si la institución acumula muchos periodos.
- No se recrea el posicionamiento a mano: se ajustan las props del `Select` real de Material Tailwind.

### Docs
`docs/roles-permissions.md`:
- Fila `Eliminar valoración`: `| ✅ | ✅ solo de estudiantes de su sede |`.
- Bloque de Evaluaciones: nota igual a la de Informes — el Docente queda restringido a su sede; el `schoolId` sale de `req.user`, nunca del `body`.
- Nota «Hueco conocido» (`:82`): se elimina y se reemplaza por el estado real — alcance por sede cerrado en `VAL-04` (`student-valuation.service.ts`, `report.service.ts`, `users.service.ts`), y `404` en vez de `403` para no revelar existencia.

`quartz-web/docs/known-issues.md`: entrada nueva con síntoma (opción superior o inferior invisible), causa (el listbox del `Select` se renderiza dentro del `DialogBody`, y `overflow-y-auto` recorta todo lo que sobresale), fix (`scrollable={false}` + `menuProps`), regla general (todo `FormModal` que contenga un `Select` debe ir con `scrollable={false}` o dar al menú su propio `max-h`) y referencias (`dbe601d`, nota 5 de `ACAD-04`).

---

## Notas

1. **Por qué revalidar y no caducar la copia local.** Un TTL solo cambia cuándo aparece el desfase. La sesión ya tiene un dueño —el backend, vía `getSessionData`— y el arranque de la app es el único momento en que la copia se puede refrescar sin costo perceptible: una petición por carga de página, con la copia persistida cubriendo el intervalo. El `localStorage` se conserva como está para que un `F5` no pierda la sesión.

2. **Costo del guard endurecido.** Antes, el Jefe de Área no pagaba ninguna consulta (`scope.role !== DOCENTE` salía en la primera línea); ahora paga un `findById` por operación. Es una búsqueda por `_id` con `.select('role schoolId').lean()`, y a cambio cierra que se pueda crear una valoración sobre un usuario que no es estudiante. En `initializeStudentValuation` el neto es cero: el `validateAllExist` del estudiante desaparece.

3. **El guard corre dos veces en `initializeStudentValuation`.** La función termina delegando en `getStudentValuationById` (`:389`), que vuelve a validar. Se deja así: es un `findById` extra en una operación que ya escribe en Mongo, y separar el camino «validado» del público duplicaría la superficie del servicio para ahorrar una lectura indexada.

4. **`404` y no `403`, también para el no-estudiante.** Mismo criterio que `VAL-04` y `users.service.ts:379-384`: un `403` confirmaría que ese id existe en el inquilino.

5. **El estado vacío no sustituye a la validación del backend.** Si no hay periodo activo, la UI ni siquiera llama al API; pero el endpoint sigue aceptando cualquier `periodId` del inquilino, que es lo correcto — el Jefe de Área puede necesitar operar sobre un periodo cerrado. La regla «solo se valora el periodo activo» es de UI, no de dominio.

6. **`useActivePeriod` devuelve el elemento del array, no una copia.** El selector de Zustand es estable mientras `sessionData.periods` no cambie de identidad; con la revalidación cambia una vez por arranque, lo que produce un único re-render adicional.

7. **`periods` recalculado en cada render.** `LearningsPage:26` y `ConceptsPage:27` hacen `sessionData?.periods ?? []`, que crea un array nuevo por render y deja el efecto de `[periods]` reejecutándose siempre (hoy lo contiene un `useRef`). Queda fuera de este spec: el hook nuevo no empeora ni arregla ese patrón.

8. **`GET /api/auth/profile` queda sin consumidores.** No se borra: es el único endpoint de identidad barato y borrarlo no aporta nada a este spec.

---

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes (web en `5173`, API en `4000`): cero errores en consola.
- Manual — modal: `/academico/lista-chequeo` → «Nueva Plantilla» → abrir «Período académico» y comprobar que se ven todas las opciones.
- Manual — sesión: con sesión ya iniciada, cambiar el periodo activo en Configuración desde otro navegador, recargar y comprobar que `quartz-session` en `localStorage` refleja el cambio.
- Manual — periodo: dejar la institución sin periodo activo y abrir `/evaluacion/:studentId`; debe verse el estado vacío y **ninguna** petición a `/student-valuations` en la pestaña Red.
- Manual — alcance: Docente de la Sede A contra un estudiante de la Sede B → `404` en las 6 rutas; contra uno de su sede → `200`. Cualquier rol contra un `:studentId` de un Docente → `404`.
