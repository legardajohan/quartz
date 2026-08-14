---
id: RPT-04-letter-concept-snapshot-and-status-icons
feature: letter-concept-snapshot-and-status-icons
status: implemented
created: 2026-08-13
---

# RPT-04 — Snapshot de concepto + iconografía de estado en Carta Comunicativa (spec)

## Objetivo
Congelar en el momento de asignación el texto del concepto que se imprime en la Carta
Comunicativa de un estudiante (para que ediciones posteriores al banco de `Concept` no alteren
cartas ya guardadas), permitir editar ese texto libremente por dimensión desde `/Evaluación`, y
reemplazar el badge de estado por un panel visual con ícono por dimensión (SVG en web, JPG en
PDF). Refinamiento sobre RPT-03 (ya implementado), misma rama.

## Alcance
**Incluye:**
- Nuevo campo `assignedConceptText` (snapshot) en `IValuationBySubject`, persistido junto a
  `assignedConceptId`, tanto en la auto-asignación (`updateStudentValuation`) como en la
  selección manual (`updateValuationConcepts`).
- `getCommunicativeLetterReport` deja de recalcular `conceptText` en vivo desde el banco de
  `Concept`; usa el snapshot persistido salvo que la asignación ya no sea válida (concepto
  eliminado o nivel recalculado), caso en el que recae en el primer candidato vigente (mismo
  comportamiento de *fallback* que ya existe hoy).
- En `CommunicativeLetterEditPage` (`/evaluación/:studentId/carta-comunicativa/:valuationId`),
  por dimensión de tipo `checklist`:
  - El `Select` desplegable de conceptos candidatos se muestra **solo** cuando hay 2+
    candidatos para el mismo periodo+dimensión+estado (regla ya existente de RPT-03, sin
    cambios).
  - Un ícono Lucide `SquarePen` habilita edición libre del texto del concepto asignado
    (`Textarea`); al confirmarse, ese texto (no el original del banco) es lo que se guarda como
    snapshot. Cambiar la selección del `Select` reinicia el texto editable a la descripción
    vigente del nuevo concepto elegido.
  - El badge de estado (punto + texto: Logrado/En proceso/Con dificultad), que hoy vive arriba
    de la tarjeta de concepto, se traslada a una caja nueva a la derecha de cada fila
    (proporción menor que la tarjeta de concepto): ícono SVG arriba, punto + texto de estado
    abajo. La tarjeta de concepto (izquierda) queda solo con el nombre de la dimensión, el
    `SquarePen`, el texto/`Select`.
- En el PDF de Carta Comunicativa (`CommunicativeLetterDocument.tsx`, consumido desde
  `/Informes` y desde la descarga en `/Evaluación`… — ver Fuera): ícono de estado en JPG por
  dimensión (mismo mapeo Logrado/En proceso/Con dificultad), reutilizando el mismo recurso
  importado para todas las dimensiones que compartan estado (sin recargar por ocurrencia).
  Elimina el párrafo introductorio ("A continuación se presenta el desempeño de…").
- Los 6 archivos de íconos (3 SVG + 3 JPG) ya existen en
  `quartz-web/src/assets/images/{achieved,in-process,with-dificulty}-icon.{svg,jpg}` — no se
  crean assets nuevos, solo se referencian.

**Fuera:**
- `CommunicativeLetterEditPage` no genera PDF (eso ya quedó resuelto en RPT-03: sin
  `PDFViewer`/`PDFDownloadLink` en esa vista). El ícono JPG del PDF solo aplica al documento
  consumido desde `CommunicativeLetterModal.tsx` (`/Informes`).
- Edición de `performanceDescription` (subjects en modo `description`) — no tienen concepto ni
  estado cualitativo, quedan sin cambios.
- Cambios al modelo `Concept` (banco de conceptos) — sigue siendo la fuente de candidatos
  vigentes para el `Select`; solo cambia qué se persiste como snapshot al asignar.
- Migración de datos históricos: valuaciones ya evaluadas antes de este spec no tienen
  `assignedConceptText`; se resuelven por el mismo *fallback* a candidato vigente que ya existe
  hoy (ver criterio EARS de *fallback*), sin backfill masivo.

## Criterios de aceptación (EARS)
- [x] Cuando `updateStudentValuation` auto-asigna un nuevo `Concept` por defecto a una
      dimensión (porque no había asignación previa válida), el sistema guarda también
      `assignedConceptText` con la descripción vigente de ese concepto en ese momento.
- [x] Cuando el Jefe de Área/Docente guarda cambios en `CommunicativeLetterEditPage`, el
      sistema persiste, por cada dimensión `checklist`, tanto `assignedConceptId` como
      `assignedConceptText` con el texto que el usuario vio/editó (no un recálculo del backend).
- [x] Si posteriormente se edita la `description` de un `Concept` en el banco (`/academico/conceptos`),
      las cartas comunicativas ya generadas para valuaciones con `assignedConceptText` guardado
      siguen mostrando el texto snapshot, no el texto editado del banco.
- [x] Si la asignación persistida ya no corresponde a un candidato vigente para el periodo +
      dimensión + nivel recalculado (concepto eliminado o cambio de nivel), el sistema recae en
      el primer candidato vigente y su descripción en vivo (comportamiento ya existente, sin
      persistir ese fallback hasta que el usuario guarde explícitamente).
- [x] Cuando una dimensión `checklist` tiene 2+ `Concept` candidatos para el mismo
      periodo+estado, el sistema muestra el `Select` desplegable (sin cambios respecto a RPT-03).
      Si tiene 1 candidato, no se muestra `Select`.
- [x] Cuando el usuario hace clic en el ícono `SquarePen` de una dimensión `checklist`, el
      sistema habilita un campo de texto editable con el contenido actual del concepto asignado.
- [x] Cuando el usuario cambia la selección del `Select` de una dimensión, el sistema reemplaza
      el texto editable por la descripción vigente del concepto recién elegido.
- [x] Si el usuario intenta guardar un texto de concepto vacío, el sistema rechaza el guardado
      (validación `min(1)` tras `trim`) con mensaje claro.
- [x] Cuando se ve `CommunicativeLetterEditPage`, el sistema muestra, a la derecha de cada
      dimensión `checklist`, una caja con el ícono SVG de estado (Logrado/En proceso/Con
      dificultad) arriba y el punto + texto de estado abajo; ese badge ya no aparece en la
      tarjeta de concepto.
- [x] Cuando se genera el PDF de Carta Comunicativa, el sistema incluye el ícono JPG de estado
      correspondiente a cada dimensión `checklist`, reutilizando el mismo recurso importado para
      todas las dimensiones que compartan el mismo estado (una sola importación estática por
      estado, referenciada N veces).
- [x] El PDF de Carta Comunicativa ya no incluye el párrafo introductorio ("A continuación se
      presenta el desempeño de…").
- [x] **Aislamiento:** sin cambios de superficie — `updateValuationConcepts` sigue resolviendo
      `institutionId` desde el token; ninguna operación nueva acepta `institutionId` de
      `body`/`params`.
- [x] `npx tsc --noEmit` en verde en `quartz-api` · `npm run build && npm run lint` en verde en
      `quartz-web`.

> Pendiente de verificación manual en navegador con datos reales (sin acceso a browser tooling
> en esta sesión): los cinco flujos end-to-end de `tasks.md` §Verificación final. El código
> cubre los criterios anteriores; falta la confirmación visual/interactiva.

## Dependencias
- RPT-03-communicative-letter-ux (implementado): `CommunicativeLetterEditPage.tsx`,
  `LetterConceptPicker.tsx`, `CommunicativeLetterModal.tsx` (solo-PDF), `CommunicativeLetterDocument.tsx`.
- RPT-02-communicative-letter (implementado): modelo `Concept`, endpoint `PATCH
  /student-valuations/:valuationId/concepts`, auto-asignación en `updateStudentValuation`.

## Trazabilidad
- Backend:  quartz-api/src/features/student-valuation/, quartz-api/src/features/report/
- Frontend: quartz-web/src/features/report/
- Branch:   feat/RPT-02-communicative-letter (continúa sobre la rama actual, sin rama nueva)
