# INF-04 — Tasks

> **Antes del primer componente de UI:** cargar las skills `emil-design-eng`, `impeccable` y
> `frontend-design` (exigido por `quartz-web/CLAUDE.md`). **Antes del primer gráfico:** cargar `dataviz`.
> **Verificación visual: la hace el usuario.** Prohibido usar Claude in Chrome.

## 1. Constantes compartidas (`quartz-api`)
- [ ] `features/student-valuation/student-valuation.types.ts` — exportar `VALUATION_POINTS` y `CONCEPT_THRESHOLDS = { ACHIEVED: 80, IN_PROCESS: 46 }`
- [ ] `features/student-valuation/student-valuation.service.ts` — `resolveQualitativeValuation` (`:39-43`) y `pointsMapping` (`:450-454`) consumen las constantes; sin cambio de comportamiento

## 2. Índices (`quartz-api`)
- [ ] `features/student-valuation/student-valuation.model.ts` — `{ institutionId: 1, periodId: 1, studentId: 1 }`
- [ ] `features/learning/learning.model.ts` — `{ institutionId: 1, periodId: 1, subjectId: 1 }` (el modelo no declara ninguno hoy)
- [ ] `features/concept/concept.model.ts` — `{ institutionId: 1, periodId: 1, subjectId: 1, valuationType: 1 }`
- [ ] `features/auth/auth.model.ts` — `{ institutionId: 1, role: 1, schoolId: 1 }`

## 3. Caché transversal (`quartz-api`)
- [ ] `services/memory-cache.service.ts` — `getOrSet(key, ttlMs, producer)` almacenando la **promesa** (dedupe de peticiones en vuelo), `catch` que borra la entrada si rechaza, purga de expirados y tope `MAX_ENTRIES = 500`
- [ ] `services/memory-cache.service.ts` — `invalidatePrefix(prefix)` y `clearCache()`
- [ ] `features/student-valuation/student-valuation.service.ts` — invalidar en `initializeStudentValuation`, `updateStudentValuation`, `updateValuationConcepts`, `deleteStudentValuation`
- [ ] `features/learning/learning.service.ts` — invalidar en `createLearning`, `updateLearning`, `deleteLearning`
- [ ] `features/concept/concept.service.ts` — invalidar en `createConcept`, `updateConcept`, `deleteConcept`

## 4. Feature `dashboard` (`quartz-api`)
- [ ] `features/dashboard/dashboard.types.ts` — `DashboardFilters` + los 10 DTOs de `plan.md` + `IDashboardResponse`
- [ ] `features/dashboard/dashboard.validation.ts` — `getDashboardSchema` con `.strict()` **sobre el objeto `query` interno**, nunca sobre el envoltorio (`quartz-api/docs/known-issues.md`)
- [ ] `features/dashboard/dashboard.service.ts` — paso 0: resolver periodo (`periodId` o `isActive`); si no hay, devolver respuesta vacía con `period: null`
- [ ] `features/dashboard/dashboard.service.ts` — paso 0: **si el rol es Docente, sobreescribir `schoolId` con `requestorSchoolId`** ignorando la query
- [ ] `features/dashboard/dashboard.service.ts` — paso 1: cohorte con `findScoped(User, …, { role: ESTUDIANTE, schoolId?, shiftId?, gradesTaught? })` + `.select().lean()` → `Map` por `_id`
- [ ] `features/dashboard/dashboard.service.ts` — paso 2: `$facet` único con `index`, `itemProgress`, `subjectPerformance`, `subjectConcept`, `atRisk`
- [ ] `features/dashboard/dashboard.service.ts` — paso 3: auxiliares en `Promise.all` (subjects, learnings, concepts, tendencia, docentes, sedes), todas condicionadas por rol
- [ ] `features/dashboard/dashboard.service.ts` — composición: cohorte por estado (`notStarted` por diferencia, `null` → `Por diligenciar`), cobertura sin `NaN`, progreso por docente ordenado ascendente, progreso por sede desde el `Map` de cohorte, salud curricular, tendencia (`[]` si <2 periodos), alerta (top 10)
- [ ] `features/dashboard/dashboard.service.ts` — etiquetado con `$in` + `Map`, **nunca** `populate()`; nombre de respaldo si la dimensión ya no existe
- [ ] `features/dashboard/dashboard.service.ts` — envolver todo en `getOrSet` con `DASHBOARD_CACHE_TTL_MS = 60_000` y la clave `dashboard:{institutionId}:{periodId|none}:{schoolId|all}:{shiftId|all}:{grade|all}:{role}`
- [ ] `features/dashboard/dashboard.controller.ts` — `getDashboardController`, sin `try/catch` y sin guardas
- [ ] `features/dashboard/dashboard.routes.ts` — `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(getDashboardSchema) → asyncHandler`
- [ ] `app.ts` — `app.use('/api/dashboard', dashboardRoutes)`

## 5. Tokens y primitivas compartidas (`quartz-web`)
- [ ] `package.json` — instalar `recharts`
- [ ] `types/domain.ts` — `QUALITATIVE_VALUATION_VALUES`, `QualitativeValuation`, `QUALITATIVE_VALUATION_COLORS` (hex) y `CHART_PALETTE`
- [ ] `features/concept/components/ConceptsTable.tsx` — importar del origen único (`:13-17`)
- [ ] `features/report/components/LetterConceptPicker.tsx` — idem (`:8-12`)
- [ ] `features/report/components/ChecklistReportPages.tsx` — idem (`:7-13`)
- [ ] `features/report/components/CommunicativeLetterPages.tsx` — idem (`:6-10`)
- [ ] `components/ui/Skeleton.tsx` — primitiva nueva
- [ ] `components/common/EmptyState.tsx` — primitiva nueva (icono, título, descripción, acción opcional)

## 6. Feature `dashboard` (`quartz-web`)
- [ ] `features/dashboard/types/api.ts` — espejo exacto de `IDashboardResponse` + `GetDashboardQuery`
- [ ] `features/dashboard/types/domain.ts` — labels, orden de series, formateadores (porcentaje, «hace X»)
- [ ] `features/dashboard/types/index.ts` — agregador
- [ ] `features/dashboard/queries/useDashboardQuery.ts` — `staleTime: 60_000`, `refetchOnWindowFocus: true`, `placeholderData: keepPreviousData`
- [ ] `features/dashboard/components/ChartCard.tsx` — shell: título, subtítulo, skeleton, estado vacío, acción
- [ ] `features/dashboard/components/StatTile.tsx` — KPI en HTML plano, sin Recharts
- [ ] `features/dashboard/components/DashboardFilters.tsx` — periodo/sede/jornada/grado desde `sessionData`; sin selector de sede para Docente
- [ ] `features/dashboard/components/DashboardHeader.tsx` — filtros + «actualizado hace X» (`dataUpdatedAt`) + botón refrescar (`ripple={false}` si lleva posicionamiento propio)
- [ ] `features/dashboard/components/DashboardSkeleton.tsx` — respeta la geometría final
- [ ] `features/dashboard/components/charts/SubjectPerformanceChart.tsx` — widget 5, barras apiladas al 100 %, orden por % Con dificultad ↓
- [ ] `features/dashboard/components/charts/ValuationStatusDonut.tsx` — widget 6, colores de `ValuationStatusBadge.tsx:12-43` y orden de `VALUATION_STATE_ORDER`
- [ ] `features/dashboard/components/charts/SubjectConceptChart.tsx` — widget 7
- [ ] `features/dashboard/components/charts/TeacherProgressChart.tsx` — widget 8, barras horizontales, fila navega a `/evaluacion`
- [ ] `features/dashboard/components/charts/SchoolProgressChart.tsx` — widget 9, no se monta con una sola sede
- [ ] `features/dashboard/components/charts/PeriodTrendChart.tsx` — widget 11, no se monta con `periodTrend.length < 2`
- [ ] `features/dashboard/components/CurriculumHealthPanel.tsx` — widget 10, dimensiones sin aprendizajes y conceptos faltantes por nivel
- [ ] `features/dashboard/components/AtRiskStudentsList.tsx` — widget 12, navega a `/evaluacion/:studentId`
- [ ] `features/dashboard/pages/DashboardPage.tsx` — composición, filtros en estado local, reparto por `isAreaLead`, `useMemo` en cada transformación DTO → serie, error con botón de reintento
- [ ] `App.tsx` — borrar el placeholder `DashboardPage` (`:31-44`) y montar el real con `React.lazy` + `Suspense fallback={routeFallback}`

## Verificación final
- [ ] `cd quartz-api && npx tsc --noEmit` en verde
- [ ] `cd quartz-web && npm run build` en verde
- [ ] `cd quartz-web && npm run lint` sin errores nuevos respecto a la rama base (contrastar con `git stash`)
- [ ] Servidor arranca sin errores de compilación ni runtime; `GET /api/dashboard` responde
- [ ] `recharts` queda en el chunk de `DashboardPage`, no en el de entrada
- [ ] **Repaso de aislamiento:** ninguna query sin `institutionId` del token; `role` y `schoolId` siempre de `req.user`; `institutionId` en la clave de caché
- [ ] Manual — Jefe de Área: las 5 capas pobladas
- [ ] Manual — Docente: `teacherProgress`, `schoolProgress` y `curriculumHealth` en `null`; cohorte recortada a su sede
- [ ] Manual — Docente con `?schoolId=<otra sede>` recibe los datos de su propia sede
- [ ] Manual — `?foo=bar` responde `400`
- [ ] Manual — sin periodo activo: `200` con `period: null` y estado vacío en la UI
- [ ] Manual — caché: segunda petición idéntica sin consultas a Mongo; tras editar una valoración, sí las hay
- [ ] Manual — cambiar un filtro conserva los datos previos en pantalla; volver a la pestaña refresca; el botón actualiza el «hace X»
- [ ] Manual (usuario) — revisión visual y de interacción

## Definición de «hecho»
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
