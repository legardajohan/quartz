---
id: RPT-02-communicative-letter
feature: communicative-letter
status: draft
created: 2026-08-05
---

# RPT-02 — Carta Comunicativa (spec)

## Objetivo
Generar la **Carta Comunicativa** como PDF dinámico a partir de la Lista de Chequeo completa: el sistema asigna a cada dimensión el `Concept` que corresponde al nivel cualitativo obtenido, y el docente puede elegir entre los conceptos disponibles de ese mismo nivel antes de descargarla.

Cierra el puente `subjectPercentage → QualitativeValuation → Concept`, declarado en `docs/domain.md` §Concepto por dimensión y dejado explícitamente fuera de alcance por `VAL-03-description-mode` y `specs/reports.spec.md`.

## Alcance
**Incluye:**
- Escritura de `StudentValuation.valuationsBySubject[].assignedConceptId` por rango de `subjectPercentage` (umbrales de `docs/domain.md` §Concepto por dimensión).
- Endpoint dedicado para persistir la elección manual del concepto por dimensión.
- Agregado `getCommunicativeLetterReport` + endpoint de disponibilidad de conceptos por período.
- `CommunicativeLetterDocument.tsx` (PDF tamaño carta) y modal de edición con previsualización en vivo.
- Activación del icono de Carta Comunicativa en `/informes` (hoy placeholder deshabilitado) y nueva acción en la tabla de `/evaluacion`, ambas sujetas a `sessionData.enabledReports`.
- Sincronización de `docs/data-model.md` y `docs/data-base.md` §1.1, que afirman que `Concept` no tiene modelo en código.

**Fuera:**
- CRUD de `Concept` — ya implementado (`specs/concepts.spec.md`).
- Cambios en el PDF de Lista de Chequeo.
- Consolidados y generación masiva de la Carta por grupo o sede.
- Des-valorar un ítem desde la UI (limitación preexistente de `ValuationChecklist.tsx`: los radios no tienen opción de limpieza).

## Criterios de aceptación (EARS)

### Asignación del concepto
- [ ] Cuando el docente guarda `PATCH /api/student-valuations/:valuationId` y una dimensión en modo `checklist` tiene **todos** sus ítems valorados, el sistema deriva su nivel cualitativo del `subjectPercentage` y le asigna un `Concept` de su institución que coincida en `subjectId`, `periodId` y `valuationType`.
- [ ] Si existen varios `Concept` candidatos, el sistema asigna el más antiguo por `createdAt` como valor por defecto.
- [ ] Si la dimensión ya tenía `assignedConceptId` y ese concepto sigue perteneciendo a los candidatos del nivel derivado, el sistema **conserva** la elección; si el nivel cambió, la reemplaza por el nuevo valor por defecto.
- [ ] Si una dimensión en modo `checklist` tiene ítems sin valorar, el sistema deja su `assignedConceptId` sin definir.
- [ ] Si no existe ningún `Concept` para el nivel derivado, el sistema deja `assignedConceptId` sin definir y responde `200` sin fallar.
- [ ] Si una dimensión está en modo `description`, el sistema nunca le asigna `assignedConceptId` (invariante de `docs/data-base.md` §2.2).
- [ ] Cuando el docente envía `PATCH /api/student-valuations/:valuationId/concepts`, el sistema persiste la selección sólo si cada `conceptId` pertenece a su institución y coincide con el `subjectId`, el `periodId` y el nivel derivado de esa dimensión; en caso contrario responde `422`.
- [ ] Si la valoración no está en `Evaluado`, el sistema rechaza `PATCH /:valuationId/concepts` con `409`.

### Informe
- [ ] Cuando un Docente o Jefe de Área solicita `GET /api/reports/communicative-letter/:valuationId` y la valoración está en `Evaluado`, el sistema devuelve el agregado de la Carta con un bloque por dimensión.
- [ ] Si la valoración no está en `Evaluado`, el sistema responde `409`.
- [ ] Si alguna dimensión en modo `checklist` de esa valoración carece de al menos un `Concept` de `Logrado`, uno de `En proceso` y uno de `Con dificultad` para su período, el sistema responde `422` detallando la dimensión y los niveles faltantes.
- [ ] Cuando el bloque corresponde a una dimensión en modo `checklist`, el sistema devuelve el texto del concepto asignado y la lista de conceptos alternativos **del mismo nivel**.
- [ ] Cuando el bloque corresponde a una dimensión en modo `description`, el sistema imprime la `performanceDescription` que el docente escribió en la Lista de Chequeo, sin nivel ni conceptos alternativos.
- [ ] Si un Docente solicita la Carta de un estudiante fuera de su sede, el sistema responde `403`.
- [ ] Cuando el usuario solicita la disponibilidad de la Carta para un período, el sistema devuelve si hay cobertura de conceptos y, si no la hay, qué dimensiones y niveles faltan.

### Interfaz
- [ ] Cuando un usuario abre `/informes` o `/evaluacion`, el sistema habilita el icono de Carta Comunicativa sólo si la institución tiene `communicative-letter` en `enabledReports`, la valoración está en `Evaluado` y hay cobertura de conceptos; en cualquier otro caso lo muestra deshabilitado con el motivo en el tooltip.
- [ ] Cuando el usuario pulsa el icono habilitado, el sistema abre un modal con el panel de selección de concepto por dimensión y la vista previa del PDF.
- [ ] Cuando el usuario cambia la selección de un concepto, el sistema actualiza la vista previa sin recargar el informe.
- [ ] Cuando el usuario guarda la selección y vuelve a abrir la Carta, el sistema muestra los conceptos que eligió.
- [ ] Cuando el sistema no puede componer la Carta por falta de conceptos, el modal muestra las dimensiones y niveles faltantes en lugar de la vista previa.
- [ ] Cuando el usuario pulsa Descargar, el sistema produce el PDF en tamaño carta bajo demanda y nunca lo almacena.

### Transversales
- [ ] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [ ] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- `concepts` (implemented) — banco de `Concept` con `subjectId`, `periodId` y `valuationType`.
- `reports` (implemented) — agregado institucional, escudo desde R2 y el patrón `PDFViewer` / `PDFDownloadLink`.
- `VAL-03-description-mode` (implemented) — `evaluationMode` y `performanceDescription` por dimensión.
- `ACAD-04-schools-and-shifts` — rama base.

## Trazabilidad
- Backend:  quartz-api/src/features/report/ · quartz-api/src/features/student-valuation/
- Frontend: quartz-web/src/features/report/ · quartz-web/src/features/student-valuation/
- Branch:   feat/RPT-02-communicative-letter
