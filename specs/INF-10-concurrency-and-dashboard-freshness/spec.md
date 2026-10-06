---
id: INF-10-concurrency-and-dashboard-freshness
feature: concurrency-and-dashboard-freshness
status: implemented
created: 2026-10-06
---

# INF-10 — Concurrencia optimista (aprendizajes + valoraciones) y frescura del Dashboard (spec)

## Objetivo
Que dos usuarios que editan el mismo aprendizaje o la misma valoración no se pisen en silencio: el segundo en guardar recibe un aviso, ve la versión vigente y decide si vuelve a guardar sin perder lo que escribió. Además, que volver al Dashboard no muestre el esqueleto de carga ni reinicie sus filtros.

## Contexto
- **Hoy, last-write-wins silencioso:**
  - `PATCH /api/learnings/:id` (`learning.service.ts:110`) hace `$set` sin precondición, y `LearningsPage.tsx:117-121` envía el formulario completo: quien guarda segundo sobrescribe también los campos que no tocó.
  - `PATCH /api/student-valuations/:id` y `/:id/concepts` (`student-valuation.service.ts:550,621`) usan `valuation.save()` sin `optimisticConcurrency`.
- **Sin aviso a los demás:** no hay push en tiempo real. La caché de `learnings` dura 5 min (`STALE_TIME.list`) y una mutación fallida no invalida nada (`onSuccess` solo): tras un 404, la fila borrada sigue visible.
- **Dashboard** (`useDashboardQuery.ts`, `DashboardPage.tsx`):
  - `gcTime: 5 min` borra la caché → al volver tras >5 min aparece `DashboardSkeleton`.
  - Los filtros viven en `useState` y se reinician en cada montaje.
  - `periodId` se fija una sola vez con `useActivePeriod()`; tras un F5 queda en `""`.
  - INF-08 dejó estos filtros fuera de `useTableFiltersStore` a propósito.

## Alcance
**Incluye:**
- Token de versión (`version`, = `__v`) en las respuestas de `Learning`, `StudentValuation` y la Carta Comunicativa; obligatorio en el body de las escrituras protegidas.
- Escrituras protegidas: `PATCH /api/learnings/:learningId`, `PATCH /api/student-valuations/:valuationId`, `PATCH /api/student-valuations/:valuationId/concepts`.
- Conflicto → `409` con `code: 'VERSION_CONFLICT'`, distinguible del `409` existente ("Lista de Chequeo aún no evaluada").
- Frontend:
  - aviso de conflicto en línea (`ConflictNotice`) que conserva el borrador, muestra qué cambió la otra persona y ofrece "Guardar mis cambios" / "Usar la versión actual";
  - refresco del recurso tras `409`/`404`.
- Dashboard:
  - Sin el `gcTime` propio (hereda el global).
  - Filtros que sobreviven a la navegación.
  - Periodo activo aplicado como default una sola vez, aunque los periodos lleguen después del montaje.

**Fuera:**
- Concurrencia en `DELETE` (siguen sin versión) y en el resto de CRUD (concepts, checklist-templates, subjects, periods, schools, users, institution).
- Tiempo real (WebSocket/SSE), bloqueo de edición ("X está editando") y merge automático de campos.
- `If-Match`/ETag en headers.
- Caché distribuida del dashboard en el backend (sigue en memoria, por proceso).
- Cambios en `staleTime` y `refetchOnWindowFocus` del dashboard (siguen en 60 s / `true`).

## Criterios de aceptación (EARS)
### Backend
- [x] Cuando se lee o escribe un aprendizaje (`GET /api/learnings`, `POST`, `PATCH`), cada elemento de la respuesta incluye `version: number`.
- [x] Cuando se lee o escribe una valoración (`POST /student/:studentId/period/:periodId`, `GET /:valuationId`, `GET /student/:studentId`, `PATCH /:valuationId`, `PATCH /:valuationId/concepts`), la respuesta incluye `version: number`.
- [x] Cuando se pide la Carta Comunicativa editable (`GET /api/reports/communicative-letter/:valuationId`), la respuesta incluye `version` (la `version` de la valoración).
- [x] Si una escritura protegida llega sin `version`, o con un valor que no es entero ≥ 0, el sistema responde `400` (Zod) sin modificar nada.
- [x] Si la `version` del body coincide con la del documento, el sistema aplica el cambio, incrementa `version` en exactamente 1 y devuelve el documento con la `version` nueva.
- [x] Si la `version` del body no coincide, el sistema responde `409` con `{ message, code: 'VERSION_CONFLICT' }` y no modifica el documento ni invalida la caché del dashboard.
- [x] Si dos escrituras con la misma `version` llegan casi a la vez, exactamente una se aplica y la otra recibe `409 VERSION_CONFLICT`: la verificación es atómica, no lee y luego escribe.
- [x] Si el documento no existe en la institución, el sistema responde `404` (no `409`).
- [x] El `409` existente de `updateValuationConcepts` ("La Lista de Chequeo aún no está evaluada completamente.") no lleva `code`.
- [x] Los documentos existentes antes de este spec (con `__v` de cualquier valor) se pueden editar sin migración.
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; la condición de versión se añade al filtro scoped, nunca lo reemplaza; ninguna operación acepta `institutionId` de `body`/`params`.

### Frontend — conflictos (experiencia de usuario)
**Principios del mensaje:**
- Dice **qué pasó**, **qué pasa con tu trabajo** y **qué puedes hacer**.
- Va dentro del contexto donde el usuario está trabajando (modal o pantalla), no solo en un toast que desaparece.
- Sin jerga técnica: nunca "versión", "conflicto", "409" ni "error".
- Tono tranquilo: no hubo fallo del usuario y su trabajo no se perdió.

**Aviso de conflicto (`ConflictNotice`, componente compartido):**
- [x] Cuando un guardado protegido devuelve `409 VERSION_CONFLICT`, el sistema:
  - muestra un aviso en línea, en la parte superior del modal o pantalla que se estaba editando;
  - no muestra además un toast de error;
  - el aviso tiene `role="alert"` y recibe el foco, para que lectores de pantalla y teclado lo encuentren;
  - los campos o ítems siguen editables mientras el aviso está visible.
- [x] El aviso muestra:
  - **título** que nombra el recurso;
  - **descripción:** "Mientras editabas, otra persona guardó cambios. Lo que escribiste sigue aquí y aún no se ha guardado.";
  - **la lista de lo que cambió la otra persona**, comparando la versión con la que el usuario empezó a editar contra la versión actual.
- [x] El aviso ofrece dos acciones, ambas resuelven en un solo clic:
  - **Primaria, "Guardar mis cambios":** guarda el borrador sobre la versión actual. Si vuelve a haber conflicto, el aviso se actualiza con los cambios nuevos.
  - **Secundaria, "Usar la versión actual":** descarta el borrador, carga lo que guardó la otra persona y cierra el aviso.
- [x] Mientras el aviso está visible, el botón Guardar normal del formulario queda reemplazado por esas dos acciones, para que no haya una tercera vía ambigua.
- [x] Cuando el usuario elige una acción y termina, el sistema confirma con un toast de éxito corto ("Cambios guardados" / "Se cargó la versión actual").

**Textos por recurso:**

| Recurso | Título del aviso | "Lo que cambió" |
|---|---|---|
| Aprendizaje (modal en `LearningsPage`) | "Otra persona actualizó este aprendizaje" | Campos con valor anterior → actual, p. ej. "Dimensión: Cognitiva → Comunicativa", "Descripción" (el texto completo de la descripción actual se ve al expandir) |
| Valoración (`StudentValuationDetail`) | "Esta evaluación cambió mientras la editabas" | "N ítems y M dimensiones fueron actualizados". Cada ítem o dimensión afectado lleva la marca visual "Actualizado por otra persona" en la lista, para revisarlo sin buscar |
| Conceptos de la carta (`CommunicativeLetterEditPage`) | "Los conceptos de esta carta cambiaron" | Dimensiones cuyo concepto asignado cambió, marcadas en la pantalla |

**El registro ya no existe (`404`):**
- [x] Si un **aprendizaje** fue eliminado por otra persona, el sistema:
  - cierra el modal;
  - muestra un toast: "Este aprendizaje ya no existe: otra persona lo eliminó. La lista se actualizó.";
  - quita la fila de la lista.
- [x] Si una **valoración** ya no existe, el sistema:
  - muestra en la pantalla: "Esta evaluación fue eliminada por otra persona.";
  - ofrece el botón "Volver a Evaluación".

**Reglas de comportamiento:**
- [x] Una revalidación en segundo plano mientras el usuario edita no cambia la `version` con la que guardará ni su borrador: solo un `409` actualiza la versión de referencia.
- [x] Los errores que no son de conflicto (red, validación, permisos) mantienen el mensaje y el comportamiento actuales.

### Frontend — Dashboard
- [x] Cuando el usuario vuelve a `/dashboard` dentro de los 30 min siguientes a la última carga, el sistema pinta los datos en caché sin `DashboardSkeleton` (y revalida en segundo plano si pasaron más de 60 s).
- [x] Cuando el usuario cambia los filtros del Dashboard, navega a otra sección y vuelve, el sistema restaura esos filtros.
- [x] Cuando los periodos llegan después del primer montaje (F5), el sistema aplica el periodo activo como default una sola vez; si el usuario luego lo quita, no se re-aplica.
- [x] Cuando el usuario cierra sesión o recarga la página (F5), los filtros del Dashboard vuelven a sus defaults; no se escriben en storage.

### Verificación
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- INF-04-dashboard, INF-05-server-state-foundation, INF-07-valuation-report-query, INF-08-ui-state-zustand (ya en `develop`).
- Reglas de valoración y carta: [`docs/domain.md`](../../docs/domain.md). Colecciones: [`docs/data-model.md`](../../docs/data-model.md).

## Trazabilidad
- Backend:
  - `quartz-api/src/features/{learning,student-valuation,report}/`
  - `quartz-api/src/utils/AppError.ts`
  - `quartz-api/src/middlewares/error.middleware.ts`
- Frontend:
  - `quartz-web/src/features/{learning,student-valuation,report,dashboard}/`
  - `quartz-web/src/api/withErrorMessage.ts`
  - `quartz-web/src/stores/`
- Branch: `feat/INF-10-concurrency-and-dashboard-freshness`
