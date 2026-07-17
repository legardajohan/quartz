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
    subject:  { _id, name, evaluationMode },  // snapshot del Subject (no es un ref poblable)
    learnings: [ { _id, description } ]       // snapshot del texto del Learning; _id propio del subdocumento
                                               // []  si evaluationMode === 'description'
  }
]
```

**Implicación:** editar un `Learning` global **no** retro-modifica los templates ya creados. El template es una
foto del momento en que el docente lo compuso. Lo mismo aplica a `evaluationMode`: cambiarlo en `Subject` (Configuración)
no altera templates ya generados (`VAL-03-description-mode`).

**`checklistTemplateId` es una referencia no crítica.** `StudentValuation.checklistTemplateId` solo enlaza al
template de origen; no se usa para reconstruir la valoración (eso lo resuelve el snapshot propio de §2.2). Si el
template se elimina, `getChecklistReport` (`report.service.ts`) no falla: usa el nombre real del template cuando
existe, o el texto de respaldo `"Plantilla eliminada"` cuando la referencia ya no resuelve.

### 2.2. `StudentValuation` embebe `learningDescription`, no `learningId`

Cada ítem valorado guarda el **texto** del aprendizaje (`learningDescription`), no una referencia.
Campos `nullable` relevantes (presentes en código, no obvios en el diseño):

- `qualitativeValuation`: `'Logrado' | 'En proceso' | 'Con dificultad' | null` (null = ítem sin valorar aún).
- `globalStatus`: `'Evaluado' | 'Evaluando' | 'Por diligenciar' | null`.

**Implicación:** la valoración es autocontenida y reproducible aunque cambien los `Learning` de origen, lo que
permite generar la Carta Comunicativa (PDF dinámico) de forma consistente con lo que el docente valoró.

**`evaluationMode` como discriminador (`VAL-03-description-mode`).** Cada elemento de `valuationsBySubject` copia
el `evaluationMode` del `Subject` (vía el snapshot del `ChecklistTemplate`) y gana `performanceDescription: string | null`:

- `evaluationMode: 'checklist'` → `learningValuations` con los ítems snapshot; `performanceDescription` siempre `null`.
- `evaluationMode: 'description'` → `learningValuations: []`; `performanceDescription` es la descripción libre del
  docente (`null` mientras no se escriba, texto normalizado —blanco → `null`— cuando se guarda).

Una dimensión en modo `description` **nunca** acumula `totalSubjectScore`/`maxSubjectScore`/`subjectPercentage`
(quedan en `0`) ni recibe `assignedConceptId`: no hay puntaje que interpretar. Para `globalStatus`, cuenta como
una unidad valorable, valorada si y solo si `performanceDescription !== null`.

### 2.3. Índices únicos relevantes (en código)

- `StudentValuation`: índice compuesto **único** `{ studentId, periodId }` → una valoración por estudiante y período.

### 2.4. Imágenes (escudo institucional, foto de estudiante) — `ACAD-03-image-uploads`

Las imágenes se almacenan en **Cloudflare R2**; Mongo solo guarda la **URL pública** resultante, nunca el binario.
No hay almacenamiento local de imágenes en ningún paquete.

- `Institution.shieldUrl?: string` — escudo del inquilino (no de `School`). Solo lo sube `Jefe de Área`.
- `User.avatarUrl?: string` — foto del estudiante. La suben `Jefe de Área` y `Docente`. Reservado para `role: 'Estudiante'`
  en esta fase; los demás roles no tienen foto.

Ambos campos son opcionales, sin `default`: los documentos existentes quedan sin imagen hasta el primer *upload*.
Cada reemplazo genera una **key nueva** (`.../<recurso>-<timestamp>.webp`) y borra el objeto anterior en R2
*best-effort* (un fallo de borrado no bloquea la operación ni se refleja al cliente).

> Para el resto de campos, tipos, `select:false` e índices de entidades codificadas, **leer el `*.model.ts`**
> correspondiente. No se duplican aquí para evitar la desincronización que motivó esta reducción.
