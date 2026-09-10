# RPT-05 — Tasks

## Backend (`quartz-api`)
Sin cambios en este spec.

## Frontend (`quartz-web`)

### 1. Timeout de informes
- [x] `src/api/apiClient.ts` — exportar `REPORT_REQUEST_TIMEOUT_MS = 30000`; no tocar el
      `timeout: 10000` de `axios.create` (línea 10).
- [x] `src/api/apiClient.ts` — en `extractErrorMessage`, rama `err.code === 'ECONNABORTED'`
      antes de leer `response.data.message`, devolviendo el mensaje en español.
- [x] `src/features/report/useReportStore.ts` — pasar `{ timeout: REPORT_REQUEST_TIMEOUT_MS }` a
      los tres `apiGet` de informe (`fetchChecklistReport`, `fetchCommunicativeLetter` y el
      refetch de `saveLetterConcepts`). No tocar `fetchLetterAvailability`.
- [x] `src/features/report/usePdfShieldImage.ts` — añadir la clave al config existente
      `{ responseType: "blob" }`.

### 2. Barra de perfil y toggle del sidebar
- [x] `src/components/layouts/ProfileNavbar.tsx` — quitar `sticky top-0 z-10`.
- [x] `src/components/layouts/ProfileNavbar.tsx` — eliminar el `IconButton` de `PanelLeftOpen`
      y sus imports; reducir `ProfileNavbarProps` a `{ isSidebarOpen: boolean }`; añadir `pl-14`
      al contenedor cuando el sidebar esté cerrado.
- [x] `src/components/layouts/Dashboard.tsx` — botón flotante `fixed top-4 left-4 z-30` visible
      solo con `!isSidebarOpen`, montado **fuera** del `<main isolate>`; ajustar el `<ProfileNavbar>`
      a su nueva firma.

### 3. `Select` de conceptos
- [x] Invocar las skills `emil-design-eng`, `impeccable` y `frontend-design`. Se hizo como
      revisión posterior al código (no antes de escribir); `emil-design-eng` señaló que el botón
      flotante del sidebar (tarea 2) aparecía/desaparecía de golpe por montaje condicional —
      se corrigió a render permanente con `opacity`/`scale`/`pointer-events` transicionados
      (200ms ease-out), reutilizando el mismo patrón que ya usa la barra flotante de guardado en
      `CommunicativeLetterEditPage.tsx`. `frontend-design` no señaló cambios (el uppercase de
      "Opción N" replica la convención ya existente en el mismo archivo).
- [x] `src/features/report/components/LetterConceptPicker.tsx` — `key` de remount en el `Select`
      (`subjectId | nº candidatos | selectedId`).
- [x] Mismo archivo — prop `selected` devolviendo `Opción N de M`; `menuProps` con
      `max-h-72 overflow-y-auto`.
- [x] Mismo archivo — `<Option>` con `Opción N` en negrita + descripción con `line-clamp-2`
      (Tailwind 3.4.17 del proyecto ya la incluye nativa, sin plugin adicional).
- [x] Mismo archivo — hint `{n} opciones para este periodo, dimensión y estado` bajo el `Select`.
- [x] Mismo archivo — transición al cambiar de concepto: en vez de `transition-opacity` (inerte
      en un remount por `key`), se agregó una animación `@keyframes fade-in` +
      `.animate-fade-in` en `src/index.css` (mismo lugar que otras utilidades globales del
      proyecto) y se aplicó junto con `key={text}` para que sí dispare en cada cambio.
- [x] Verificar que no se alteró la regla de RPT-04: sin `Select` con 1 solo candidato.

### 4. Footer del PDF
- [x] Reoptimizar `src/assets/images/footer.jpg` a 1400×192 · q72 · ≤ 60 KB (script puntual en
      el scratchpad con `sharp`); reemplazar el archivo en su ruta actual. Resultado: 27.2 KB.
- [x] `src/features/report/statusVisuals.ts` — importar y exportar `REPORT_FOOTER_BANNER`.
- [x] `src/features/report/components/CommunicativeLetterDocument.tsx` — estilo `footerBanner`
      (`absolute`, `bottom/left/right: 0`, `height: 84`, `objectFit: 'cover'`).
- [x] Mismo archivo — `styles.page.paddingBottom: 100` y `styles.pageNumber.bottom: 92`.
- [x] Mismo archivo — `<Image src={REPORT_FOOTER_BANNER} style={styles.footerBanner} fixed />`
      como último hijo del `<Page>`.
- [x] Generar un PDF de prueba y confirmar la lectura del posicionamiento absoluto: renderizado
      fuera de navegador (esbuild + `@react-pdf/renderer` en Node) con datos simulados,
      confirmado matemáticamente sobre el content stream del PDF — la banda ocupa exactamente
      los 84pt inferiores de la página, ancho completo, en las dos páginas generadas (`fixed`
      funciona), y el número de página queda por encima sin solape.

## Verificación final
- [x] `cd quartz-web && npm run build && npm run lint` en verde — mismos 4 errores/3 warnings
      preexistentes de `develop` (ninguno en archivos tocados por este spec), sin errores nuevos.
- [x] Servidor arranca sin errores de compilación ni runtime (confirmado con instancias propias
      de `quartz-api`/`quartz-web` antes de cerrarlas por duplicar los puertos 4000/5173 ya en
      uso por el usuario).
- [x] Manual — scroll en `/evaluacion`: la barra de perfil sube y se oculta (verificado).
- [ ] Manual — sidebar cerrado + scroll abajo: el botón flotante sigue accesible (confirmado) y
      reabre el menú (**sin confirmar** — un clic de reapertura no mostró cambio en la única
      captura tomada; verificar al probar).
- [x] Manual — sidebar abierto: no aparece el botón flotante (verificado).
- [ ] Manual — `/evaluacion/:studentId/carta-comunicativa/:valuationId` con 2+ candidatos: el
      trigger es de una línea, la tarjeta conserva su altura, el menú hace scroll. Pendiente —
      verificación de UI queda a cargo del usuario (ver `quartz-web/CLAUDE.md` § Verificación).
- [ ] Manual — cambiar de opción, guardar, y confirmar que tras el refetch el `Select` muestra
      la selección persistida (caso `key` de remount). Pendiente, a cargo del usuario.
- [ ] Manual — última dimensión (Ética): el menú no queda clipeado al abrir hacia arriba.
      Pendiente, a cargo del usuario.
- [x] Manual — PDF: banda al pie en **todas** las páginas, sin solapar dimensiones ni número de
      página (verificado por render Node + análisis geométrico del content stream, ver tarea 4).
- [ ] Manual — simular timeout (throttling o backend detenido): el mensaje mostrado es el texto
      en español, no `timeout of 10000ms exceeded`. Pendiente, a cargo del usuario.
- [x] Repaso de aislamiento: confirmado — el diff no toca `quartz-api` (`git status` solo lista
      archivos de `quartz-web`).

## Ajustes posteriores (pedidos tras la primera pasada)

- [x] `src/features/report/components/CommunicativeLetterDocument.tsx` — constantes `ONE_CM`
      (28.35pt) y `FOOTER_HEIGHT` (84pt); `styles.page` con márgenes 1cm en top/left/right y
      `paddingBottom: FOOTER_HEIGHT + ONE_CM`; `styles.pageNumber` con `bottom: FOOTER_HEIGHT +
      ONE_CM`, `right: ONE_CM`. Verificado generando un PDF en Node (esbuild + react-pdf, sin
      browser) y confirmando `1 0 0 1 28.35 28.35 cm` como traslación de contenido en el content
      stream.
- [x] `src/components/layouts/ProfileNavbar.tsx` — `min-h-11` en la fila `flex items-center`
      para fijar su altura y evitar que `UserMenu` se recentre (y "baje"/"suba") al montar o
      desmontar `InstitutionBrand` cuando se alterna el sidebar. Verificado por cálculo de
      alturas (avatares/paddings) leyendo el código — **pendiente de confirmación visual por el
      usuario**, no verificado en navegador.
- [x] `npm run build && npm run lint` repetido tras ambos ajustes — verde, mismo baseline.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
