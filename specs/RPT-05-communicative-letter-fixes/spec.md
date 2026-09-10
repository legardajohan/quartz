---
id: RPT-05-communicative-letter-fixes
feature: communicative-letter-fixes
status: implemented
created: 2026-09-08
---

# RPT-05 — Correcciones de la Carta Comunicativa (spec)

## Objetivo
Corregir cuatro defectos abiertos en el flujo de Carta Comunicativa: el timeout crudo al
generar el PDF, la barra de perfil que queda fija al hacer scroll, el `Select` de conceptos que
rompe su caja cuando hay 2+ candidatos, y la ausencia de la banda institucional al pie del PDF.
Solo `quartz-web`; sin superficie de backend.

## Alcance
**Incluye:**
- **Timeout.** `apiClient.ts` exporta `REPORT_REQUEST_TIMEOUT_MS = 30000`, aplicado por `config`
  en las lecturas de informe (`useReportStore.ts`, `usePdfShieldImage.ts`). El `timeout: 10000`
  global del cliente axios no se toca. `extractErrorMessage` traduce `err.code === 'ECONNABORTED'`
  a un mensaje en español (hoy el usuario ve el texto crudo `timeout of 10000ms exceeded`).
- **Barra de perfil.** `ProfileNavbar` pierde `sticky top-0 z-10` y se desplaza con el scroll.
  Para no perder el acceso al menú, el `IconButton` de `PanelLeftOpen` sale del navbar y pasa a
  `Dashboard` como botón flotante, visible solo cuando el sidebar está cerrado.
  - **Ajuste posterior:** al colapsar/mostrar el sidebar, `InstitutionBrand` (44px de alto) se
    monta/desmonta dentro de la fila `flex items-center` de `ProfileNavbar`; sin una altura fija
    en esa fila, `UserMenu` (~40px) se recentraba verticalmente cada vez que cambiaba el alto de
    la fila, dando la sensación de que el usuario y el nombre de la institución "bajaban" al
    alternar el sidebar. Fix: `min-h-11` (44px, el alto del hijo más alto) en la fila para que su
    altura no cambie entre ambos estados.
- **`Select` de conceptos** en `LetterConceptPicker` (dimensiones `checklist` con 2+ candidatos):
  - `key` de remount en el `Select`, replicando el patrón que ya usan todos los demás `Select`
    del repo (`ConceptForm.tsx:66,81`, `LearningForm.tsx:53,68`, `ChecklistCreateForm.tsx:40`).
  - El trigger deja de renderizar la descripción completa del concepto (hasta 2000 chars): pasa
    a una etiqueta de una línea vía la prop `selected` de `Select`. Las `Option` muestran la
    descripción acotada a 2 líneas dentro de un menú con alto máximo y scroll propio.
  - La descripción íntegra sigue viviendo **solo** en el cuerpo de la tarjeta, que es la fuente
    de verdad editable (snapshot de RPT-04).
- **Footer del PDF.** `assets/images/footer.jpg` se reoptimiza y se pinta como banda al pie de
  **cada** página del PDF de Carta Comunicativa, con los paddings de página y la posición del
  número de página ajustados para que nada se solape.
  - **Ajuste posterior — márgenes del documento.** Márgenes izquierdo, derecho y superior del
    contenido a 1cm (28.35pt) exactos; el margen inferior del contenido queda a 1cm **por
    encima de la banda de footer** (no del borde de página — la banda es decorativa y a sangre,
    fuera del área de margen). El número de página se reubica al mismo nivel que ese margen
    inferior (1cm sobre la banda) y a 1cm del borde derecho, manteniendo la alineación a la
    derecha que ya tenía.

**Fuera:**
- La causa raíz del timeout (descarga del escudo por `valuationId`, un `GetObject` a R2 por
  apertura) — va en `RPT-06-pdf-asset-pipeline`. Aquí solo se sube el margen y se traduce el
  mensaje.
- Los 9 assets sin trackear `{achieved,in-process,with-dificulty}-icon-0{1,2,3}.jpg`: se sigue
  usando el set sin sufijo referenciado por `statusVisuals.ts`.
- Footer en la página web de edición: la banda va **solo** al PDF.
- Cambios de backend, del modelo `Concept`, o del endpoint `PATCH /student-valuations/:id/concepts`.
- La regla de RPT-04 de mostrar `Select` solo con 2+ candidatos: se conserva sin cambios.

## Criterios de aceptación (EARS)
- [x] Cuando una lectura de informe (`/reports/communicative-letter/:id`, `/reports/checklist/:id`
      o el escudo) excede `REPORT_REQUEST_TIMEOUT_MS`, el sistema muestra un mensaje en español
      y no el texto de axios `timeout of 10000ms exceeded`.
- [x] Cuando una petición que no es de informe excede el timeout, el sistema conserva el
      comportamiento actual (`timeout: 10000` global sin cambios).
- [x] Cuando el usuario hace scroll en cualquier pantalla del `Dashboard`, la barra de perfil
      (avatar + nombre del usuario) se desplaza hacia arriba hasta ocultarse.
- [x] Si el sidebar está cerrado, el sistema muestra un botón flotante de reapertura que
      permanece accesible en cualquier posición de scroll.
- [x] Si el sidebar está abierto, el sistema no muestra el botón flotante.
- [x] Cuando una dimensión `checklist` tiene 2+ conceptos candidatos, el trigger del `Select`
      muestra una etiqueta de una sola línea y la tarjeta conserva su altura, sea cual sea el
      largo de las descripciones.
- [x] Cuando el usuario despliega el `Select`, el sistema muestra cada descripción acotada a 2
      líneas, dentro de un menú con alto máximo y scroll propio.
- [x] Cuando el usuario elige otra opción del `Select`, el sistema reemplaza la descripción del
      cuerpo de la tarjeta por la del concepto elegido (comportamiento de RPT-04, sin cambios).
- [x] Cuando el usuario guarda y el sistema refetchea la carta, el `Select` refleja la selección
      persistida y no queda con la etiqueta anterior.
- [x] Si una dimensión `checklist` tiene exactamente 1 candidato, el sistema no muestra `Select`
      (regla de RPT-04, sin cambios).
- [x] Cuando se genera el PDF de Carta Comunicativa, cada página incluye la banda `footer.jpg`
      al pie, sin solapar el contenido de las dimensiones ni el número de página.
- [x] `assets/images/footer.jpg` pesa ≤ 60 KB tras la reoptimización. (27.2 KB)
- [x] Los márgenes izquierdo, derecho y superior del contenido del PDF son 1cm exactos; el
      margen inferior del contenido es 1cm por encima de la banda de footer (no del borde de
      página). El número de página queda sobre la banda, a 1cm del margen inferior y 1cm del
      borde derecho, alineado a la derecha.
- [x] Cuando el usuario colapsa o muestra el sidebar, ni el avatar+nombre del usuario ni el
      nombre de la institución en `ProfileNavbar` cambian de posición vertical.
- [x] **Aislamiento:** RPT-05 no añade ni modifica endpoints, servicios ni queries de backend;
      ninguna operación nueva toca `institutionId`.
- [x] `npm run build && npm run lint` en verde en `quartz-web` (sin errores nuevos respecto a la
      rama actual).

> **Verificación manual en navegador (a cargo del usuario, ver `quartz-web/CLAUDE.md` §
> Verificación):** el código cubre los criterios anteriores y fue verificado por lectura,
> `tsc`/`build`/`lint` en verde, y —para la geometría del PDF— render en Node con datos
> simulados más análisis geométrico del content stream del PDF resultante (banda a 84pt del
> pie, ancho completo, en ambas páginas). Un solo dato queda sin confirmar por esta vía: el
> clic del botón flotante para **reabrir** el sidebar no mostró cambio en la única captura
> tomada antes de suspender la verificación en navegador — revisar al probar manualmente.

## Dependencias
- RPT-04-letter-concept-snapshot-and-status-icons (implementado): `LetterConceptPicker.tsx`,
  `statusVisuals.ts`, `assignedConceptText`.
- RPT-03-communicative-letter-ux (implementado): `CommunicativeLetterEditPage.tsx`,
  `CommunicativeLetterModal.tsx` (solo-PDF), `CommunicativeLetterDocument.tsx`.
- `assets/images/footer.jpg` ya presente en el árbol (sin trackear, sin referenciar).

## Trazabilidad
- Backend:  (ninguno)
- Frontend: quartz-web/src/features/report/ · quartz-web/src/components/layouts/ · quartz-web/src/api/
- Branch:   feat/RPT-02-communicative-letter (continúa sobre la rama actual, sin rama nueva)
