---
id: INF-07-valuation-report-query
feature: valuation-report-query
status: draft
created: 2026-09-28
---

# INF-07 — Valoración e informes en React Query (spec)

## Objetivo
Migrar `student-valuation` y `report` de Zustand a React Query: una sola lista de estudiantes compartida entre `/evaluacion` e `/informes`, caché con revalidación en segundo plano para valoración/carta/reporte, e invalidación cruzada tras cada escritura.

## Contexto
- `GET /users?role=Estudiante` se pide dos veces con cachés separadas: `useStudentValuationStore.fetchUsers` (`StudentValuationsPage`) y `useReportStore.fetchUsers` (`IndividualReportsPanel`); `ReportsPage` lee `users` del store de informes. Además `users/queries/useUsersQuery` ya cachea `['users', params]`.
- `StudentValuationsPage` refetchea la lista cada vez que se vuelve del detalle (`/evaluacion/:studentId` → `/evaluacion`).
- `fetchLetterAvailability` se llama desde `StudentValuationsPage` e `IndividualReportsPanel` en cada montaje.
- `POST /student-valuations/student/:studentId/period/:periodId` es get-or-create idempotente (VAL-01).
- `student-valuation/types/store.ts` define un `UserDto` propio (subconjunto del de `users/types/api.ts`); `report/types/store.ts` lo re-exporta.
- `StudentValuationTable` (componente) lee `isLoading`, `error` y `deleteValuation` del store → viola "components/ sin llamadas API".
- Informes: los datos del PDF (`IReportTemplate`, `ICommunicativeLetterTemplate`) viven solo en memoria; el PDF se sigue generando bajo demanda y nunca se almacena (`CLAUDE.md` §1).

## Alcance
**Incluye:**
- `student-valuation/queries/` y `report/queries/`; eliminación de `useStudentValuationStore`, `useReportStore` y sus `types/store.ts`.
- Lista de estudiantes vía `useUsersQuery({ role: 'Estudiante' })` (key compartida con `users`).
- `StudentValuationTable` recibe `isLoading`, `error` y `onDeleteValuation` por props.
- Protección de borradores (`localValuation`, `selection`, `conceptText`) frente a la revalidación en segundo plano.

**Fuera:**
- Cambios de backend, de UI o del render PDF (`useReportPdf`, `useBulkReportDownload` salvo su fuente de datos).
- Caché de los consolidados (`POST .../consolidated`): son bajo demanda y se descargan.
- Actualizaciones optimistas.

## Criterios de aceptación (EARS)
- [ ] Cuando el usuario alterna entre `/evaluacion` e `/informes` dentro de 5 min, el sistema emite como máximo una request `GET /users?role=Estudiante`.
- [ ] Cuando `ReportsPage` e `IndividualReportsPanel` montan a la vez, el sistema emite una sola request a `/users` (misma key).
- [ ] Cuando el usuario vuelve de `/evaluacion/:studentId` a `/evaluacion`, el sistema pinta la lista en caché sin spinner.
- [ ] Cuando el usuario abre la valoración de un estudiante ya visitado, el sistema pinta la valoración en caché al instante y revalida en segundo plano (`STALE_TIME.live`).
- [ ] Si llega una revalidación mientras el usuario tiene cambios sin guardar en la valoración o en la carta, el sistema no sobrescribe el borrador local.
- [ ] Cuando se guarda una valoración, el sistema escribe la respuesta en la key de esa valoración e invalida `['users']`, `['dashboard']` y `['report']`.
- [ ] Cuando se elimina una valoración, el sistema invalida `['users']`, `['dashboard']`, `['report']` y elimina la key de esa valoración.
- [ ] Cuando se guardan los conceptos de la carta, el sistema invalida la key de esa carta y de `letterAvailability`; la pantalla refleja la carta del servidor.
- [ ] Mientras `activePeriod` no cambie y la caché tenga < 5 min, el sistema no repite `GET /reports/communicative-letter/availability`.
- [ ] Cuando se abre `ChecklistReportModal` o `CommunicativeLetterModal`, el sistema consulta el reporte solo si `open && valuationId` (`enabled`); al cerrarlo no se descarta la caché.
- [ ] Cuando se genera un consolidado, el sistema usa `useMutation` con `timeout: REPORT_REQUEST_TIMEOUT_MS` y no cachea la respuesta.
- [ ] Si cualquier consulta o mutación falla, el sistema muestra el mismo mensaje que hoy (`extractErrorMessage` + textos actuales).
- [ ] No existen `useStudentValuationStore.ts`, `useReportStore.ts`, `student-valuation/types/store.ts` ni `report/types/store.ts`; `StudentValuationTable` no importa hooks de datos.
- [ ] **Aislamiento:** sin cambios de backend; la caché (incluidos datos de informes) se purga en cada cambio de sesión (INF-05); ningún PDF se persiste.
- [ ] `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- **Base de rama:** `feat/USR-04-user-invitation` (incluye INF-04, USR-03 y USR-04, aún no mergeados en `develop`). El PR a `develop` se abre tras mergear USR-04, o su diff arrastrará esos commits.
- INF-05-server-state-foundation.
- Recomendado después de INF-06 (sin dependencia técnica dura).

## Trazabilidad
- Frontend: `quartz-web/src/features/{student-valuation,report,users}/`
- Branch:   `feat/INF-07-valuation-report-query`
