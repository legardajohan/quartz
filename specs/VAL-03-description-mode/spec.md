---
id: VAL-03-description-mode
feature: description-mode
status: implemented
created: 2026-07-15
---

# VAL-03 — Modo descripción por dimensión (spec)

## Objetivo
Permitir que una dimensión se valore con una **descripción libre del desempeño** escrita por el docente por estudiante, en lugar de la lista de aprendizajes con valoración cualitativa. Propicio para colegios que no trabajan por ítems.

## Alcance
**Incluye:**
- Propagación de `Subject.evaluationMode` por la cadena `Subject → ChecklistTemplate (snapshot) → StudentValuation`, respetando `docs/data-base.md §2`.
- `IValuationBySubject` gana el discriminador `evaluationMode` y el campo `performanceDescription: string | null`.
- Reglas de puntaje y `globalStatus` para dimensiones en modo descripción.
- Componente compartido de textarea, extraído del actual input de observaciones.
- Vista de valoración (`/evaluacion`): textarea en lugar de la tabla de radios.
- Vista de aprendizajes (`/academico/aprendizajes`): aviso fijo, sin gestión de learnings.
- Editor de plantillas: sin botón de añadir aprendizajes en dimensiones en modo descripción.
- PDF de Lista de Chequeo: párrafo en lugar de la grilla.
- Migración de los `authorize(['Jefe de Área'])` literales de `student-valuation.routes.ts` al enum, y desbloqueo del Docente.

**Fuera:**
- CRUD de `Subject` y la pantalla de Configuración → `ACAD-01-subject-management`.
- Concepto por dimensión (`assignedConceptId`): sigue sin escribirse en ningún modo. El puente `subjectPercentage → QualitativeValuation → Concept` no existe hoy en el código y no se abre aquí.
- Carta Comunicativa: sigue siendo placeholder deshabilitado (`specs/reports.spec.md`).
- Observaciones por dimensión distintas de la descripción de desempeño (`specs/valuation-observations.spec.md` ya las declaró fuera de alcance).

## Criterios de aceptación (EARS)
- [x] Cuando un docente compone un `ChecklistTemplate`, cada dimensión embebe su `evaluationMode` como parte del snapshot.
- [x] Cuando se inicializa una `StudentValuation` desde una plantilla, una dimensión en modo `description` se crea con `learningValuations: []`, `maxSubjectScore: 0`, `totalSubjectScore: 0`, `subjectPercentage: 0` y `performanceDescription: null`.
- [x] Cuando el docente envía `PATCH /api/student-valuations/:valuationId` con `performanceDescription` para una dimensión en modo `description`, el sistema la persiste y responde `200` con el DTO actualizado.
- [x] Si `performanceDescription` llega vacía o solo con espacios, el sistema la normaliza a `null`.
- [x] Si `performanceDescription` excede 2000 caracteres, el sistema responde `400` y no persiste.
- [x] Si una dimensión está en modo `description`, el sistema no le suma puntos: `totalSubjectScore`, `maxSubjectScore` y `subjectPercentage` permanecen en `0` y no se le asigna `assignedConceptId`.
- [x] Cuando se recalcula `globalStatus`, una dimensión en modo `description` cuenta como **una** unidad valorable, valorada si y solo si su `performanceDescription` no es `null`.
- [x] Cuando todas las dimensiones en modo `checklist` tienen sus ítems valorados y todas las de modo `description` tienen descripción, el sistema asigna `globalStatus: 'Evaluado'`.
- [x] Si un `PATCH` envía `performanceDescription` para una dimensión en modo `checklist`, el sistema ignora el campo y no altera la valoración.
- [x] Cuando un docente abre el acordeón de una dimensión en modo `description` en `/evaluacion`, el sistema muestra el rótulo literal "Descripción personalizada del desempeño por parte del docente" y un textarea editable, sin la tabla de radios.
- [x] Cuando un usuario abre `/academico/aprendizajes` con una dimensión en modo `description` seleccionada, el sistema muestra el aviso fijo y no ofrece crear, editar ni listar aprendizajes de esa dimensión.
- [x] Cuando un docente edita una plantilla, una dimensión en modo `description` no ofrece la acción de añadir aprendizajes.
- [x] Cuando se genera el PDF de Lista de Chequeo, una dimensión en modo `description` imprime su descripción como párrafo en lugar de la grilla de valoración.
- [x] Cuando un usuario con rol `Docente` invoca los endpoints de `/api/student-valuations`, el sistema le permite leer y valorar (hoy responde `403`).
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [x] `npx tsc --noEmit` en verde en cada paquete tocado (+ `npm run build && npm run lint` si toca `quartz-web`).

## Dependencias
- **`ACAD-01-subject-management`** — aporta `Subject.evaluationMode`, `SubjectEvaluationMode` y `sessionData.subjects[].evaluationMode`. Sin él este spec no arranca.

## Trazabilidad
- Backend:  quartz-api/src/features/student-valuation/ · quartz-api/src/features/checklist-template/
- Frontend: quartz-web/src/features/student-valuation/ · quartz-web/src/features/learning/ · quartz-web/src/features/report/
- Branch:   feat/VAL-03-description-mode
