---
id: INF-01-search-and-report-polish
feature: search-and-report-polish
status: implemented
created: 2026-08-03
---

# INF-01 — Buscador reutilizable, nomenclatura de Ejes de Valoración y acabado del PDF (spec)

## Objetivo
Unificar el buscador con filtros en un componente transversal, hacer que la UI nombre los `Subject` con el término que el inquilino eligió en `Gestión → Configuración`, y cerrar el acabado del informe PDF (escudo, foto, marca Quartz, paginación que aprovecha la hoja).

## Alcance
**Incluye:**
- `SearchFilterBar`: componente transversal en `components/common/` derivado de `UsersToolbar` (input pill + menú de filtros por grupos + badge con conteo + limpiar todo).
- Consumo en `/gestion/usuarios` (reemplaza `UsersToolbar`), `/academico/aprendizajes` y `/academico/conceptos` (reemplazan `LearningsFilters` y `ConceptsFilters`, que hoy no tienen búsqueda por texto).
- Etiqueta del eje de valoración derivada del `type` de los `Subject` del inquilino (`Dimensión` | `Asignatura` | `Área` | `Materia`; `Eje de Valoración` cuando conviven varios tipos), aplicada en filtros, columnas, formularios y Lista de Chequeo.
- PDF: escudo de la institución y foto del estudiante reales; si no existen, no se dibuja el recuadro.
- PDF: pie de página fijo en **todas** las hojas con `Powered by` + logo Quartz (`public/quartz-logo.png`).
- PDF: los bloques de dimensión y observaciones se parten entre páginas aprovechando el espacio disponible en cada hoja, no solo en la primera.
- `avatarUrl` del estudiante expuesto en el payload del informe (`quartz-api`).
- Avatar por defecto unificado en `/avatar-default.svg` en `/evaluacion` (tabla y detalle) e `/informes`, en lugar de la foto de plantilla `assets/images/default-user.jpg`.
- Estado de carga de `/academico/lista-chequeo` con el componente `Loading` (hoy es un `<p>` suelto).
- Ancho consistente de `SearchFilterBar` entre páginas (el ancho quedaba acoplado al largo del `<h1>` vecino).
- `SearchFilterBar` en `/evaluacion` (buscar por nombres/apellidos/identificación; filtrar por Grado, Estado, Sede) y `/informes` (buscar por nombres/apellidos/identificación; filtrar por Grado, Sede).
- `/evaluacion` sin el contenedor `bg-white` que envolvía toda la página (alineado con `/informes`).
- Escudo y foto del PDF servidos por un proxy autenticado del backend (`GET /api/reports/checklist/:valuationId/image/:kind`) en vez de lectura directa del navegador a R2 vía `canvas` (bloqueada por falta de CORS en el bucket).
- Pie de marca del PDF en dos líneas: `Powered by` pequeño arriba; logo + `QUARTZ` abajo con la tipografía `SpaceAge` y color de marca (no gris).

**Fuera:**
- Búsqueda en servidor / paginación en servidor: el filtrado sigue siendo en cliente sobre la lista ya cargada.
- Informe **Carta Comunicativa**: aún no existe documento PDF; solo se toca `ChecklistReportDocument`.
- Avatar del usuario en sesión (`UserMenu`): sigue con `assets/images/user.png`; no hay subida de foto para Docente/Jefe de Área (ver `ACAD-03`).
- Renombrar el `type` de `Subject` en backend o añadir un alias por institución: la etiqueta se deriva de los `type` ya existentes.
- Los *chips* “Filtrado por:” de `LearningsFilters`/`ConceptsFilters` (los sustituye el badge de conteo + limpiar).

## Criterios de aceptación (EARS)
### Buscador reutilizable
- [x] Cuando una página monta `SearchFilterBar` con `groups`, el sistema muestra un grupo por cada entrada, con sus opciones como checkboxes multi-selección.
- [x] Cuando hay al menos un filtro activo, el sistema muestra el badge con el número total de selecciones y, al pasar el cursor, el icono de limpiar.
- [x] Cuando el usuario pulsa el badge, el sistema deselecciona todas las opciones de todos los grupos.
- [x] Cuando el usuario escribe en el input, el sistema filtra la lista y vuelve a la página 1 de la paginación.
- [x] Cuando el usuario abre el menú y marca/desmarca una opción, el menú permanece abierto (`dismiss={{ itemPress: false }}`).
- [x] Si `groups` está vacío o ausente, el sistema no renderiza el botón de filtros ni el badge.
- [x] En `/academico/aprendizajes`, cuando el usuario escribe un texto, el sistema deja solo los aprendizajes cuya `description` lo contiene (sin distinguir mayúsculas ni acentos).
- [x] En `/academico/conceptos`, cuando el usuario escribe un texto, el sistema deja solo los conceptos cuya `description` lo contiene (sin distinguir mayúsculas ni acentos).
- [x] En `/gestion/usuarios`, el comportamiento de búsqueda y filtros (nombre completo, identificación, Sede, Grado) es idéntico al actual tras el reemplazo de `UsersToolbar`.
- [x] En `/academico/aprendizajes` y `/academico/conceptos`, el filtro por periodo sigue inicializándose en el periodo activo.
- [x] El ancho renderizado de `SearchFilterBar` es el mismo en `/academico/aprendizajes`, `/academico/conceptos`, `/gestion/usuarios`, `/evaluacion` e `/informes`, independiente del texto del título de cada página.
- [x] En `/evaluacion`, cuando el usuario escribe un texto, el sistema deja solo los estudiantes cuyo nombre completo o número de identificación lo contienen; los filtros Grado, Estado y Sede se combinan con la búsqueda y entre sí.
- [x] En `/informes`, cuando el usuario escribe un texto, el sistema deja solo los estudiantes cuyo nombre completo o número de identificación lo contienen; los filtros Grado y Sede se combinan con la búsqueda y entre sí.

### Nomenclatura del eje de valoración
- [x] Si todos los `Subject` del inquilino comparten el mismo `type`, el sistema usa ese término (singular en labels de formulario y filtro, plural en encabezados y textos de grupo).
- [x] Si los `Subject` del inquilino tienen tipos distintos, el sistema usa `Eje de Valoración` / `Ejes de Valoración`.
- [x] Cuando la Lista de Chequeo muestra el nombre de un `Subject`, el sistema lo antecede con el `type` de ese `Subject` concreto.
- [x] Ningún archivo de `quartz-web/src/features/{learning,concept,student-valuation}` conserva el literal `"Dimensión"` como etiqueta de UI.

### Informe PDF
- [x] Si `institution.shield` existe y se puede cargar, el sistema pinta el escudo en la cabecera; si no, no dibuja el recuadro del escudo.
- [x] Si el estudiante tiene `avatarUrl` y se puede cargar, el sistema pinta su foto en la cabecera; si no, no dibuja el recuadro de foto.
- [x] Cuando falla la descarga o conversión de una imagen, el sistema genera el PDF sin ella y sin bloquear la vista previa ni la descarga.
- [x] Cuando el PDF se renderiza, cada hoja muestra en el pie `Powered by` + logo Quartz en tamaño pequeño, sin solaparse con el contenido ni con el número de página.
- [x] Cuando un bloque de dimensión no cabe completo en la hoja actual, el sistema imprime en ella las filas que alcancen y continúa en la siguiente, en **todas** las páginas del documento.
- [x] Cuando un bloque continúa en una página nueva, el sistema repite el encabezado de la tabla (`Aprendizajes` / `Valoración`).
- [x] Si el encabezado de un bloque no tiene espacio para al menos una fila debajo, el sistema lo mueve completo a la página siguiente (sin encabezados huérfanos).
- [x] Cuando el bloque de Observaciones excede el espacio restante, el sistema lo parte entre páginas en lugar de saltarlo entero.
- [x] Cuando el backend responde el informe, el payload incluye `student.avatarUrl` cuando el estudiante tiene foto.
- [x] Cuando el frontend pide `GET /api/reports/checklist/:valuationId/image/:kind`, el sistema responde con los bytes de la imagen y el `Content-Type` real; si el informe no tiene esa imagen o el objeto no existe en R2, responde `404`.
- [x] Si un `Docente` pide la imagen de un informe fuera de su alcance (mismo criterio que `getChecklistReport`), el sistema responde `403`.
- [x] Cuando el PDF muestra la marca Quartz, la línea `Powered by` es pequeña y el nombre `QUARTZ` usa la tipografía `SpaceAge` en el color de marca del documento (no gris).

### Avatares en la app
- [x] Cuando `/evaluacion` lista estudiantes, el sistema muestra `avatarUrl` si existe y `/avatar-default.svg` si no; nunca la foto de plantilla `default-user.jpg`.
- [x] Lo mismo aplica al detalle de valoración y a la tabla de `/informes`.

### Consistencia de UI
- [x] Cuando `/academico/lista-chequeo` está cargando plantillas, el sistema muestra el componente `Loading` (`components/ui/Loading.tsx`) en lugar del texto plano actual.

### Transversales
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [x] `npx tsc --noEmit` en verde en `quartz-api` y `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- `ACAD-01` (campo `type` en `Subject`, expuesto en `sessionData.subjects`) — implementado.
- `ACAD-03` (`shieldUrl` en `Institution`, `avatarUrl` en `User`) — implementado.
- Activos ya presentes: `quartz-web/public/quartz-logo.png`, `quartz-web/public/avatar-default.svg`, `quartz-web/src/assets/fonts/SpaceAge.woff2`.

## Trazabilidad
- Backend:  quartz-api/src/features/report/ · quartz-api/src/services/r2.service.ts
- Frontend: quartz-web/src/components/common/SearchFilterBar.tsx · quartz-web/src/features/{users,learning,concept,student-valuation,report,subject}/ · quartz-web/src/types/domain.ts
- Branch:   feat/INF-01-search-and-report-polish
