# VAL-03 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/checklist-template/checklist-template.types.ts` |
| tocar | `src/features/checklist-template/checklist-template.model.ts` |
| tocar | `src/features/checklist-template/checklist-template.validation.ts` |
| tocar | `src/features/checklist-template/checklist-template.service.ts` |
| tocar | `src/features/student-valuation/student-valuation.types.ts` |
| tocar | `src/features/student-valuation/student-valuation.model.ts` |
| tocar | `src/features/student-valuation/student-valuation.validation.ts` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` |
| tocar | `src/features/student-valuation/student-valuation.routes.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/components/common/PerformanceTextarea.tsx` |
| crear | `src/components/interfaces/PerformanceTextareaProps.ts` |
| tocar | `src/features/student-valuation/components/ValuationChecklist.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationDetail.tsx` |
| tocar | `src/features/student-valuation/types/api.ts` |
| tocar | `src/features/learning/pages/LearningsPage.tsx` |
| tocar | `src/features/checklist-template/components/ChecklistEditor.tsx` |
| tocar | `src/features/report/components/ChecklistReportDocument.tsx` |
| tocar | `src/features/report/types/api.ts` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/data-base.md` |

## Contratos
### Tipos / DTOs
`student-valuation.model.ts`:
```typescript
export interface IValuationBySubject {
  subjectId: Types.ObjectId;
  evaluationMode: SubjectEvaluationMode;      // discriminador
  learningValuations: ILearningValuation[];   // [] si description
  performanceDescription: string | null;      // null si checklist
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: Types.ObjectId;
}
```

`student-valuation.types.ts` — unión discriminada en el DTO:
```typescript
type ValuationBySubjectBase = {
  subjectId: string;
  subjectName: string;
  totalSubjectScore: number;
  maxSubjectScore: number;
  subjectPercentage: number;
  assignedConceptId?: string;
};

export type IValuationBySubjectDTO =
  | (ValuationBySubjectBase & {
      evaluationMode: SubjectEvaluationMode.CHECKLIST;
      learningValuations: ILearningValuationDTO[];
      performanceDescription: null;
    })
  | (ValuationBySubjectBase & {
      evaluationMode: SubjectEvaluationMode.DESCRIPTION;
      learningValuations: [];
      performanceDescription: string | null;
    });
```
`SubjectEvaluationMode` se importa de `subject/subject.types.ts` (ACAD-01) — **no** se redefine.

`StudentValuationUpdateData`:
```typescript
type ValuationBySubjectUpdate = {
  subjectId: Types.ObjectId | string;
  learningValuations: LearningValuationUpdate[];
  performanceDescription?: string | null;
};
```

`checklist-template.types.ts` — el snapshot `subjects[].subject` gana `evaluationMode`:
```typescript
subjects: {
  subject: { _id: Types.ObjectId; name: string; evaluationMode: SubjectEvaluationMode };
  learnings: { _id?: Types.ObjectId; description: string }[];
}[];
```
Mismo cambio en `SubjectSnapshotData` e `IChecklistTemplateResponse`.

### Modelo Mongoose
`student-valuation.model.ts` — `valuationBySubjectSchema` gana:

| Campo | Tipo | Notas |
|---|---|---|
| `evaluationMode` | `String` | `enum: Object.values(SubjectEvaluationMode)`, `required`, `default: CHECKLIST` |
| `performanceDescription` | `String` | `default: null` |

`checklist-template.model.ts` — `subjectInTemplateSchema.subject` gana `evaluationMode: { type: String, enum: …, required: true }`.

Sin migración de datos: el `default: CHECKLIST` cubre los documentos existentes, que hoy son todos de lista de chequeo.

### Zod
`student-valuation.validation.ts` — en `updateValuationSchema`, cada elemento de `body.valuationsBySubject` gana:
```typescript
performanceDescription: z.string().max(2000).nullable().optional()
```
Mismo trato que `observations` (ya definido así en el mismo archivo). `learningValuations` pasa a `.default([])` para aceptar dimensiones en modo descripción.

`checklist-template.validation.ts` — `subjects[].subject` acepta `evaluationMode: z.nativeEnum(SubjectEvaluationMode)`.

### Endpoints
Sin rutas nuevas. Cambio de autorización en `student-valuation.routes.ts`:

| Método | Ruta | Rol (hoy) | Rol (destino) |
|---|---|---|---|
| POST | `/student/:studentId/period/:periodId` | `['Jefe de Área']` literal | `[UserRole.JEFE_DE_AREA, UserRole.DOCENTE]` |
| GET | `/student/:studentId` | `['Jefe de Área']` literal | `[UserRole.JEFE_DE_AREA, UserRole.DOCENTE]` |
| GET | `/:valuationId` | `['Jefe de Área']` literal | `[UserRole.JEFE_DE_AREA, UserRole.DOCENTE]` |
| PATCH | `/:valuationId` | `['Jefe de Área']` literal | `[UserRole.JEFE_DE_AREA, UserRole.DOCENTE]` |
| DELETE | `/:valuationId` | `['Jefe de Área']` literal | `[UserRole.JEFE_DE_AREA]` |

Ver Nota 2.

### Service — `student-valuation.service.ts`
**`initializeStudentValuation()`** (línea 204, `template.subjects.map`): bifurcar por `subject.subject.evaluationMode`.

| Campo | `checklist` | `description` |
|---|---|---|
| `learningValuations` | snapshot de `learnings` | `[]` |
| `maxSubjectScore` | `learnings.length * 3` | `0` |
| `totalSubjectScore` | `0` | `0` |
| `subjectPercentage` | `0` | `0` |
| `performanceDescription` | `null` | `null` |

**`updateStudentValuation()`** (líneas 265-336) — tres puntos:
1. El `updateMap` (línea 266) solo indexa `learningValuations`. Añadir un segundo mapa `subjectId → performanceDescription`.
2. El recálculo (líneas 301-321) recorre `learningValuations`. Una dimensión en modo `description` no entra en ese bucle: sus tres agregados quedan en `0` y no se toca `assignedConceptId`. La normalización de blanco → `null` replica exactamente las líneas 323-327 de `observations`.
3. `globalStatus` (líneas 330-336) se calcula con `totalLearnings` / `valuatedLearnings`. Una dimensión en modo `description` suma **1** a `totalLearnings`, y **1** a `valuatedLearnings` si su `performanceDescription` resultante no es `null`. Así `'Evaluado'` sigue significando "todo valorado" (`docs/domain.md:50-55`) sin cambiar la definición.

Si llega `performanceDescription` para una dimensión en modo `checklist`, se ignora (el discriminador del documento manda, no el payload).

**`populateAndMapValuation()`** (líneas 99-118): propagar `evaluationMode` y `performanceDescription` al DTO.

La regla de puntos `Logrado/En proceso/Con dificultad = 3/2/1` (`pointsMapping`, líneas 295-299) no se toca — sigue rigiendo `docs/domain.md:29-34`.

### Frontend
**`components/common/PerformanceTextarea.tsx`** — nuevo, extraído del textarea de observaciones que hoy vive inline en `StudentValuationDetail.tsx:257-275`. Props en `components/interfaces/PerformanceTextareaProps.ts`, siguiendo la convención de `FormModalProps.ts` / `ConfirmationModalProps.ts`:
```typescript
export interface PerformanceTextareaProps {
  title: string;
  subtitle?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;      // default 2000
  rows?: number;           // default 4
  icon?: React.ReactNode;
  disabled?: boolean;
}
```
Encapsula el `Textarea` de Material Tailwind (`color="purple"`), el truncado por `maxLength` (hoy `e.target.value.slice(0, OBSERVATIONS_MAX_LENGTH)`, línea 271) y el contador. Dos consumidores: Observaciones (raíz de la valoración) y la descripción por dimensión. Acabado con las skills `impeccable`, `emil-design-eng` y `frontend-design`.

**`ValuationChecklist.tsx`** — hoy el `AccordionBody` (líneas 194-278) siempre renderiza la tabla de radios. Bifurcar por `subject.evaluationMode`:
- `checklist` → tabla actual, sin cambios.
- `description` → `<PerformanceTextarea title="Descripción personalizada del desempeño por parte del docente" … />`, rótulo **literal**. Sin tabla, sin radios.

El bloque de progreso (líneas 104-153) cuenta `learningVals.length`. En modo descripción pasa a 0/1 ↔ 1/1 según haya texto, y `subjectStatus` (`NOT_STARTED` / `COMPLETED`, sin `IN_PROGRESS`) se deriva de eso. Props: añadir `onDescriptionChange?: (subjectId: string, value: string) => void`.

**`StudentValuationDetail.tsx`** — ver Nota 1 (bug del payload). Además: reemplazar el textarea inline de observaciones por `<PerformanceTextarea />`, y extender el `hasChanges()` (líneas 89-95) para que el dirty-check por `JSON.stringify` cubra `performanceDescription` — ya lo hace, porque compara `valuationsBySubject` completo.

**`LearningsPage.tsx`** — `subjects` viene de `sessionData?.subjects ?? []` (línea 20). Si la dimensión seleccionada en el filtro tiene `evaluationMode === 'description'`: ocultar el botón "Crear" y la tabla, y mostrar el aviso fijo "Descripción personalizada del desempeño por parte del docente — esta dimensión no gestiona aprendizajes". Requiere que `sessionData.subjects[].evaluationMode` exista (ACAD-01).

**`ChecklistEditor.tsx`** — el acordeón de una dimensión en modo descripción no ofrece el botón "+" de aprendizajes (el snapshot ya trae `evaluationMode`).

**`ChecklistReportDocument.tsx`** (`@react-pdf/renderer`, el PDF se arma en el front según `specs/reports.spec.md`) — la dimensión en modo descripción imprime `performanceDescription` como párrafo en lugar de la grilla. Respetar el rediseño vigente de `specs/valuation-observations.spec.md`: 12px para aprendizajes, 11px encabezados, sin numeración.

**`features/report/types/api.ts` y `features/student-valuation/types/api.ts`** — espejo de la unión discriminada. Nota: `report.types.ts` (backend) reutiliza `IValuationBySubjectDTO` de `student-valuation.types.ts`, así que el cambio se propaga solo; verificar que `IStudentValuation` en `report.types.ts` compile.

## Notas
1. **Bug bloqueante en el payload actual.** `StudentValuationDetail.tsx:66-73` construye el payload así:
   ```typescript
   valuationsBySubject: localValuation.valuationsBySubject
     .map((subject) => ({ subjectId, learningValuations: subject.learningValuations.filter(lv => lv.qualitativeValuation !== null) }))
     .filter((subject) => subject.learningValuations.length > 0),
   ```
   Ese `.filter()` final **descarta toda dimensión sin aprendizajes valorados**. Una dimensión en modo descripción tiene `learningValuations: []` siempre → se elimina del payload y `performanceDescription` nunca llega al backend. Hay que rehacer el mapeo: conservar la dimensión si es modo descripción, o si tiene al menos un aprendizaje valorado. Es el primer punto a tocar del front; sin esto, nada de lo demás funciona.

2. **El Docente está bloqueado en toda la valoración.** Los 5 endpoints de `student-valuation.routes.ts` usan `authorize(['Jefe de Área'])` con el literal suelto — compila porque `authorize()` está tipado como `string[]` (`role.middleware.ts`), no como `UserRole[]`. Pero `docs/domain.md:13` dice que el Docente "valora y modifica la Lista de Chequeo", y `report.routes.ts:17` sí le permite leer el informe. Es una inconsistencia preexistente que este spec **debe** resolver: el docente es precisamente quien escribe la descripción del desempeño. `DELETE` se queda solo en Jefe de Área. Si al implementar aparece una razón para el bloqueo actual, parar y consultar antes de abrirlo.

3. **El snapshot no se retro-modifica.** Cambiar `evaluationMode` en Configuración **no** altera plantillas ni valoraciones ya creadas: es la misma consecuencia que ya rige para `Learning` (`docs/data-base.md §2.1`). Una plantilla compuesta antes del cambio sigue evaluando esa dimensión por checklist. Es coherente y deliberado, pero la UI de Configuración debe advertirlo (queda en ACAD-01).

4. **`assignedConceptId` sigue muerto.** Nada en el backend lo escribe hoy: los umbrales 80/46/0 de `docs/domain.md:36-48` no existen en código y el puente `subjectPercentage → QualitativeValuation → Concept` está sin construir. Este spec no lo abre; solo garantiza que una dimensión en modo descripción **nunca** reciba concepto, porque no tiene porcentaje que interpretar.

5. **Por qué el discriminador y no la unión.** La alternativa era `learningValuations: string | ILearningValuationDTO[]`. Mongoose no puede tipar `String | [Schema]`: obligaría a `Schema.Types.Mixed`, perdiendo la validación del subdocumento; y en TS forzaría `Array.isArray()` en cada consumidor sin que el compilador garantice exhaustividad. Con `evaluationMode` explícito, TS estrecha la unión solo y el schema queda tipado.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Poner una dimensión en modo descripción desde `/gestion/configuracion` → crear plantilla → valorar un estudiante: el acordeón muestra el textarea, guarda, y al recargar la descripción persiste.
- Con todas las dimensiones checklist valoradas y la de descripción con texto → `globalStatus: 'Evaluado'`; borrar el texto → vuelve a `'Evaluando'`.
- Generar el PDF de Lista de Chequeo: la dimensión en modo descripción imprime el párrafo.
- `/academico/aprendizajes` con esa dimensión: aviso fijo, sin botón Crear.
