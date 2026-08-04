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
- PDF: escudo de la institución real; si no existe, no se dibuja el recuadro. (Ronda 4: la foto del estudiante se descarta del PDF — ver Fuera.)
- PDF: pie de página fijo en **todas** las hojas con `Powered by` + logo Quartz (`public/quartz-logo.png`).
- PDF: los bloques de dimensión y observaciones se parten entre páginas aprovechando el espacio disponible en cada hoja, no solo en la primera.
- `avatarUrl` del estudiante expuesto en el payload del informe (`quartz-api`).
- Avatar por defecto unificado en `/avatar-default.svg` en `/evaluacion` (tabla y detalle) e `/informes`, en lugar de la foto de plantilla `assets/images/default-user.jpg`.
- Estado de carga de `/academico/lista-chequeo` con el componente `Loading` (hoy es un `<p>` suelto).
- Ancho consistente de `SearchFilterBar` entre páginas (el ancho quedaba acoplado al largo del `<h1>` vecino).
- `SearchFilterBar` en `/evaluacion` (buscar por nombres/apellidos/identificación; filtrar por Grado, Estado, Sede) y `/informes` (buscar por nombres/apellidos/identificación; filtrar por Grado, Sede).
- `/evaluacion` sin el contenedor `bg-white` que envolvía toda la página (alineado con `/informes`).
- Escudo y foto del PDF servidos por un proxy autenticado del backend (`GET /api/reports/checklist/:valuationId/image/:kind`) en vez de lectura directa del navegador a R2 vía `canvas` (bloqueada por falta de CORS en el bucket).
- Pie de marca del PDF en dos líneas: `Powered by` pequeño arriba; logo + `QUARTZ` abajo en `Helvetica-Bold` y color de marca (`#6b21a8`, no gris/blanco) — `SpaceAge` no renderiza en `@react-pdf/renderer` (ver criterios).
- Escudo de institución precomputado a `.jpg` en el momento de la carga (no en cada apertura del PDF): dos variantes en R2 (`.webp` para las vistas, `.jpg` para el informe), vía `sharp` en el backend. No aplica a fotos de estudiante (ver Fuera).
- El modal de Lista de Chequeo espera a que informe + escudo + foto estén listos antes de montar el visor/botón de descarga (elimina el parpadeo por remontaje).

**Fuera:**
- Búsqueda en servidor / paginación en servidor: el filtrado sigue siendo en cliente sobre la lista ya cargada.
- Informe **Carta Comunicativa**: aún no existe documento PDF; solo se toca `ChecklistReportDocument`.
- Avatar del usuario en sesión (`UserMenu`): sigue con `assets/images/user.png`; no hay subida de foto para Docente/Jefe de Área (ver `ACAD-03`).
- Renombrar el `type` de `Subject` en backend o añadir un alias por institución: la etiqueta se deriva de los `type` ya existentes.
- Los *chips* “Filtrado por:” de `LearningsFilters`/`ConceptsFilters` (los sustituye el badge de conteo + limpiar).
- **Ronda 4:** foto del estudiante en el PDF. Se implementó y se revirtió — precomputar `.jpg` por cada foto de estudiante subida (potencialmente cientos, muchos sin informe jamás impreso) anula el ahorro de almacenamiento que `.webp` buscaba; el escudo sí lo justifica por ser uno por institución. `uploadUserPhoto` solo sube `.webp`, como antes de esta ronda.

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
- [x] Cuando falla la descarga de la imagen del escudo, el sistema genera el PDF sin ella y sin bloquear la vista previa ni la descarga.
- [x] Cuando el PDF se renderiza, cada hoja muestra en el pie `Powered by` + logo Quartz en tamaño pequeño, sin solaparse con el contenido ni con el número de página.
- [x] Cuando un bloque de dimensión no cabe completo en la hoja actual, el sistema imprime en ella las filas que alcancen y continúa en la siguiente, en **todas** las páginas del documento.
- [x] Cuando un bloque continúa en una página nueva, el sistema repite el encabezado de la tabla (`Aprendizajes` / `Valoración`).
- [x] Si el encabezado de un bloque no tiene espacio para al menos una fila debajo, el sistema lo mueve completo a la página siguiente (sin encabezados huérfanos).
- [x] Cuando el bloque de Observaciones excede el espacio restante, el sistema lo parte entre páginas en lugar de saltarlo entero.
- [x] Cuando el frontend pide `GET /api/reports/checklist/:valuationId/shield`, el sistema responde con los bytes del escudo y el `Content-Type` real; si la institución no tiene escudo o el objeto no existe en R2, responde `404`.
- [x] Si un `Docente` pide el escudo de un informe fuera de su alcance (mismo criterio que `getChecklistReport`), el sistema responde `403`.
- [x] Cuando el PDF muestra la marca Quartz, la línea `Powered by` es pequeña y el nombre `QUARTZ` usa `Helvetica-Bold` en color púrpura de marca (`#6b21a8`, el mismo del wordmark `QUARTZ` del navbar), no gris ni blanco. **Ronda 4:** se intentó primero con la tipografía `SpaceAge` (igual que el navbar); el texto no renderizaba (glyphs invisibles) en `@react-pdf/renderer`/fontkit pese a registrar la fuente correctamente — incompatibilidad del formato `.woff2` con ese motor, no un problema de color. Se usa `Helvetica-Bold` (ya probada en el resto del documento) en su lugar; `SpaceAge` sigue sin cambios en el resto de la app (navbar, sidebar, login), donde es CSS de navegador, no PDF.
- [x] Cuando `Jefe de Área` sube el escudo, el sistema almacena dos variantes en R2: `.webp` (consumida por las vistas normales de la app, sin cambios) y `.jpg` (precomputada una sola vez en el momento de la carga, usada únicamente por el proxy de imagen del informe).
- [x] Cuando se reemplaza un escudo, el sistema elimina ambas variantes anteriores (webp y jpg) del almacenamiento, best-effort.
- [x] Si una institución tiene `shieldUrl` pero no `shieldJpgUrl` (escudo subido antes de esta variante), el endpoint de imagen responde `404` y el PDF se genera sin escudo — sin bloquear, sin migración de datos.
- [x] Cuando el usuario abre el modal de Lista de Chequeo, el sistema no muestra el documento PDF (ni el botón de descarga) hasta que el informe **y** el escudo terminaron de resolverse (con o sin imagen); mientras tanto solo se ve el indicador de carga, sin remontar el visor una segunda vez.
- [x] **Ronda 4 — revertido:** la foto del estudiante **no** se incluye en el PDF. No se genera ni almacena `.jpg` para fotos de usuario (`avatarJpgUrl` no existe); `uploadUserPhoto` solo sube `.webp`, igual que antes de esta ronda. El payload del informe ya no incluye `student.avatarUrl` (sin consumidores tras quitar la foto del PDF). Motivo: aplicar el mismo precómputo `.webp`+`.jpg` a cada foto de estudiante duplicaba almacenamiento para usuarios cuyo informe puede no llegar a imprimirse nunca — el escudo sí lo justifica (uno por institución, casi siempre usado); la foto del estudiante no.

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
- Activos ya presentes: `quartz-web/public/quartz-logo.png`, `quartz-web/public/avatar-default.svg`.

## Trazabilidad
- Backend:  quartz-api/src/features/report/ · quartz-api/src/features/institution/ · quartz-api/src/features/users/ · quartz-api/src/features/auth/auth.model.ts · quartz-api/src/services/r2.service.ts · quartz-api/src/utils/webpToJpeg.ts
- Frontend: quartz-web/src/components/common/SearchFilterBar.tsx · quartz-web/src/features/{users,learning,concept,student-valuation,report,subject}/ · quartz-web/src/types/domain.ts
- Branch:   feat/INF-01-search-and-report-polish
