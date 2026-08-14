---
id: RPT-03-communicative-letter-ux
feature: communicative-letter-ux
status: implemented
created: 2026-08-13
---

# RPT-03 — Refinamiento UX Carta Comunicativa (spec)

## Objetivo
Reemplazar el modal de edición de la Carta Comunicativa en `/Evaluación` por una vista de
página (sin modal, sin PDF), simplificar su vista en `/Informes` a solo-PDF descargable con
escudo real, y estandarizar a *Lucide Icons* los íconos de acción en ambas tablas. Refinamiento
de UX sobre RPT-02 (ya implementado), no un feature nuevo.

## Alcance
**Incluye:**
- Iconos Lucide en columna "Acciones" de `StudentValuationTable` (`/Evaluación`) y columna
  "Informes" de `ReportsTable` (`/Informes`), conservando el contorno/estilo actual del botón.
- Vista de página `CommunicativeLetterEditPage` (ruta nueva) para editar/seleccionar el
  `Concept` asignado por dimensión, accesible para `Jefe de Área` y `Docente`.
- `Select` desplegable cuando existen 2+ `Concept` candidatos para la misma combinación
  periodo + dimensión + estado; texto de solo lectura cuando hay exactamente 1.
- Simplificación de `CommunicativeLetterModal` (usado desde `/Informes`) a panel único de
  solo-PDF (sin edición), igual que `ChecklistReportModal`.
- Escudo real del inquilino en el PDF de Carta Comunicativa, vía el mismo mecanismo binario
  que ya usa la Lista de Chequeo (`/reports/checklist/:valuationId/shield`).
- Corrección de copy desactualizado en `ReportSettingsPanel` ("(próximamente)").

**Fuera:**
- Logo "Powered by Quartz" en el footer del PDF de Carta Comunicativa (existe hoy solo en el
  Checklist, por INF-01) — no se replica.
- Cambiar Heroicons por Lucide en el resto de la aplicación.
- Cambios al modelo `Concept`, a `assignedConceptId` o al endpoint `PATCH
  /student-valuations/:valuationId/concepts` — ya soportan múltiples candidatos y selección
  manual, sin cambios.
- Gating por `Institution.settings.enabledReports` — ya implementado en ambas tablas; solo se
  verifica en pruebas manuales.

## Criterios de aceptación (EARS)
- [x] Cuando un Jefe de Área/Docente ve la columna "Acciones" de "Evaluación de estudiantes",
      el sistema muestra únicamente iconos de Lucide (`Plus`, `ClipboardList`, `Mail`,
      `Trash2`), conservando el contorno/estilo actual del `IconButton`.
- [x] Cuando un Jefe de Área/Docente ve la columna "Informes" de `/Informes`, el sistema
      muestra únicamente iconos de Lucide (`ClipboardList`, `Mail`) en ese mismo contorno.
- [x] Cuando se hace clic en "Ver Carta Comunicativa" desde `/Evaluación`, el sistema navega a
      una vista de página completa (no modal, no PDF) con los datos del estudiante y, por
      dimensión, el concepto asignado.
- [x] Si una dimensión tiene 2+ `Concept` candidatos para el mismo periodo+estado, el sistema
      muestra un `Select` desplegable con las descripciones para elegir uno.
- [x] Si una dimensión tiene exactamente 1 candidato, el sistema lo muestra como texto de solo
      lectura, sin desplegable.
- [x] Cuando el Jefe de Área/Docente guarda cambios en esa vista, el sistema persiste la
      selección vía `PATCH /student-valuations/:valuationId/concepts` (endpoint existente) y
      confirma con toast.
- [x] Si el usuario intenta salir con cambios sin guardar, el sistema bloquea la navegación y
      pide confirmar/descartar (mismo patrón que `StudentValuationDetail`).
- [x] Cuando se hace clic en "Ver Carta Comunicativa" desde `/Informes`, el sistema muestra
      únicamente el PDF (sin panel de edición) listo para descargar; ningún dato es editable
      desde ahí.
- [x] El PDF de Carta Comunicativa incluye el escudo real del inquilino (imagen, no
      placeholder), obtenido por el mismo mecanismo que ya usa la Lista de Chequeo.
- [x] Si el inquilino no tiene escudo o falla su carga, el sistema omite el bloque de imagen
      sin romper el PDF (igual que el Checklist hoy) — `shieldSrc` condicional, mismo patrón
      que `ChecklistReportDocument`.
- [x] Cuando `Institution.settings.enabledReports` no incluye `communicative-letter`, el
      sistema no muestra el ícono de Carta Comunicativa en ninguna de las dos tablas
      (comportamiento ya existente — verificado en código, sin cambios).
- [x] **Aislamiento:** el nuevo endpoint de escudo de Carta Comunicativa filtra y fuerza
      `institutionId` del token; nunca acepta `institutionId` de `body`/`params`.
- [x] `npx tsc --noEmit` en verde en `quartz-api` · `npm run build && npm run lint` en verde en
      `quartz-web` (lint: 4 errores/3 warnings preexistentes, ninguno introducido por este spec).

> Pendiente de verificación manual en navegador con datos reales (no ejecutada en esta sesión,
> sin acceso a browser tooling): los tres flujos end-to-end descritos en `tasks.md` §Verificación
> final. El código cubre los criterios anteriores; falta la confirmación visual/interactiva.

## Dependencias
- RPT-02-communicative-letter (implementado): modelo `Concept`, `assignedConceptId`,
  `GET/PATCH` de conceptos y reportes.
- INF-01-search-and-report-polish (mergeado a esta rama): endpoint binario de escudo
  (`/reports/checklist/:valuationId/shield`), hook `usePdfShieldImage`, `Institution.shieldJpgUrl`,
  dependencia `lucide-react` ya instalada.

## Trazabilidad
- Backend:  quartz-api/src/features/report/
- Frontend: quartz-web/src/features/report/, quartz-web/src/features/student-valuation/
- Branch:   feat/RPT-02-communicative-letter (continúa sobre la rama actual, sin rama nueva)
