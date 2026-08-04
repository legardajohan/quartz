# INF-01 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/report/report.types.ts` — `IStudent.avatarUrl?`, limpiar comentario obsoleto de `IInstitution.shield` |
| tocar | `src/features/report/report.service.ts` — mapear `studentDoc.avatarUrl` en el bloque `student` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/components/common/SearchFilterBar.tsx` |
| crear | `src/constants/assets.ts` |
| crear | `src/features/subject/useSubjectAxisLabel.ts` |
| crear | `src/utils/remoteImageToJpegDataUrl.ts` |
| crear | `src/features/report/usePdfImage.ts` |
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

- Normalizacion compartida en `src/utils/normalizeText.ts` (crear): `normalizeText(s: string): string` = `s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()`; se aplica al termino y al campo antes de comparar (busqueda insensible a mayusculas y acentos).
- Cada `onSearchChange`/`onToggle` hace `setCurrentPage(1)`.
- `LearningsPage` conserva `hasInitializedFilter` (periodo activo por defecto) y `isDescriptionModeSelected`.
- `ConceptsPage` conserva `hasInitializedFilter` y `canManage`.

### Activos compartidos
`src/constants/assets.ts`:
```ts
export const AVATAR_FALLBACK = '/avatar-default.svg';
export const QUARTZ_LOGO = '/quartz-logo.png';
```
Consumen: `UsersTable` (elimina su const local), `StudentValuationTable:153`, `StudentValuationDetail:175`, `ReportsTable:51`. Se eliminan los `import userImage from ".../default-user.jpg"` de esos tres archivos (el asset queda en disco; lo sigue usando nadie más).

### Imágenes del PDF (WebP → JPEG)
`@react-pdf/renderer` solo decodifica JPG/PNG; R2 guarda WebP (`imageToWebp.ts`). Conversión en el navegador antes de renderizar.

`src/utils/remoteImageToJpegDataUrl.ts`:
```ts
export async function remoteImageToJpegDataUrl(url: string, maxSize?: number): Promise<string | null>;
// <img crossOrigin="anonymous"> → canvas (fondo blanco) → toDataURL('image/jpeg', 0.92)
// maxSize (default 400) limita el lado mayor. Cualquier fallo (CORS, 404, decode) ⇒ null.
```
`src/features/report/usePdfImage.ts`:
```ts
export function usePdfImage(url?: string): string | null;  // useEffect + cancelación por flag; null mientras carga o si falla
```
`ChecklistReportModal`: resuelve `shieldSrc = usePdfImage(currentReport?.institution.shield)` y `photoSrc = usePdfImage(currentReport?.student.avatarUrl)`, y los pasa como props a `ChecklistReportDocument` (el mismo par se usa en `PDFViewer` y en `PDFDownloadLink`, para no renderizar dos documentos distintos).

### `ChecklistReportDocument`
```ts
interface ChecklistReportDocumentProps {
  report: IReportTemplate;
  shieldSrc?: string | null;
  photoSrc?: string | null;
}
```
- Cabecera: `{shieldSrc && <Image src={shieldSrc} style={styles.shieldImage} />}` — sin `shieldSrc` no se renderiza `shieldBox`. Igual con `photoSrc` / `studentPhotoBox`. Se eliminan `shieldPlaceholderText` y los recuadros punteados.
- `studentPhotoBox` pasa a 56×56 (las fotos son cuadradas 400×400); `objectFit: 'cover'`, `borderRadius: 4`.
- Pie de marca fijo en todas las hojas:
```tsx
<View style={styles.brandFooter} fixed>
  <Text style={styles.brandText}>Powered by</Text>
  <Image src={QUARTZ_LOGO} style={styles.brandLogo} />   {/* height 10, sin borde */}
  <Text style={styles.brandName}>Quartz</Text>
</View>
```
  `brandFooter`: `position: 'absolute', bottom: 18, left: 40, flexDirection: 'row', alignItems: 'center', gap: 4`; `brandText`/`brandName` a `fontSize: 6–7`, gris `#9ca3af` (`brandName` en `Helvetica-Bold`). El `pageNumber` existente queda a la derecha, misma línea base.
- `styles.page`: `paddingBottom: 56` (el resto sigue en 40) para que el contenido nunca invada el pie fijo.

### Paginación del PDF (criterio 4)
- Bloque de dimensión: `<View style={styles.subjectBlock} key={...} wrap>` (explícito) — sin `wrap={false}` en ningún ancestro.
- Encabezado del bloque: `<Text style={styles.subjectHeader} minPresenceAhead={36}>` (evita encabezado huérfano al pie de página).
- Encabezado de tabla dentro del bloque: `<View style={styles.tableHeaderRow} fixed>` → react-pdf lo repite en cada página que el bloque abarque.
- Filas: se mantiene `wrap={false}` en `tableRow` (una fila no se parte por la mitad).
- Observaciones: `observationsBlock` pasa de `wrap={false}` a `wrap`, con `minPresenceAhead={36}` en su encabezado; `observationsBox` sin `wrap={false}`.
- Bloque de firma: se mantiene al final del flujo, `wrap={false}` explícito para que no se parta la línea de firma.

### Backend — payload del informe
`report.types.ts`:
```ts
export interface IStudent {
  // …campos actuales
  avatarUrl?: string;
}
```
`report.service.ts` (bloque `student` del `return`): `avatarUrl: studentDoc.avatarUrl,`.
Sin cambios en rutas, validación ni permisos: `getChecklistReport` ya resuelve el estudiante con `findOneScoped(User, institutionId, …)`.
Espejo en `quartz-web/src/features/report/types/api.ts` → `IReportStudent.avatarUrl?: string`.

### `/academico/lista-chequeo`
`ChecklistsPage.tsx:157-158`: `<p className="text-gray-400 text-sm">Cargando plantillas…</p>` → `<Loading message="Cargando plantillas…" />` (`@/components/ui/Loading`), manteniendo el resto del ternario (vacío / grid).

## Notas
- **CORS de R2 (bloqueante para escudo y foto en el PDF).** Leer el pixel data en `canvas` exige `crossOrigin="anonymous"` **y** que `R2_PUBLIC_URL` responda `Access-Control-Allow-Origin` con el origen web. Si el bucket no lo tiene, la conversión devuelve `null` y el PDF sale sin imágenes (degradación silenciosa, no error). Verificar en el navegador durante la implementación; si falla, configurar la regla CORS del bucket en Cloudflare (`AllowedOrigins: [WEB_ORIGIN]`, `AllowedMethods: [GET]`).
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
