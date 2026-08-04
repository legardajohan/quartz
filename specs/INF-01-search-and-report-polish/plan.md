# INF-01 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/report/report.types.ts` — limpiar comentario obsoleto de `IInstitution.shield`; `IStudent.avatarUrl?` agregado en ronda 1, quitado en ronda 4 |
| tocar | `src/features/report/report.service.ts` — `getChecklistReportShield(...)` (`getChecklistReportImage` de ronda 1, sin `kind` desde ronda 4, ver § Imágenes del PDF) |
| tocar | `src/features/report/report.controller.ts` · `report.routes.ts` · `report.validation.ts` — `GET /checklist/:valuationId/shield` (`/image/:kind` hasta ronda 4) |
| tocar | `src/services/r2.service.ts` — `getImage(key)` |
| crear | `src/utils/webpToJpeg.ts` — conversión con `sharp` (ronda 2) |
| tocar | `src/features/institution/institution.model.ts` · `institution.service.ts` — `shieldJpgUrl`, con comentarios de propósito (ronda 2, aclarado en ronda 4) |
| tocar | `src/features/auth/auth.model.ts` · `src/features/users/users.service.ts` — `avatarJpgUrl` agregado en ronda 2, **revertido en ronda 4** (solo `.webp` para fotos de usuario) |
| tocar | `package.json` — dependencia `sharp` (ronda 2) |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/components/common/SearchFilterBar.tsx` |
| crear | `src/constants/assets.ts` |
| crear | `src/features/subject/useSubjectAxisLabel.ts` |
| crear | `src/utils/blobToDataUrl.ts` (ronda 2, reemplaza `blobToJpegDataUrl.ts`, que reemplazó `remoteImageToJpegDataUrl.ts`) |
| crear | `src/features/report/usePdfShieldImage.ts` (`usePdfImage.ts` hasta ronda 4; renombrado al quedar exclusivo del escudo) |
| borrar | `src/features/users/components/UsersToolbar.tsx` |
| borrar | `src/features/learning/components/LearningsFilters.tsx` |
| borrar | `src/features/concept/components/ConceptsFilters.tsx` |
| tocar | `src/types/domain.ts` — `SUBJECT_TYPE_LABELS`, `SUBJECT_AXIS_FALLBACK` |
| tocar | `src/features/users/pages/UsersPage.tsx` |
| tocar | `src/features/learning/pages/LearningsPage.tsx` |
| tocar | `src/features/learning/components/LearningsTable.tsx` · `LearningForm.tsx` |
| tocar | `src/features/concept/pages/ConceptsPage.tsx` |
| tocar | `src/features/concept/components/ConceptsTable.tsx` · `ConceptForm.tsx` |
| tocar | `src/features/student-valuation/components/ValuationChecklist.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationTable.tsx` · `StudentValuationDetail.tsx` |
| tocar | `src/features/report/components/ReportsTable.tsx` |
| tocar | `src/features/report/components/ChecklistReportDocument.tsx` |
| tocar | `src/features/report/components/ChecklistReportModal.tsx` |
| tocar | `src/features/report/types/api.ts` — `IReportStudent.avatarUrl?` |
| tocar | `src/features/checklist-template/pages/ChecklistsPage.tsx` — `<Loading />` |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` — buscador + filtros (grado/estado/sede), paginación local, quita el wrapper `bg-white` (post-implementación) |
| tocar | `src/features/report/pages/ReportsPage.tsx` — buscador + filtros (grado/sede), paginación local (post-implementación) |
| tocar | `src/features/student-valuation/types/domain.ts` — `getValuationState`, `VALUATION_STATE_ORDER`, `VALUATION_STATE_LABELS` (post-implementación) |
| tocar | `src/features/student-valuation/components/ValuationStatusBadge.tsx` · `StudentValuationTable.tsx` — consumen el helper/labels de `domain.ts` en vez de duplicarlos (post-implementación) |
| tocar | `src/features/student-valuation/useStudentValuationStore.ts` · `types/store.ts` — quita `currentPage`/`nextPage`/`prevPage` (paginación pasa a estado local de página) (post-implementación) |
| tocar | `src/features/report/useReportStore.ts` · `types/store.ts` — ídem (post-implementación) |
| tocar | `src/components/common/SearchFilterBar.tsx` — `className` default agrega `flex-1 min-w-0` (post-implementación, ver § Ancho del buscador) |

## Contratos

### `SearchFilterBar` (`components/common/SearchFilterBar.tsx`)
```ts
export interface FilterOption { value: string; label: string }

export interface FilterGroup {
  id: string;                          // "school" | "grade" | "period" | "subject" | "valuation"
  label: string;                       // encabezado de la columna dentro del menú
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;                // default: "Buscar"
  groups?: FilterGroup[];              // sin grupos ⇒ sin botón de filtros ni badge
  className?: string;                  // default: "w-full max-w-xl"
}

export default function SearchFilterBar(props: SearchFilterBarProps): JSX.Element;
```
- Markup y estilos: los de `UsersToolbar.tsx` (pill `rounded-full`, `MagnifyingGlassIcon`, botón `AdjustmentsHorizontalIcon`, badge rosa con conteo/`XMarkIcon`, `MENU_ANIMATION`, `dismiss={{ itemPress: false }}`).
- `activeFilterCount = groups.reduce((n, g) => n + g.selected.length, 0)`.
- Limpiar todo: `groups.forEach(g => g.selected.forEach(g.onToggle))` (los toggles son idempotentes por valor).
- Layout del `MenuList`: una columna por grupo, separador `border-l` desde la segunda. Ancho y columnas por mapa estático (Tailwind JIT no admite clases interpoladas):
  `const GRID_COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" }` · `const MENU_WIDTH = { 1: "w-[16rem]", 2: "w-[26rem]", 3: "w-[34rem]" }` (>3 grupos ⇒ 3 columnas con `flex-wrap`).
- Reutiliza `Menu/MenuHandler/MenuList/Checkbox/Typography` de material-tailwind; no se recrea posicionamiento a mano.

### Etiqueta del eje de valoración
`src/types/domain.ts`:
```ts
export const SUBJECT_TYPE_LABELS: Record<SubjectType, { singular: string; plural: string }> = {
  'Dimensión':  { singular: 'Dimensión',  plural: 'Dimensiones' },
  'Asignatura': { singular: 'Asignatura', plural: 'Asignaturas' },
  'Área':       { singular: 'Área',       plural: 'Áreas' },
  'Materia':    { singular: 'Materia',    plural: 'Materias' },
};

export const SUBJECT_AXIS_FALLBACK = { singular: 'Eje de Valoración', plural: 'Ejes de Valoración' } as const;

export function resolveSubjectAxisLabel(
  subjects: Pick<Subject, 'type'>[]
): { singular: string; plural: string };   // tipo único ⇒ su label · 0 o >1 tipos ⇒ SUBJECT_AXIS_FALLBACK
```
`src/features/subject/useSubjectAxisLabel.ts`:
```ts
export function useSubjectAxisLabel(): { singular: string; plural: string };  // resolveSubjectAxisLabel(sessionData?.subjects ?? []) memoizado
export function useSubjectTypeLabel(subjectId?: string): string;              // type del Subject concreto; cae al singular global
```

Aplicación:
| Archivo | Antes | Después |
|---|---|---|
| `LearningsTable.tsx:71` | `header: "Dimensión"` | `header: axis.singular` |
| `ConceptsTable.tsx:84` | `header: "Dimensión"` | `header: axis.singular` |
| `LearningForm.tsx:63` | `label="Dimensión"` | `label={axis.singular}` |
| `ConceptForm.tsx:76` | `label="Dimensión"` | `label={axis.singular}` |
| `LearningsPage` / `ConceptsPage` | grupo `"Dimensión"` | `label: axis.plural` |
| `ValuationChecklist.tsx:181` | `Dimensión {subject?.subjectName}` | `{useSubjectTypeLabel(subject?.subjectId)} {subject?.subjectName}` |
| `LearningsPage.tsx:211` | texto “Esta dimensión no gestiona aprendizajes…” | `Este/a ${axis.singular}` (redacción neutra: `“${axis.singular} sin aprendizajes: se valora con una descripción libre…”`) |

### Filtros y búsqueda por página
| Página | Estado nuevo | `groups` | Predicado de búsqueda |
|---|---|---|---|
| `UsersPage` | — (ya tiene `search`) | Sede (`schools`), Grado (`GRADE_LEVELS`) | nombre completo + `identificationNumber` (sin cambios) |
| `LearningsPage` | `search: string` | Periodo (`periods`), `axis.plural` (`subjects`) | `learning.description` |
| `ConceptsPage` | `search: string` | Periodo, `axis.plural`, Valoración (`VALUATION_TYPES`) | `concept.description` |
| `StudentValuationsPage` (post-implementación) | `search`, `selectedGrades`, `selectedSchools`, `selectedStates`, `currentPage` local (reemplaza paginación del store) | Grado, Estado (`VALUATION_STATE_ORDER`), Sede (derivada de `users[].school`) | nombre completo + `identificationNumber` |
| `ReportsPage` (post-implementación) | `search`, `selectedGrades`, `selectedSchools`, `currentPage` local (reemplaza paginación del store) | Grado, Sede (derivada de `users[].school`) | nombre completo + `identificationNumber` |

- Normalizacion compartida en `src/utils/normalizeText.ts` (crear): `normalizeText(s: string): string` = `s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()`; se aplica al termino y al campo antes de comparar (busqueda insensible a mayusculas y acentos).
- Cada `onSearchChange`/`onToggle` hace `setCurrentPage(1)`.
- `LearningsPage` conserva `hasInitializedFilter` (periodo activo por defecto) y `isDescriptionModeSelected`.
- `ConceptsPage` conserva `hasInitializedFilter` y `canManage`.
- Sede en Evaluación/Informes: se deriva de `users[].school` (sin llamar a `/schools`) para no acoplar estas dos features a la query de `users/`.

### Ancho del buscador (post-implementación)
`SearchFilterBar` quedaba con ancho inconsistente entre páginas: al vivir dentro de una columna `flex flex-col` junto al `<h1>`, su `w-full` resolvía contra el ancho intrínseco del título (shrink-to-fit de flexbox), no contra el ancho de la página — por eso Aprendizajes (título largo) y Conceptos (título corto) mostraban anchos distintos.
- `SearchFilterBar` default `className`: `"w-full max-w-xl min-w-0 flex-1"` — `flex-1` hace que, dentro de una fila flex (p. ej. junto a `Tabs` en `UsersPage`), crezca hasta `max-w-xl` en vez de encogerse a su contenido.
- `LearningsPage`/`ConceptsPage`/`StudentValuationsPage`/`ReportsPage`: el buscador sale de la columna del `<h1>` a su propio contenedor de bloque (hijo directo del `<div className="w-full relative">` de la página), donde `w-full` resuelve contra el ancho real de la página — igual en las cuatro.

### Activos compartidos
`src/constants/assets.ts`:
```ts
export const AVATAR_FALLBACK = '/avatar-default.svg';
export const QUARTZ_LOGO = '/quartz-logo.png';
```
Consumen: `UsersTable` (elimina su const local), `StudentValuationTable:153`, `StudentValuationDetail:175`, `ReportsTable:51`. Se eliminan los `import userImage from ".../default-user.jpg"` de esos tres archivos (el asset queda en disco; lo sigue usando nadie más).

### Imágenes del PDF (WebP → JPEG)
`@react-pdf/renderer` solo decodifica JPG/PNG; R2 guarda WebP (`imageToWebp.ts`).

**Revisión post-implementación (ronda 1):** la conversión directa en el navegador (`<img crossOrigin="anonymous">` → `canvas` → `toDataURL`) requiere que `R2_PUBLIC_URL` responda `Access-Control-Allow-Origin`; el bucket no lo tiene configurado, así que `canvas.toDataURL()` fallaba siempre y el PDF nunca pintaba escudo ni foto. Se reemplazó por un proxy autenticado en el backend (`GET /api/reports/checklist/:valuationId/image/:kind`) que evita depender de CORS de R2, con conversión WebP→JPEG hecha en el navegador con `canvas` en cada apertura del modal.

**Revisión post-implementación (ronda 2):** esa conversión en cada apertura causaba parpadeo (el `PDFViewer` montaba sin imágenes y volvía a montar cuando terminaba de convertir) y trabajo repetido en cada vista del mismo informe. Se precomputa el JPEG **una sola vez, al momento de la carga** del escudo/foto (no en cada render del PDF):

- **Backend — dos variantes por imagen subida.** `uploadInstitutionShield` (`institution.service.ts`) y `uploadUserPhoto` (`users.service.ts`) suben en paralelo el `.webp` original (`shieldUrl`/`avatarUrl`, sin cambios — sigue siendo lo que consumen las vistas normales de la app) y un `.jpg` derivado (`shieldJpgUrl`/`avatarJpgUrl`, campos nuevos en `Institution`/`User`, no expuestos en `SafeUser`/DTOs públicos — solo los usa el backend). Conversión: `quartz-api/src/utils/webpToJpeg.ts` con `sharp` (`resize 400×400 cover → flatten sobre blanco → jpeg quality 90`). Al reemplazar una imagen, se borran ambas variantes anteriores (`Promise.all` sobre `[webpUrl, jpgUrl]` → `keyFromPublicUrl` → `deleteImage`, best-effort).
- **Backend — el proxy sirve el `.jpg` precomputado, no convierte nada.** `getChecklistReportImage` ya no reutiliza `getChecklistReport` completo (evita el join con sede/plantilla/periodo, innecesario aquí); hace su propia consulta liviana: `getStudentValuationById` (gate de completitud) + `findOneScoped(User,...).select('schoolId avatarJpgUrl')` (scoping de Docente) + `Institution.findById(...).select('shieldJpgUrl')` cuando `kind === 'shield'`. Si el documento no tiene `.jpg` (institución/estudiante con imagen subida *antes* de este cambio), responde `404` — se resuelve solo, sin migración, la próxima vez que resuban esa imagen.
- **Frontend — sin `canvas`.** `src/utils/blobToDataUrl.ts` (reemplaza `blobToJpegDataUrl.ts`, que a su vez había reemplazado `remoteImageToJpegDataUrl.ts`): `Blob` → `FileReader.readAsDataURL` — el backend ya entrega bytes JPEG listos, no hace falta decodificar/redibujar/recodificar.
- **Frontend — el hook expone `isLoading` para poder esperar antes de montar el PDF:**
```ts
export interface PdfImageResult { src: string | null; isLoading: boolean }
export function usePdfImage(valuationId: string | undefined, kind: 'shield' | 'photo', hasSource: boolean): PdfImageResult;
// apiGet<Blob>(`/reports/checklist/${valuationId}/image/${kind}`, { responseType: 'blob' }) → blobToDataUrl
// hasSource evita la petición cuando el informe no trae shield/avatarUrl. Cualquier fallo (404, red) ⇒ src: null, isLoading: false.
```
- **`ChecklistReportModal` — un único gate de "listo".** `isPdfReady = !!currentReport && !isReportLoading && !reportError && !shield.isLoading` (ronda 4: ya no depende de `photo`). Mientras no es `true`, se muestra `<Loading>` (ni `PDFViewer` ni `PDFDownloadLink` se montan); solo cuando es `true` se renderiza el documento completo de una vez, con `shieldSrc` ya resuelto — sin remontaje intermedio, sin parpadeo.

**Revisión post-implementación (ronda 4 — revertido, solo escudo):** aplicar el mismo `.jpg` precomputado a las fotos de estudiante anulaba el ahorro de `.webp` (cientos de estudiantes, muchos sin informe jamás impreso, todos con dos archivos). Se revierte por completo lo específico de fotos de usuario:
- `users.service.ts` (`uploadUserPhoto`) vuelve a subir solo `.webp` (sin `webpToJpeg`, sin `avatarJpgUrl`).
- `auth.model.ts` (`IUser`): se quita el campo `avatarJpgUrl`.
- El escudo de institución **sí** conserva las dos variantes (`institution.model.ts`/`institution.service.ts` sin cambio funcional, solo comentarios aclarando el propósito de `shieldUrl` vs `shieldJpgUrl`).
- `report.service.ts`: `getChecklistReportImage(..., kind)` → `getChecklistReportShield(...)`, sin parámetro `kind` (solo escudo; ya no consulta `avatarJpgUrl`). `getChecklistReport` deja de mapear `avatarUrl` en el bloque `student`.
- `report.types.ts` / `report/types/api.ts`: se quita `avatarUrl?: string` de `IStudent`/`IReportStudent` (sin otros consumidores).
- `report.controller.ts`/`.routes.ts`/`.validation.ts`: ruta `GET /checklist/:valuationId/image/:kind` → `GET /checklist/:valuationId/shield` (mismo middleware chain).
- Frontend: `usePdfImage(valuationId, kind, hasSource)` → `usePdfShieldImage(valuationId, hasSource)` (archivo renombrado `usePdfImage.ts` → `usePdfShieldImage.ts`); `ChecklistReportModal` deja de usar `photo`.

### `ChecklistReportDocument`
```ts
interface ChecklistReportDocumentProps {
  report: IReportTemplate;
  shieldSrc?: string | null;
}
```
- Cabecera: `{shieldSrc && <Image src={shieldSrc} style={styles.shieldImage} />}` — sin `shieldSrc` no se renderiza `shieldBox`. Se eliminan `shieldPlaceholderText` y los recuadros punteados.
- **Ronda 4:** se elimina por completo el recuadro de foto del estudiante (`photoSrc`, `studentPhotoBox`, `studentPhotoImage`) — no se incluye en el PDF (ver spec § Fuera).
- Pie de marca fijo en todas las hojas (dos líneas):
```tsx
<View style={styles.brandFooter} fixed>
  <Text style={styles.brandPoweredBy}>Powered by</Text>
  <View style={styles.brandRow}>
    <Image src={QUARTZ_LOGO} style={styles.brandLogo} />
    <Text style={styles.brandName}>QUARTZ</Text>
  </View>
</View>
```
  `brandFooter`: `position: 'absolute', bottom: 14, left: 40`. `brandPoweredBy`: `fontSize: 6`, gris `#9ca3af` — línea superior, pequeña. `brandName`: `fontSize: 11`, color `#6b21a8` (púrpura de marca, el mismo del wordmark `QUARTZ` del navbar — debe resaltar, no gris/blanco).
  **Ronda 3 → Ronda 4 (revertido):** se intentó `fontFamily: 'SpaceAge'` (con `Font.register`) para igualar el navbar; el texto no renderizaba ningún glyph visible en `@react-pdf/renderer`/fontkit pese a registrar la fuente sin error — incompatibilidad de `.woff2` con ese motor, confirmada por el usuario tras probar el cambio de color solo (no era el color). Se usa `fontFamily: 'Helvetica-Bold'` (la misma fuente ya probada en `institutionName`/`subjectHeader` de este documento) — sin `Font.register` ni import de `SpaceAge.woff2` en este archivo. El resto de la app (navbar, sidebar, login) sigue usando `SpaceAge` vía CSS sin cambios. El `pageNumber` existente queda a la derecha, misma línea base.
- `styles.page`: `paddingBottom: 56` (el resto sigue en 40) para que el contenido nunca invada el pie fijo.

### Paginación del PDF (criterio 4)
- Bloque de dimensión: `<View style={styles.subjectBlock} key={...} wrap>` (explícito) — sin `wrap={false}` en ningún ancestro.
- Encabezado del bloque: `<Text style={styles.subjectHeader} minPresenceAhead={36}>` (evita encabezado huérfano al pie de página).
- Encabezado de tabla dentro del bloque: `<View style={styles.tableHeaderRow} fixed>` → react-pdf lo repite en cada página que el bloque abarque.
- Filas: se mantiene `wrap={false}` en `tableRow` (una fila no se parte por la mitad).
- Observaciones: `observationsBlock` pasa de `wrap={false}` a `wrap`, con `minPresenceAhead={36}` en su encabezado; `observationsBox` sin `wrap={false}`.
- Bloque de firma: se mantiene al final del flujo, `wrap={false}` explícito para que no se parta la línea de firma.

### Backend — payload del informe
**Superado por ronda 4.** Se había agregado `IStudent.avatarUrl?: string` (`report.types.ts`) y su espejo `IReportStudent.avatarUrl?: string` (`report/types/api.ts`) para que el PDF pintara la foto del estudiante. Al quitar esa foto del PDF (ver § Imágenes del PDF, ronda 4), el campo se elimina de ambos tipos y de `getChecklistReport` — sin otros consumidores.

### `/academico/lista-chequeo`
`ChecklistsPage.tsx:157-158`: `<p className="text-gray-400 text-sm">Cargando plantillas…</p>` → `<Loading message="Cargando plantillas…" />` (`@/components/ui/Loading`), manteniendo el resto del ternario (vacío / grid).

## Notas
- **CORS de R2 — resuelto sin tocar Cloudflare.** El bucket no tiene `Access-Control-Allow-Origin`, por lo que la lectura directa vía `canvas` desde el navegador nunca funcionó (ver § Imágenes del PDF). En vez de pedir cambiar la configuración del bucket, el backend sirve los bytes (`GET /api/reports/checklist/:valuationId/image/:kind`, tenant-scoped) y el frontend los consume como `Blob` autenticado — mismo origen, sin CORS.
- **Por qué no se abandona WebP.** El WebP optimiza el 100 % de las vistas de la app (tablas, formularios, detalle) y el almacenamiento; la conversión a JPEG solo ocurre al abrir un informe: una decodificación nativa de 400×400 más un `toDataURL` (unos pocos ms, una vez por informe). Guardar un PNG paralelo en R2 duplicaría almacenamiento y el borrado best-effort. Se elige JPEG en vez de PNG para el data URL porque pesa ~5× menos con calidad equivalente en fotos y el pipeline de `ACAD-03` ya aplana la transparencia sobre blanco.
- **Chips “Filtrado por:”.** Desaparecen al unificar con `SearchFilterBar`; el conteo en el badge + limpiar-todo cubren la misma función con menos ruido visual y layout estable entre las tres páginas.
- **Etiqueta derivada, no configurable.** No se añade un campo `axisLabel` a `Institution`: el `type` de cada `Subject` ya lo define (`ACAD-01`). Si el inquilino mezcla tipos, `Eje de Valoración` es el único término correcto.
- **`SearchFilterBar` en `common/`,** no en `ui/`: es composición con estado externo, del mismo orden que `DataTable`/`FormModal`.
- Skills de diseño obligatorias antes de tocar UI (`quartz-web/CLAUDE.md` § Skills de diseño).

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual: informe con ≥3 páginas (varias dimensiones con muchos aprendizajes) → cada hoja se llena hasta el margen, el encabezado de tabla se repite, no hay encabezados huérfanos y el pie `Powered by Quartz` aparece en todas.
- Manual: informe de estudiante con y sin foto, institución con y sin escudo.
