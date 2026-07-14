---
feature: valuation-observations
status: implemented
created: 2026-07-14
---

# Spec — Observaciones de Valoración

## Problema
- Como Docente, quiero agregar una observación de texto libre y opcional al finalizar la
  valoración cualitativa de un estudiante, para registrar comentarios que no caben en los estados
  predefinidos de los aprendizajes.
- Como Jefe de Área o acudiente, quiero que las observaciones del docente aparezcan en el PDF de
  Lista de Chequeo, para tener un registro completo del proceso de valoración junto con la firma
  del docente.
- Como Docente, quiero que el PDF de Lista de Chequeo tenga una presentación clara y consistente
  (sin numeración innecesaria de aprendizajes, con tamaños de letra legibles y espacio para la
  foto del estudiante), para entregar un informe más profesional.

## Solución (visión general)
- Se agrega un campo opcional `observations` (texto libre) a nivel raíz de la valoración del
  estudiante, junto a las 7 dimensiones — no un campo por materia.
- En el frontend, al finalizar el checklist de las 7 dimensiones, aparece un área de texto
  opcional de "Observaciones" antes de guardar, con el mismo lenguaje visual ya usado en el
  proyecto para campos de texto libre y con el pulido de interacción (foco, placeholder,
  estado de guardado) propio del sistema de diseño de Quartz.
- El texto de observaciones se propaga del backend al informe y se imprime en el PDF de Lista de
  Chequeo; si no hay observaciones, la sección se omite sin dejar espacio en blanco.
- Se rediseña la tabla y el encabezado del PDF: se elimina la numeración de aprendizajes, se
  centran los encabezados "APRENDIZAJES" y "VALORACIÓN", se ajustan los tamaños de letra (12px
  aprendizajes, 11px encabezados de tabla) permitiendo salto de línea en vez de reducir tamaño, se
  reorganiza el ancho de las columnas de datos del estudiante (nombre en una sola línea; grado,
  sede y fecha —formato DD/MM/AAAA— más angostos), se agrega el título "Escala de valoración"
  como descripción de la leyenda de colores, se reserva espacio para la foto del estudiante en el
  lado derecho del encabezado, y se conserva la sección de firma del docente al pie.

## Criterios de aceptación (EARS)
- [x] Cuando el docente complete la valoración de las 7 dimensiones de un estudiante, el sistema
  muestra un área de texto opcional de "Observaciones" al final del formulario, antes de guardar.
- [x] Si el docente guarda la valoración sin escribir observaciones, el sistema persiste el campo
  como vacío/nulo sin bloquear el guardado.
- [x] Cuando el docente escribe texto en observaciones y guarda, el sistema persiste ese texto
  asociado a la valoración del estudiante y período correspondiente.
- [x] Cuando se genera el PDF de Lista de Chequeo de un estudiante con observaciones registradas,
  el sistema incluye ese texto en el documento.
- [x] Si la valoración no tiene observaciones registradas, el sistema omite la sección de
  observaciones en el PDF sin dejar espacios en blanco innecesarios.
- [x] Cuando se genera el PDF, el sistema muestra la tabla de aprendizajes sin columna de
  numeración, con los encabezados "APRENDIZAJES" y "VALORACIÓN" centrados.
- [x] Cuando el texto de un aprendizaje no cabe en el ancho de columna disponible, el sistema hace
  salto de línea manteniendo el tamaño de letra en 12px, en vez de reducirlo.
- [x] Cuando se genera el PDF, el sistema muestra el nombre completo del estudiante en una sola
  línea, angosta las columnas de Grado, Sede y Fecha (formato DD/MM/AAAA), y reserva un espacio
  para la fotografía del estudiante en el lado derecho del encabezado.
- [x] Cuando se genera el PDF, el sistema muestra el título "Escala de valoración" como
  descripción de la leyenda Logrado/En proceso/Con dificultad, y conserva la sección de firma del
  docente al final del documento.

## Fuera de alcance (fases futuras)
- Mecanismo real de subida de foto del estudiante (el informe solo reserva el espacio, mismo
  precedente que el escudo institucional en `specs/reports.spec.md`).
- Edición de observaciones por materia/dimensión individual.
- Carta Comunicativa (sigue deshabilitada, ver `specs/reports.spec.md`).

## Trazabilidad
- Backend:  quartz-api/src/features/student-valuation/ (campo `observations`),
  quartz-api/src/features/report/ (propagación a `IReportTemplate`)
- Frontend: quartz-web/src/features/student-valuation/ (textarea de observaciones),
  quartz-web/src/features/report/ (renderizado e impresión en `ChecklistReportDocument`)
- Branch:   feat/valuation-observations
