# Quartz — Modelo de datos (MongoDB)

> **Mapa de colecciones y relaciones.** La **verdad de los campos** (tipos, `select:false`, índices) vive en cada `quartz-api/src/features/<feature>/*.model.ts`; este archivo no la duplica. Reglas de negocio: [domain.md](domain.md).

## Multi-tenancy
Casi toda colección lleva `institutionId` (ObjectId, **requerido**) y se filtra por el token. Excepción: `Notification` global (`institutionId` nulo, sin implementar aún).

## Colecciones

| Colección | Feature | Propósito | `institutionId` | Referencias clave |
|---|---|---|---|---|
| `Institution` | `institution` | Institución educativa (tenant raíz). Incluye `settings` (`enabledReports`, default ambos; `multipleShifts` + `shifts[]` — jornadas embebidas con `_id` propio, ACAD-04). | — (es la raíz) | — |
| `School` | `school` | Sede / campus. Catálogo gestionable por el Jefe de Área (CRUD, ACAD-04); `schoolNumber` autoasignado, no editable. | Requerido | → Institution |
| `User` | `auth` (gestión en `users`) | Jefe de Área / Docente / Estudiante. `shiftId` opcional (solo Estudiante) — referencia no poblable a `Institution.settings.shifts[]._id` (ACAD-04). | Requerido | → Institution, School |
| `Period` | `period` | Período académico. Cantidad por año libre, sin tope (cada institución define cuántos maneja). Solo uno `isActive` (índice parcial único). `year` persistido, `closingAlertDate` opcional. | Requerido | → Institution |
| `Subject` | `subject` | Dimensión (fase actual) o materia (futuro), según `type`. Catálogo gestionable por institución (ACAD-01). | Requerido | — |
| `Learning` | `learning` | Aprendizaje esperado, por dimensión y período. | Requerido | → Subject, Period, User |
| `ChecklistTemplate` | `checklist-template` | Lista de Chequeo **personal del docente**. | Requerido | → Period, User (docente), Subject[], Learning[] |
| `StudentValuation` | `student-valuation` | Valoraciones de un estudiante según el template del docente. | Requerido | → User (estudiante/docente), ChecklistTemplate, Period, Subject, Learning, Concept |

## `StudentValuation` — forma calculada (lógica en [domain.md](domain.md))
Por cada subject en `valuationsBySubject[]`:
- `learningValuations[]` → `{ learningId, qualitativeValuation, pointsObtained (3|2|1) }`
- `totalSubjectScore`, `maxSubjectScore`, `subjectPercentage` (calculados).
- `assignedConceptId` → `Concept` asignado por rango de %.
- `globalStatus` (raíz del documento) → Evaluado | Evaluando | Por diligenciar.

## Estado de implementación
- **Con modelo en código (8):** Institution, School, User (`auth`), Period, Subject, Learning, ChecklistTemplate, StudentValuation. La verdad de sus campos vive en los `*.model.ts`.
- **Definidos en diseño, sin modelo aún:** `Concept` (texto del concepto por dimensión/período), `Notification` (alertas in-app/email). **Spec de campos en [data-base.md](data-base.md).**
- **Sin colección (por diseño):** `report` — los informes son PDF dinámico y **no** se persisten.

> **Diseño embebido (snapshot):** `ChecklistTemplate` y `StudentValuation` **embeben** el texto de `Subject`/`Learning` en lugar de referenciarlo. Detalle e implicaciones en [data-base.md](data-base.md#2-decisiones-de-diseño-embebido-vs-referencia-patrón-snapshot).
