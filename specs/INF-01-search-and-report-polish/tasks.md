# INF-01 — Tasks

> Rama: `feat/INF-01-search-and-report-polish` desde `develop`.
> Antes de tocar UI: invocar skills `emil-design-eng`, `impeccable` y `frontend-design` (`quartz-web/CLAUDE.md`).

## Backend (`quartz-api`)
- [x] `report.types.ts` — `IStudent.avatarUrl?: string`; borrar el comentario obsoleto de `IInstitution.shield` ("sin mecanismo de subida aun").
- [x] `report.service.ts` — añadir `avatarUrl: studentDoc.avatarUrl` al bloque `student` del `return`.
- [x] Repaso: `getChecklistReport` sigue resolviendo estudiante/sede/plantilla/periodo con `findOneScoped(..., institutionId, ...)`; no se introduce ninguna query sin scope.

## Frontend — base transversal (`quartz-web`)
- [x] `src/types/domain.ts` — `SUBJECT_TYPE_LABELS`, `SUBJECT_AXIS_FALLBACK`, `resolveSubjectAxisLabel(subjects)`.
- [x] `src/features/subject/useSubjectAxisLabel.ts` — `useSubjectAxisLabel()` y `useSubjectTypeLabel(subjectId?)` sobre `sessionData.subjects`.
- [x] `src/constants/assets.ts` — `AVATAR_FALLBACK`, `QUARTZ_LOGO`.
- [x] `src/utils/normalizeText.ts` — `normalizeText(s)` (minúsculas + sin acentos).
- [x] `src/components/common/SearchFilterBar.tsx` — props `SearchFilterBarProps`/`FilterGroup`/`FilterOption`; grid de columnas por mapa estático; badge con conteo y limpiar-todo; sin `groups` no renderiza el botón de filtros.

## Frontend — adopción del buscador
- [x] `UsersPage.tsx` — sustituir `<UsersToolbar>` por `<SearchFilterBar>` con grupos Sede/Grado; mismo `placeholder` y misma lógica de `filteredUsers`.
- [x] Borrar `src/features/users/components/UsersToolbar.tsx`.
- [x] `LearningsPage.tsx` — estado `search`; `<SearchFilterBar>` con grupos Periodo + `axis.plural`; `filteredLearnings` filtra también por `description` normalizada; `setCurrentPage(1)` en búsqueda y toggles; conservar periodo activo por defecto y `isDescriptionModeSelected`.
- [x] Borrar `src/features/learning/components/LearningsFilters.tsx`.
- [x] `ConceptsPage.tsx` — estado `search`; `<SearchFilterBar>` con grupos Periodo + `axis.plural` + Valoración; `filteredConcepts` filtra también por `description` normalizada.
- [x] Borrar `src/features/concept/components/ConceptsFilters.tsx`.

## Frontend — nomenclatura del eje de valoración
- [x] `LearningsTable.tsx` — header `"Dimensión"` → `axis.singular`.
- [x] `ConceptsTable.tsx` — header `"Dimensión"` → `axis.singular`.
- [x] `LearningForm.tsx` — `label="Dimensión"` → `axis.singular`.
- [x] `ConceptForm.tsx` — `label="Dimensión"` → `axis.singular`.
- [x] `LearningsPage.tsx` — texto del estado vacío en modo `description` sin el literal "dimensión".
- [x] `ValuationChecklist.tsx` — `Dimensión {subjectName}` → `{useSubjectTypeLabel(subjectId)} {subjectName}`.
- [x] Verificación: `grep -rn "Dimensión" quartz-web/src/features` sin resultados fuera de `SUBJECT_TYPES`/`SUBJECT_TYPE_LABELS` y del panel de Configuración.

## Frontend — avatares
- [x] `StudentValuationTable.tsx` — `user.avatarUrl || AVATAR_FALLBACK`; quitar el import de `default-user.jpg`.
- [x] `StudentValuationDetail.tsx` — ídem.
- [x] `ReportsTable.tsx` — ídem.
- [x] `UsersTable.tsx` — usar `AVATAR_FALLBACK` de `constants/assets.ts` y borrar la constante local.

## Frontend — informe PDF
- [x] `report/types/api.ts` — `IReportStudent.avatarUrl?: string`.
- [x] `src/utils/remoteImageToJpegDataUrl.ts` — `<img crossOrigin="anonymous">` → canvas (fondo blanco, lado máx. 400) → `toDataURL('image/jpeg', 0.92)`; devuelve `null` ante cualquier fallo.
- [x] `src/features/report/usePdfImage.ts` — hook con `useEffect` + cancelación; `null` mientras carga o si falla.
- [x] `ChecklistReportModal.tsx` — resolver `shieldSrc`/`photoSrc` una sola vez y pasarlos tanto a `PDFViewer` como a `PDFDownloadLink`.
- [x] `ChecklistReportDocument.tsx` — props `shieldSrc`/`photoSrc`; pintar `<Image>` solo si existen; eliminar recuadros punteados y `shieldPlaceholderText`; caja de foto 56×56 con `objectFit: 'cover'`.
- [x] `ChecklistReportDocument.tsx` — pie de marca `fixed` (`Powered by` + `QUARTZ_LOGO` + `Quartz`, `fontSize` 6–7, gris) alineado con el número de página; `styles.page.paddingBottom: 56`.
- [x] `ChecklistReportDocument.tsx` — paginación: `wrap` explícito en `subjectBlock`; `minPresenceAhead={36}` en `subjectHeader`; `tableHeaderRow` con `fixed` dentro del bloque; `observationsBlock` pasa a `wrap` con `minPresenceAhead`; bloque de firma `wrap={false}`.
- [x] Verificar CORS de R2: si `remoteImageToJpegDataUrl` devuelve `null` para una URL válida, configurar la regla CORS del bucket (`AllowedOrigins: [WEB_ORIGIN]`, `AllowedMethods: [GET]`) y anotarlo en `plan.md` § Notas.

## Frontend — consistencia de carga
- [x] `ChecklistsPage.tsx` — `<p>Cargando plantillas…</p>` → `<Loading message="Cargando plantillas…" />`.

## Verificación final
- [x] `cd quartz-api && npx tsc --noEmit` en verde.
- [x] `cd quartz-web && npm run build && npm run lint` en verde.
- [x] Servidor y front arrancan sin errores de compilación ni runtime.
- [x] Manual: `/gestion/usuarios`, `/academico/aprendizajes` y `/academico/conceptos` buscan y filtran; el badge cuenta y limpia; la paginación vuelve a 1.
- [x] Manual: informe de ≥3 páginas — cada hoja aprovecha el espacio, el encabezado de tabla se repite, no hay encabezados huérfanos, el pie `Powered by Quartz` aparece en todas.
- [x] Manual: informe con/sin escudo y con/sin foto de estudiante.
- [x] Manual: `/evaluacion` muestra `avatar-default.svg` en estudiantes sin foto.
- [x] Repaso de aislamiento: ninguna query nueva sin `institutionId` del token.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
