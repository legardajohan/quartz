# Quartz — Especificación de campos (solo lo pendiente)

> **Alcance de este archivo.** La **verdad de los campos** de las entidades **ya codificadas** vive en cada
> `quartz-api/src/features/<feature>/*.model.ts` — **no se duplica aquí** (ver política en [data-model.md](data-model.md)).
>
> Este documento conserva únicamente:
> 1. La **spec de campos de entidades aún sin modelo en código** (`Concept`, `Notification`), para implementarlas sin reinventarlas.
> 2. Las **decisiones de diseño embebido vs. referencia** (patrón *snapshot*) que **no** se deducen del mapa relacional.
>
> Reglas de negocio: [domain.md](domain.md). Mapa de colecciones y relaciones: [data-model.md](data-model.md).

---

## 1. Entidades sin modelo en código (a implementar)

Estas dos colecciones están **definidas en diseño** pero **no tienen `*.model.ts`** todavía. Esta es su fuente de campos.

### 1.1. `Concept`

Texto del concepto cualitativo por dimensión y período. Lo asigna `StudentValuation.valuationsBySubject[].assignedConceptId` según el rango de porcentaje (ver [domain.md](domain.md#concepto-por-dimensión-calculado)).

```json
{
  "_id": "ObjectId",
  "institutionId": "ObjectId",   // REQUERIDO. Referencia a Institution. Filtrar siempre por el token.
  "description": "String",        // Texto del concepto que se vuelca en la Carta Comunicativa
  "valuationType": "Logrado | En proceso | Con dificultad",  // Ver nota de enum
  "subjectId": "ObjectId",        // Referencia a Subject (dimensión)
  "periodId": "ObjectId",         // Referencia a Period
  "authorId": "ObjectId",         // Referencia a User (Jefe de Área o Docente) que lo creó
  "createdAt": "ISODate",         // timestamps
  "updatedAt": "ISODate"
}
```

> **Nota de enum (consistencia).** El diseño original usaba `"Achieved" | "InProgress" | "WithDifficulty"`.
> Para alinear con el código existente, `valuationType` **debe** usar el enum `QualitativeValuation`
> (`'Logrado' | 'En proceso' | 'Con dificultad'`) ya definido en
> `student-valuation/student-valuation.types.ts`. Reutilizar ese enum, no crear uno nuevo en inglés.

### 1.2. `Notification`

Alertas in-app / email. Puede ser global (sin institución) o institucional.

```json
{
  "_id": "ObjectId",
  "institutionId": "ObjectId",   // OPCIONAL. Nulo = notificación global. Si aplica, filtrar por el token.
  "userId": "ObjectId",          // Destinatario (User)
  "type": "ALERT | INFO",
  "message": "String",
  "isRead": "Boolean",
  "isEmailSent": "Boolean",       // Si el correo ya fue enviado
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## 2. Decisiones de diseño: embebido vs. referencia (patrón *snapshot*)

El mapa relacional de [data-model.md](data-model.md) muestra las referencias, pero **no** que `ChecklistTemplate`
y `StudentValuation` **embeben copias (snapshots)** en lugar de referenciar `Learning`. Esto es deliberado y
**clave** para cualquier feature que toque la Lista de Chequeo o las valoraciones.

### 2.1. `ChecklistTemplate` embebe el texto, no referencia `Learning`

Aunque el docente compone su lista **eligiendo** `Learning`s por dimensión, el template **no guarda `learningId`**:
copia `name` de la dimensión y `description` de cada aprendizaje en el momento de armarlo.

```
subjects: [
  {
    subject:  { _id, name },                 // snapshot del Subject (no es un ref poblable)
    learnings: [ { _id, description } ]       // snapshot del texto del Learning; _id propio del subdocumento
  }
]
```

**Implicación:** editar un `Learning` global **no** retro-modifica los templates ya creados. El template es una
foto del momento en que el docente lo compuso.

### 2.2. `StudentValuation` embebe `learningDescription`, no `learningId`

Cada ítem valorado guarda el **texto** del aprendizaje (`learningDescription`), no una referencia.
Campos `nullable` relevantes (presentes en código, no obvios en el diseño):

- `qualitativeValuation`: `'Logrado' | 'En proceso' | 'Con dificultad' | null` (null = ítem sin valorar aún).
- `globalStatus`: `'Evaluado' | 'Evaluando' | 'Por diligenciar' | null`.

**Implicación:** la valoración es autocontenida y reproducible aunque cambien los `Learning` de origen, lo que
permite generar la Carta Comunicativa (PDF dinámico) de forma consistente con lo que el docente valoró.

### 2.3. Índices únicos relevantes (en código)

- `StudentValuation`: índice compuesto **único** `{ studentId, periodId }` → una valoración por estudiante y período.

> Para el resto de campos, tipos, `select:false` e índices de entidades codificadas, **leer el `*.model.ts`**
> correspondiente. No se duplican aquí para evitar la desincronización que motivó esta reducción.
