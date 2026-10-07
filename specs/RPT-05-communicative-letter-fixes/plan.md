# RPT-05 — Plan técnico

## Archivos

### quartz-api
Ninguno.

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/api/apiClient.ts` |
| tocar | `src/features/report/useReportStore.ts` |
| tocar | `src/features/report/usePdfShieldImage.ts` |
| tocar | `src/components/layouts/ProfileNavbar.tsx` |
| tocar | `src/components/layouts/Dashboard.tsx` |
| tocar | `src/features/report/components/LetterConceptPicker.tsx` |
| tocar | `src/features/report/statusVisuals.ts` |
| tocar | `src/features/report/components/CommunicativeLetterDocument.tsx` |
| reemplazar | `src/assets/images/footer.jpg` (versión optimizada) |

## Contratos

### 1. Timeout — `src/api/apiClient.ts`
Nueva constante exportada a nivel de módulo:
```ts
export const REPORT_REQUEST_TIMEOUT_MS = 30000;
```
`extractErrorMessage` (línea ~82) gana una rama **antes** de leer `response.data.message`,
porque en un timeout `err.response` es `undefined` y hoy se cae al `err.message` crudo:
```ts
if (axios.isAxiosError(err)) {
  if (err.code === 'ECONNABORTED') {
    return 'La generación del informe tardó más de lo esperado. Inténtalo de nuevo.';
  }
  return (err.response?.data as { message?: string })?.message ?? err.message;
}
```
El `axios.create({ timeout: 10000 })` de la línea 10 **no se toca**: sigue siendo el
comportamiento por defecto de toda la app.

Consumo, vía el `config?: AxiosRequestConfig` que `apiGet` ya acepta:

| Archivo | Línea | Añadir |
|---|---|---|
| `useReportStore.ts` | ~40 | `{ timeout: REPORT_REQUEST_TIMEOUT_MS }` al GET de `/reports/checklist/:id` |
| `useReportStore.ts` | ~63 | idem al GET de `/reports/communicative-letter/:id` |
| `useReportStore.ts` | ~73 | idem al refetch dentro de `saveLetterConcepts` |
| `usePdfShieldImage.ts` | ~35 | añadir la clave al config existente `{ responseType: "blob" }` |

`fetchLetterAvailability` (~51) no cambia: es una consulta barata (2 queries en `Promise.all`).

### 2. Barra de perfil — `ProfileNavbar.tsx` + `Dashboard.tsx`
`ProfileNavbar.tsx:14` — quitar `sticky top-0 z-10` del `className` del `Navbar`; el resto
(`h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4`) queda igual.

`ProfileNavbar.tsx:16-28` — el bloque `!isSidebarOpen` pierde el `IconButton` de `PanelLeftOpen`
y conserva solo `InstitutionBrand`. Con ello `toggleSidebar` deja de usarse aquí:
`ProfileNavbarProps` se reduce a `{ isSidebarOpen: boolean }`, y los imports de `IconButton` y
`PanelLeftOpen` se eliminan de este archivo. Al contenedor se le añade `pl-14` cuando el sidebar
está cerrado, para no quedar debajo del botón flotante.

`Dashboard.tsx` — el botón de reapertura pasa aquí, fuera del flujo del navbar:
```tsx
{!isSidebarOpen && (
  <IconButton
    variant="text"
    color="blue-gray"
    onClick={toggleSidebar}
    aria-label="Abrir menú"
    className="fixed top-4 left-4 z-30 bg-white/80 shadow-sm backdrop-blur"
  >
    <PanelLeftOpen className="h-7 w-7" strokeWidth={1.75} />
  </IconButton>
)}
```
`z-30` queda por debajo del sidebar (`z-40`, `SidebarMenu.tsx:128`) y por encima del contenido.
El botón se monta **fuera** del `<main>`: su clase `isolate` (línea ~18) crea un stacking
context que atraparía un `fixed` declarado dentro. Sin listeners de scroll ni estado nuevo: la
única condición es `isSidebarOpen`, que ya existe en el componente.

### 3. `Select` de conceptos — `LetterConceptPicker.tsx:80-96`
```tsx
{hasMultipleCandidates && (
  <div className="mt-3">
    <Select
      key={`${subject.subjectId}|${subject.availableConcepts.length}|${selectedId}`}
      label="Concepto asignado"
      color={levelStyle.select}
      value={selectedId}
      disabled={disabled}
      onChange={(value) => value && onSelect(subject.subjectId, value)}
      selected={(_, index) => `Opción ${index + 1} de ${subject.availableConcepts.length}`}
      menuProps={{ className: "max-h-72 overflow-y-auto" }}
    >
      {subject.availableConcepts.map((concept, index) => (
        <Option key={concept._id} value={concept._id} className="flex-col items-start gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-blue-gray-400">
            Opción {index + 1}
          </span>
          <span className="line-clamp-2 text-xs leading-relaxed text-blue-gray-700">
            {concept.description}
          </span>
        </Option>
      ))}
    </Select>
    <Typography variant="small" className="mt-1 text-[11px] text-gray-400">
      {subject.availableConcepts.length} opciones para este periodo, dimensión y estado
    </Typography>
  </div>
)}
```
Puntos del contrato:
- **`key`** — sin él, el `Select` de `@material-tailwind/react@2` no re-sincroniza su índice
  interno cuando cambian `value` o los `children` después del montaje. Es el **único** `Select`
  del repo sin este workaround; el patrón es idéntico al de `ConceptForm.tsx:66`. `selectedId`
  entra en la clave para cubrir el refetch de `saveLetterConcepts` (`useReportStore.ts:73`), que
  sustituye `currentLetter` por objetos nuevos sobre la misma instancia del `Select`.
- **`selected`** — la prop recibe `(element, index)` y su retorno es lo que se pinta en el
  trigger. Devolver una etiqueta corta es lo que impide que MT clone el `<Option>` completo
  —con la descripción de hasta `MAX_CONCEPT_TEXT_LENGTH` (2000) caracteres, línea 14— dentro de
  una caja de altura fija. Esa es exactamente la rotura reportada.
- **`line-clamp-2`** — utilidad incorporada a Tailwind desde 3.3. Verificar la versión real en
  `quartz-web/package.json` al implementar; si fuera anterior, sustituir por
  `overflow-hidden text-ellipsis` con alto máximo, sin añadir plugins.
- **`menuProps`** — alto máximo y scroll propio. No se fija `placement`: esta vista es una
  página con scroll de documento, no un modal corto, así que el caso de clipping conocido no
  aplica. Se verifica igualmente en la última fila (Ética), donde el menú puede abrir hacia
  arriba.
- La descripción íntegra sigue viviendo **solo** en el cuerpo de la tarjeta (líneas ~98-118),
  que es la fuente de verdad editable (snapshot `assignedConceptText` de RPT-04). Se añade
  `transition-opacity duration-200` al `Typography` de solo lectura para que el cambio de
  concepto no sea un salto seco.
- `hasMultipleCandidates` (línea 57) no cambia: con 1 candidato no hay `Select`.

### 4. Footer del PDF — `CommunicativeLetterDocument.tsx`
**Asset.** `src/assets/images/footer.jpg` hoy mide 1945×267 px y pesa 276 KB. Se reoptimiza a
**1400×192 px, calidad 72, objetivo ≤ 60 KB**, reemplazándolo en su ruta actual con el mismo
nombre. Es una transformación de una sola vez, con un script puntual en el scratchpad usando
`sharp` (ya instalado en `quartz-api`): no se añade dependencia ni paso de build a `quartz-web`.

**Import.** En `statusVisuals.ts`, junto a los iconos y con el patrón ya vigente:
```ts
import footerBanner from "../../assets/images/footer.jpg";
export const REPORT_FOOTER_BANNER = footerBanner;
```

**Geometría.** `Page size="LETTER"` = 612 × 792 pt. Ratio del asset 1945/267 = 7.285 → a 612 pt
de ancho la banda mide **84 pt** de alto.
```ts
footerBanner: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 84,
  objectFit: 'cover',
}
```
En este documento el posicionamiento absoluto es **relativo al borde de página**, no al área de
contenido: `styles.pageNumber` (línea ~312) ya usa `right: 40` con `page.padding: 40`, y si
fuera relativo al contenido el número quedaría a 80 pt del borde. Por eso la banda va a sangre
con `left/right/bottom: 0`, sin desplazamientos negativos. **Confirmar visualmente** en la
primera generación y ajustar si el render contradice esta lectura.

**Ajustes que la acompañan:**
| Estilo | Hoy | Nuevo | Motivo |
|---|---|---|---|
| `styles.page` | `padding: 40` | `padding: 40` + `paddingBottom: 100` | 84 pt de banda + 16 pt de aire; el contenido no la pisa |
| `styles.pageNumber.bottom` | `20` | `92` | queda sobre la banda, no debajo |

**Render**, como último hijo del `<Page>`, con `fixed` para repetirse en todas las páginas
(mismo mecanismo que `pageNumber`, líneas ~126-130):
```tsx
<Image src={REPORT_FOOTER_BANNER} style={styles.footerBanner} fixed />
```
El bloque de firma del docente (`styles.footer`, líneas ~118-124) es contenido en flujo y no
cambia.

## Notas
- El timeout de 30 s es un margen, no una solución. La causa raíz —un `GetObject` a R2 más 3
  lecturas a Mongo por cada apertura de informe, con la URL del escudo indexada por
  `valuationId`— se elimina en `RPT-06-pdf-asset-pipeline`. Cuando RPT-06 esté implementado,
  `usePdfShieldImage.ts` desaparece y su override de timeout con él.
- Sacar el toggle del sidebar del navbar es lo que hace innecesario un `IntersectionObserver` o
  un listener de scroll para "reaparecer" el botón: al no estar duplicado, puede ser fijo
  siempre que el sidebar esté cerrado.
- Las tres skills de diseño obligatorias de `quartz-web/CLAUDE.md` (`emil-design-eng`,
  `impeccable`, `frontend-design`) se invocan antes de escribir el `Select` y el botón flotante.

## Verificación
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en `quartz-web` (5173) y `quartz-api` (4000): cero errores en consola.
- Manual en `/evaluacion/:studentId/carta-comunicativa/:valuationId` con una dimensión que tenga
  2+ conceptos del mismo periodo, dimensión y nivel.

## Ajuste posterior 1 — Márgenes del PDF (1cm)

`CommunicativeLetterDocument.tsx`: dos constantes de módulo antes de `StyleSheet.create`:
```ts
const ONE_CM = 28.35; // 72pt/in ÷ 2.54cm/in
const FOOTER_HEIGHT = 84; // banda a ancho completo (612pt), footer.jpg 1400×192
```
- `styles.page`: `padding: 40` → `paddingTop/Left/Right: ONE_CM`, `paddingBottom: FOOTER_HEIGHT + ONE_CM`
  (el margen inferior del **contenido** queda 1cm por encima de la banda, que sigue a sangre,
  sin margen propio — es decorativa, no cuenta como área de contenido).
- `styles.pageNumber`: `bottom: FOOTER_HEIGHT + ONE_CM` (mismo nivel que el margen inferior del
  contenido — 1cm sobre la banda), `right: ONE_CM` (antes `40`).
- `styles.footerBanner`: sin cambios (`bottom/left/right: 0`, `height: FOOTER_HEIGHT`) — sigue a
  sangre, el ajuste de márgenes no la afecta.
- Verificado generando un PDF de prueba en Node (esbuild + `@react-pdf/renderer`, sin browser) e
  inspeccionando el content stream: la traslación de contenido tras el flip de página es
  `1 0 0 1 28.35 28.35 cm` — confirma paddingLeft/paddingTop = 1cm exacto.

## Ajuste posterior 2 — Salto vertical en ProfileNavbar al alternar el sidebar

Causa: `ProfileNavbar.tsx`, la fila `flex items-center` no tenía altura fija. `InstitutionBrand`
(avatar `h-11` = 44px) se monta solo con el sidebar cerrado; `UserMenu` (`Avatar size="sm"` ≈
36px + `py-0.5` del botón ≈ 40px) es más bajo. Al montar/desmontar `InstitutionBrand`, el alto
de la fila cambiaba entre ~40px (sidebar abierto, solo `UserMenu`) y ~44px (cerrado, ambos), y
por `items-center` el hijo más corto (`UserMenu`) se recentraba en cada cambio — el usuario y el
nombre de la institución "bajaban"/"subían" ~2px cada vez que se alternaba el sidebar.

Fix: `min-h-11` (44px, el alto del hijo más alto) en la fila, para que su altura sea constante
en ambos estados y nada se recentre.

## Verificación (ajustes posteriores)
- `cd quartz-web && npm run build && npm run lint` — repetido en verde, mismo baseline.
- Render de PDF de prueba en Node + inspección del content stream (ver arriba) — sin browser.
- Fix de `ProfileNavbar` verificado por lectura/cálculo de alturas (avatares, paddings), no en
  navegador — pendiente de confirmación visual por el usuario.
