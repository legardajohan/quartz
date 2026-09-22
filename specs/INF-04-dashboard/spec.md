---
id: INF-04-dashboard
feature: dashboard
status: draft
created: 2026-09-21
---

# INF-04 — Dashboard analítico (spec)

## Objetivo
Convertir `/dashboard` —hoy un placeholder hardcodeado en `quartz-web/src/App.tsx:31-44`— en un panel que responda, de un vistazo y con datos reales, si la institución llegará al cierre del periodo con todo evaluado, quién va retrasado, en qué dimensión está floja la cohorte y qué estudiantes requieren acompañamiento.

## Contexto
- `quartz-api/src/` **no tiene una sola llamada a `aggregate()`** ni endpoint de estadísticas. Los datos de `studentValuations`, `learnings` y `concepts` existen y no se explotan.
- El placeholder es el destino de `/`, el ítem «Inicio» del sidebar (`SidebarMenu.tsx:56-96`) y la primera pantalla tras el login.
- `@tanstack/react-query@5.101.0` ya está instalado, montado en `src/main.tsx` y en uso (`features/users/queries/`). No se añade un store Zustand.
- `recharts` **no** está instalado: es la única dependencia nueva del feature.
- `'Sin iniciar'` ya existe como `ValuationState.NOT_STARTED` en `quartz-web/src/features/student-valuation/types/domain.ts`. En backend **no** es un estado persistido (`GlobalValuationStatus` solo tiene tres valores): es la cohorte sin documento `StudentValuation`, métrica derivada.

## Alcance

**Incluye:**
- Feature `dashboard` en `quartz-api` (solo lectura, sin `.model.ts`) con un endpoint único `GET /api/dashboard`.
- Caché en memoria por inquilino + filtros, TTL 60 s, invalidada al escribir valoraciones, aprendizajes y conceptos.
- Índices compuestos nuevos en `StudentValuation`, `Learning`, `Concept` y `User` para sostener las agregaciones.
- Feature `dashboard` en `quartz-web` con React Query, Recharts y 12 widgets en 5 capas.
- Filtros de periodo, sede, jornada y grado, alimentados desde `sessionData` (sin fetch adicional).
- Vistas diferenciadas por rol: Jefe de Área ve la institución; Docente ve su sede.
- Primitivas UI compartidas que hoy no existen: `Skeleton` y `EmptyState`.
- Fuente única de verdad para los colores de `QualitativeValuation` en `quartz-web/src/types/domain.ts`, sustituyendo las 4 definiciones duplicadas.

**Fuera:**
- Colección materializada de snapshots: las métricas se calculan on-demand. Decisión tomada.
- Tiempo real (SSE/WebSocket) y polling por intervalo. La frescura es refetch al montar, al enfocar la pestaña y por botón manual.
- Exportar el dashboard a PDF o Excel.
- Analítica cuantitativa (0.0–5.0) y grados distintos de Transición: fase futura según `docs/domain.md`.
- Corregir la discrepancia de `docs/domain.md` sobre si el Docente puede filtrar otras sedes (ver `plan.md`, nota 7). El dashboard sigue lo implementado en `VAL-04`/`INF-03`.
- Rol `Estudiante`: sin acciones en esta fase.
- Caché distribuida (Redis) y `ETag`/`304` en el endpoint.
- Alertas, notificaciones o envío de correo derivados de las métricas.
- Widgets de operación (8, 9, 10) para el rol Docente: no son accionables para él.

## Criterios de aceptación (EARS)

### Endpoint y alcance
- [ ] Cuando un usuario autenticado solicita `GET /api/dashboard`, el sistema responde `200` con las métricas del periodo indicado en `periodId` o, si se omite, del periodo con `isActive: true`.
- [ ] Si la institución no tiene ningún periodo activo y no se envía `periodId`, el sistema responde `200` con `period: null` y contadores en cero, **no** `404`.
- [ ] Si el rol del solicitante es Docente, el sistema ignora el `schoolId` de la query y fuerza `req.user.schoolId`.
- [ ] Si el rol del solicitante es Docente, el sistema devuelve `teacherProgress`, `schoolProgress` y `curriculumHealth` en `null`.
- [ ] Si el rol del solicitante es Jefe de Área, el sistema no aplica filtro de sede salvo que la query lo pida.
- [ ] Cuando la query trae una clave no declarada en el esquema, el sistema responde `400`.
- [ ] Si el rol del solicitante es Estudiante, el sistema responde `403`.

### Capa 1 — KPIs
- [ ] Cuando se calcula la cohorte, el sistema cuenta los `User` con `role: 'Estudiante'` del inquilino que cumplen los filtros de sede, jornada y grado vigentes.
- [ ] Cuando un estudiante de la cohorte no tiene documento `StudentValuation` en el periodo, el sistema lo cuenta en `notStarted`.
- [ ] Cuando un documento `StudentValuation` tiene `globalStatus: null`, el sistema lo cuenta como `Por diligenciar`.
- [ ] Cuando se calcula `coveragePercentage`, el sistema divide los estudiantes con `globalStatus: 'Evaluado'` entre el total de la cohorte; si la cohorte es cero, devuelve `0` y no `NaN`.
- [ ] Cuando se calcula el progreso ítem a ítem, el sistema cuenta como valorada toda entrada de `learningValuations` con `qualitativeValuation !== null`, y toda dimensión en modo `description` con `performanceDescription !== null` como una unidad valorable.
- [ ] Cuando existe periodo, el sistema devuelve `daysToClose` a partir de `Period.endDate`, con valor negativo si la fecha ya pasó.

### Capa 2 — Distribuciones
- [ ] Cuando se agrupa el desempeño por dimensión, el sistema devuelve por cada `subjectId` el conteo de ítems en `Logrado`, `En proceso`, `Con dificultad` y sin valorar.
- [ ] Cuando se agrupa el concepto por dimensión, el sistema aplica los mismos umbrales que `resolveQualitativeValuation` y excluye las dimensiones con `maxSubjectScore` igual a `0`.
- [ ] Cuando una dimensión referenciada por una valoración ya no existe en `subjects`, el sistema devuelve la fila con un nombre de respaldo y no omite el dato.
- [ ] Cuando el embudo de estados se renderiza, el sistema usa los colores ya definidos en `ValuationStatusBadge.tsx:12-43` y el orden de `VALUATION_STATE_ORDER`.

### Capa 3 — Operación (solo Jefe de Área)
- [ ] Cuando se agrupa el progreso por docente, el sistema ordena las filas por porcentaje de evaluados ascendente.
- [ ] Cuando el usuario activa una fila de progreso por docente, el sistema navega a `/evaluacion` con el filtro correspondiente aplicado.
- [ ] Si la institución tiene una sola sede, el sistema no renderiza la comparativa por sede.
- [ ] Cuando una dimensión con `evaluationMode: 'checklist'` no tiene ningún `Learning` en el periodo, el sistema la lista en salud curricular como bloqueante.
- [ ] Cuando una dimensión no tiene `Concept` para alguno de los tres niveles en el periodo, el sistema lista el nivel faltante como hueco que rompe la Carta Comunicativa.

### Capa 4 — Tendencia
- [ ] Si la cohorte tiene valoraciones en menos de dos periodos, el sistema omite el gráfico de evolución.
- [ ] Cuando existen dos o más periodos con datos, el sistema devuelve un punto por periodo ordenado cronológicamente por `year` y `startDate`.

### Capa 5 — Atención requerida
- [ ] Cuando un estudiante acumula dos o más dimensiones con `subjectPercentage` menor a 46 y `maxSubjectScore` mayor a 0, el sistema lo incluye en la lista de alerta.
- [ ] Cuando la lista de alerta se compone, el sistema devuelve como máximo 10 estudiantes, ordenados por número de dimensiones en dificultad descendente.
- [ ] Cuando el usuario activa un estudiante de la lista, el sistema navega a `/evaluacion/:studentId`.

### Caché y rendimiento
- [ ] Cuando dos peticiones consecutivas comparten inquilino, rol y filtros dentro de la ventana de 60 s, el sistema sirve la segunda desde caché sin volver a consultar Mongo.
- [ ] Cuando dos peticiones equivalentes llegan en paralelo y no hay entrada válida, el sistema ejecuta el cálculo una sola vez y sirve el mismo resultado a ambas.
- [ ] Si el productor de una entrada de caché falla, el sistema no deja almacenada la entrada fallida.
- [ ] Cuando se crea, actualiza o elimina una valoración, un aprendizaje o un concepto, el sistema invalida todas las entradas de caché de ese inquilino.
- [ ] Cuando se resuelve la respuesta, el sistema ejecuta un número de consultas a Mongo independiente del tamaño de la cohorte.
- [ ] Cuando la aplicación web carga cualquier ruta distinta de `/dashboard`, el sistema no incluye Recharts en el bundle descargado.

### Frontend — estado y frescura
- [ ] Cuando el usuario vuelve a la pestaña del navegador y los datos llevan más de 60 s, el sistema los recarga automáticamente.
- [ ] Cuando el usuario activa el botón de actualizar, el sistema recarga los datos y refresca el texto «actualizado hace X».
- [ ] Cuando el usuario cambia un filtro, el sistema conserva en pantalla los datos anteriores mientras llegan los nuevos y no muestra el esqueleto de carga completo.
- [ ] Mientras no hay datos previos, el sistema muestra un esqueleto que respeta la geometría final de la página.
- [ ] Si un widget no tiene datos, el sistema muestra un estado vacío explicativo en lugar de un gráfico en blanco.
- [ ] Si la petición falla, el sistema muestra el mensaje de error y un botón de reintento, y no deja la página en blanco.

### Transversales
- [ ] **Aislamiento:** toda lectura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`/`query`. `role` y `schoolId` del solicitante se toman de `req.user`.
- [ ] Cuando se compone la clave de caché, el sistema incluye `institutionId` y `role`, de modo que una entrada nunca puede servirse a otro inquilino ni a otro rol.
- [ ] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`, sin errores nuevos respecto a la rama base.

## Dependencias
- `VAL-04-teacher-valuation-scope` — `RequestorScope` y el criterio de alcance por sede del Docente.
- `INF-03-session-sync-and-scope-audit` — `useActivePeriod()` y `sessionData` revalidada al arrancar.
- `AUTH-02-role-access-baseline` — `usePermissions()`.
- `ACAD-02-period-settings` — `Period.isActive`, `year`, `endDate`, `closingAlertDate`.
- `ACAD-04-schools-and-shifts` — `School` como catálogo y `shiftId` embebido en `Institution.settings.shifts[]`.
- `VAL-03-description-mode` — `evaluationMode` como discriminador en `valuationsBySubject[]`.

## Trazabilidad
- Backend:  `quartz-api/src/features/dashboard/`, `quartz-api/src/services/memory-cache.service.ts`
- Frontend: `quartz-web/src/features/dashboard/`
- Docs:     `quartz-web/docs/known-issues.md` (si aparece un incidente no obvio)
- Branch:   `feat/INF-04-dashboard`
