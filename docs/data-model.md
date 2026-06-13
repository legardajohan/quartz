# Quartz — Modelo de datos (MongoDB)

> **Mapa de colecciones y relaciones.** La **verdad de los campos** (tipos, `select:false`, índices) vive en cada `quartz-api/src/features/<feature>/*.model.ts`; este archivo no la duplica. Reglas de negocio: [domain.md](domain.md).

## Multi-tenancy
Casi toda colección lleva `institutionId` (ObjectId, **requerido**) y se filtra por el token. Excepciones: `Subject` global y `Notification` global (`institutionId` nulo).

## Colecciones

| Colección | Feature | Propósito | `institutionId` | Referencias clave |
|---|---|---|---|---|
| `Institution` | `institution` | Institución educativa (tenant raíz). | — (es la raíz) | — |
| `School` | `school` | Sede / campus. | Requerido | → Institution |
| `User` | `auth` (gestión en `users`) | Jefe de Área / Docente / Estudiante. | Requerido | → Institution, School |
| `Period` | `period` | Período académico (cuatrimestral). Solo uno `isActive`. | Requerido | → Institution |
| `Subject` | `subject` | Dimensión (fase actual) o materia (futuro), según `type`. | **Opcional** (nulo = global) | — |
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
- **Con modelo en código (8):** Institution, School, User (`auth`), Period, Subject, Learning, ChecklistTemplate, StudentValuation.
- **Definidos en diseño, sin modelo aún:** `Concept` (texto del concepto por dimensión/período), `Notification` (alertas in-app/email).
- **Sin colección (por diseño):** `report` — los informes son PDF dinámico y **no** se persisten.
