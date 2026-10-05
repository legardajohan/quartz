# Incidentes conocidos — quartz-web

Registro puntual de bugs no obvios encontrados en el frontend, para no repetirlos en
futuras implementaciones. No es un changelog: solo entran aquí defectos cuya causa no
se deduce mirando el código a simple vista.

---

## `FormModal` scrollable recorta el listbox del `Select` de Material Tailwind

**Fecha:** 2026-09 · **Componentes afectados:** `ChecklistCreateForm.tsx` (modal «Nueva Plantilla»)
**Síntoma:** al abrir el `Select` de «Período académico» dentro del modal «Nueva Plantilla»
(`/academico/lista-chequeo`), la primera o la última opción quedaban ocultas — recortadas por
el borde del modal, no fuera de la ventana del navegador.

**Causa raíz:** `FormModal` envuelve su contenido en un `DialogBody` con
`max-h-[70vh] overflow-y-auto` cuando `scrollable` (su valor por defecto es `true`) está
activo (`FormModal.tsx:41`). El listbox que `Select` de Material Tailwind despliega no se
porta a un overlay independiente: se monta dentro de ese mismo `DialogBody`, así que cualquier
parte que sobresalga de los `70vh` la recorta el `overflow-y-auto` del contenedor padre, exista
o no espacio libre en la pantalla.

**Fix aplicado:** `scrollable={false}` en el `FormModal` de crear (`ChecklistsPage.tsx`) —el
formulario son tres campos, no necesita scroll propio— más `menuProps={{ placement: "bottom" }}`
en los `Select` de `ChecklistCreateForm.tsx`, con `className: "max-h-[60vh] overflow-y-auto"`
en el de Período académico para que el propio menú tenga scroll si la institución acumula
muchos periodos.

**Regla general para el resto del proyecto:** cualquier `FormModal` que contenga un `Select`
debe llevar `scrollable={false}` (si el formulario cabe sin scroll) o darle al `Select` su
propio `menuProps={{ className: "max-h-[Nvh] overflow-y-auto" }}` — nunca depender del scroll
del `DialogBody` para contener el menú de un hijo. Ya resuelto así en `SubjectsPanel.tsx` y
`SchoolsPanel.tsx` (commit `dbe601d`) y en el `Select` de jornada de `UserForm.tsx`
(`specs/ACAD-04-schools-and-shifts/plan.md`, nota 5).

---

## Material Tailwind: el ripple de `Button`/`IconButton` rompe `position` con estilos inline

**Fecha:** 2026-09 · **Componentes afectados:** `Dashboard.tsx`, `SidebarMenu.tsx`
**Síntoma:** al hacer clic por primera vez en un botón, este "saltaba" unos píxeles o
dejaba de comportarse como flotante; el contenido de la página (el header con el nombre
de la institución y el usuario) se corría hacia abajo. Pasaba una sola vez por botón —
después del primer clic quedaba "estable" (mal, pero estable).

**Causa raíz:** `@material-tailwind/react` usa la librería `material-ripple-effects`
para el efecto de onda al hacer clic en `Button`/`IconButton` (activo por defecto,
`ripple: true`). Su función `create()` corre en cada `mousedown` y hace esto, **sin
revertirlo nunca**:

```js
// node_modules/material-ripple-effects/index.js
create(event, color) {
  const element = event.currentTarget;
  element.style.position = 'relative';   // <- inline, permanente
  element.style.overflow = 'hidden';      // <- inline, permanente
  ...
}
```

Un estilo puesto así (`element.style.x = ...`, vía DOM API) es **inline** y gana
siempre sobre cualquier clase de Tailwind (`fixed`, `absolute`, `sticky`, ...), sin
importar especificidad. Si el botón dependía de esa clase de posición para su propio
layout (no solo como contenedor del ripple), la rompe para siempre en cuanto el usuario
lo toca por primera vez.

En este proyecto rompía:
- El botón "Abrir menú" (`fixed top-4 left-4` en `Dashboard.tsx`): perdía `fixed`, pasaba
  a ocupar espacio real en el flujo del documento y empujaba el header hacia abajo.
- El botón de colapsar sidebar (`absolute top-1/2 right-0...` en `SidebarMenu.tsx`):
  perdía `absolute`, pasaba a ser un item más de la fila flex y la ensanchaba.

**Fix aplicado:** `ripple={false}` en esos dos `IconButton` puntuales.

**Regla general para el resto del proyecto:** cualquier `Button`/`IconButton` de
Material Tailwind cuyas clases de Tailwind incluyan `fixed`, `absolute` o `sticky`
para su **propio** posicionamiento (no solo `relative` como contenedor de otra cosa)
**debe** llevar `ripple={false}`. Si el botón es un elemento normal de flujo (la
mayoría: botones dentro de formularios, tablas, listas), el ripple es inofensivo y
puede dejarse activo.

**Cómo se diagnosticó:** los síntomas visuales (desalineaciones que aparecían "solo a
veces", sin errores de consola) llevaron por dos iteraciones a intentar arreglos de CSS
(alturas fijas, `will-change-transform`) que no atacaban la causa real. Se confirmó
inspeccionando en vivo con DevTools (`getAttribute('style')` sobre el botón después de
un clic) hasta encontrar el `style="position: relative; overflow: hidden;"` inyectado.
Moraleja: ante un salto de layout "solo la primera vez que se interactúa con un
elemento, nunca más después", sospechar de una librería que muta el DOM directamente
por fuera de React (ripples, tooltips, medidores de texto), no solo de las clases CSS
declaradas.

---

## react-pdf: `PDFViewer` y `PDFDownloadLink` generan el PDF cada uno por su cuenta

**Fecha:** 2026-09 · **Componentes afectados:** `ChecklistReportModal.tsx`, `CommunicativeLetterModal.tsx`
**Síntoma:** abrir la vista previa de la **Lista de Chequeo** tardaba varios segundos con la
interfaz congelada, mientras la **Carta Comunicativa** salía casi instantánea — pese a que la
Carta es la que lleva más imágenes (un icono de estado por dimensión, más la banda de footer) y
a que ambas comparten exactamente las mismas optimizaciones de datos (RPT-06/RPT-07: escudo
cacheado por sesión, assets en base64, `buildReportContexts` con un número constante de
consultas).

**Causa raíz — dos partes.**

**1) El documento se renderizaba dos veces.** En `@react-pdf/renderer@4`, `PDFViewer` y
`PDFDownloadLink` no son componentes "de presentación": cada uno monta **su propio** `usePDF`
por dentro, y `usePDF` genera el PDF completo.

```js
// node_modules/@react-pdf/renderer/lib/react-pdf.browser.js
const PDFViewer = ({ children, showToolbar = true, ...props }) => {
  const [instance, updateInstance] = usePDF();
  useEffect(() => updateInstance(children), [children]);   // ← reacciona a la IDENTIDAD del elemento
  const src = instance.url ? `${instance.url}#toolbar=${showToolbar ? 1 : 0}` : null;
  return <iframe src={src} ... />;
};

const PDFDownloadLinkBase = ({ fileName, document: doc, ... }) => {
  const [instance, updateInstance] = usePDF();             // ← segunda instancia, segundo render
  useEffect(() => updateInstance(doc), [doc]);
  return <a href={instance.url} download={fileName} ... />;
};
```

Tener los dos en el mismo modal (uno para la vista previa, otro para el botón "Descargar PDF")
significa generar el mismo PDF **dos veces, en paralelo y en el hilo principal**. Y como el
elemento `<XDocument ... />` se creaba inline en el JSX, cada re-render del modal cambiaba su
identidad y disparaba un render más.

**2) El documento de Lista de Chequeo es intrínsecamente mucho más caro.** La Carta son ~7
párrafos (1–2 páginas); la Lista es una fila por aprendizaje × 7 dimensiones (4–6 páginas). El
coste de `resolvePagination` en `@react-pdf/layout` crece más que linealmente: `splitPage` hace
`relayoutPage` del árbol restante dos veces por página, más una tercera por `resolveDynamicPage`
(por el `<Text render={...}>` del número de página), y `resolvePageIndices` vuelve a relayoutar
cada página al final. Medido con `renderToBuffer` en Node (sin red, 5 corridas):

| Aprendizajes por dimensión | Lista de Chequeo | Carta Comunicativa | Ratio |
|---|---|---|---|
| 5  | 379 ms  | 159 ms | 2,4× |
| 10 | 547 ms  | 170 ms | 3,2× |
| 15 | 822 ms  | 140 ms | 5,9× |
| 20 | 1 173 ms | 178 ms | 6,6× |
| 30 | 1 835 ms | 171 ms | 10,7× |

O sea: el doble render convertía ~0,8 s en ~1,6 s de hilo principal bloqueado en un caso normal,
y ~3,7 s en uno grande.

**Fix aplicado:** hook `useReportPdf` (`src/features/report/useReportPdf.ts`) — un **único**
render cuyo blob alimenta tanto la vista previa (`<iframe src={url + "#toolbar=0"}>`, que es
literalmente lo que hace `PDFViewer` por dentro) como la descarga (`<a href={url} download>`
envolviendo el `Button` de Material Tailwind, que es lo que hacía `PDFDownloadLink`). El
elemento del documento va en `useMemo`, y los modales leen el store de Zustand con selectores
puntuales en vez de suscribirse al store completo.

### Trampa al implementarlo: `usePDF` tiene estado GLOBAL de módulo

El primer intento de fix usaba `usePDF` directamente en el hook. Reventó con
`Objects are not valid as a React child (found: [object Error])` al abrir la Lista de Chequeo.
Dos defectos encadenados, ambos por diseño de `@react-pdf/renderer`:

**1) Los listeners de `change` viven en un singleton del módulo, no en la instancia.**

```js
// node_modules/@react-pdf/renderer/lib/react-pdf.browser.js
const events = {};                       // ← GLOBAL, compartido por TODAS las instancias
const pdf = initialValue => {
  const onChange = () => {
    const listeners = events.change?.slice() || [];
    for (let i = 0; i < listeners.length; i += 1) listeners[i]();   // ← notifica a TODAS
  };
  const container = { type: 'ROOT', document: null };
  renderer = renderer || createRenderer({ onChange });               // ← renderer también global
  ...
};

const render = async function (compress) {
  const props = container.document.props || {};    // ← TypeError si el contenedor está vacío
  ...
};
```

Cada `usePDF` montado añade su `queueDocumentRender` a ese `events.change` común, y **crea su
instancia de `pdf()` al montar, tenga documento o no**. `IndividualReportsPanel` monta los dos
modales de informe siempre (con `open={...}`), así que había permanentemente dos instancias. Al
renderizar la Lista de Chequeo, el commit notificaba también a la instancia ociosa del modal de
la Carta, cuyo `container.document` seguía siendo `null` → `TypeError` dentro de su cola de
render.

Con `PDFViewer`/`PDFDownloadLink` esto no ocurría porque iban detrás de `{isPdfReady && ...}`:
nunca existía una instancia sin documento.

**2) `UsePDFInstance.error` está mal tipado.** El `.d.ts` declara `error: string | null`, pero
`onRenderFailed` guarda el `Error` tal cual. Al pintarlo en un `<Typography>` React tira
"Objects are not valid as a React child" y se lleva por delante la ruta entera — el error real
queda enterrado bajo el del ErrorBoundary.

**Solución:** `useReportPdf` **no** usa `usePDF`. Construye sobre `pdf(document).toBlob()`, que
no registra ningún listener y solo se instancia cuando hay algo que renderizar — el mismo
primitivo que ya usaba `useBulkReportDownload`. El hook normaliza el error a `string` y compara
el documento renderizado por identidad, de modo que la vista previa nunca muestra el PDF del
estudiante anterior mientras se genera el nuevo.

**Lo que NO era la causa (descartado midiendo, no razonando):**
- El `fixed` en flujo de la cabecera de tabla (`ChecklistReportPages.tsx`, repite la cabecera al
  partir página): quitarlo no cambió nada (922 ms vs 822 ms a 15 aprendizajes — ruido). Se dejó.
- Los `<Image>` del PDF: son data-URI constantes de módulo, react-pdf los cachea por `src` y los
  decodifica una sola vez por render. La Carta tiene más y es la rápida.
- La numeración dinámica de página sí cuesta ~25 %, pero es una funcionalidad requerida, no un
  defecto.

**Reglas generales:**
- No montar `PDFViewer` y `PDFDownloadLink` sobre el mismo documento. Si hace falta previsualizar
  y descargar a la vez, usar `useReportPdf`: genera el blob una sola vez y reparte la URL.
- Evitar `usePDF` en componentes que están montados permanentemente (modales con `open`, paneles
  de pestañas): crea su instancia al montar aunque no haya documento, y esa instancia vacía
  revienta cuando cualquier otra parte de la app renderiza un PDF.
- Memoizar siempre el elemento `<Document>`: el render se dispara por identidad, no por contenido.
