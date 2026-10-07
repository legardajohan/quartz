# RPT-04 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/student-valuation/student-valuation.model.ts` |
| tocar | `src/features/student-valuation/student-valuation.types.ts` |
| tocar | `src/features/student-valuation/student-valuation.validation.ts` |
| tocar | `src/features/student-valuation/student-valuation.service.ts` |
| tocar | `src/features/report/report.service.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/report/types/api.ts` |
| crear | `src/features/report/statusVisuals.ts` |
| tocar | `src/features/report/components/LetterConceptPicker.tsx` |
| tocar | `src/features/report/pages/CommunicativeLetterEditPage.tsx` |
| tocar | `src/features/report/components/CommunicativeLetterDocument.tsx` |

## Contratos

### Modelo Mongoose (`student-valuation.model.ts`)
`IValuationBySubject` (interfaz, línea ~14-23) — nuevo campo:
```ts
assignedConceptText?: string | null;
```
`valuationBySubjectSchema` (línea ~44-53) — nuevo campo, mismo patrón que `performanceDescription`:
```ts
assignedConceptText: { type: String, default: null },
```

### Tipos (`student-valuation.types.ts`)
`ValuationBySubjectBase` (línea ~32-39) — nuevo campo:
```ts
assignedConceptText?: string | null;
```
`ConceptAssignmentUpdate` (línea ~122-125) — nuevo campo:
```ts
export type ConceptAssignmentUpdate = {
  subjectId: string;
  conceptId: string;
  conceptText: string;
};
```

### Zod (`student-valuation.validation.ts`)
`conceptAssignmentSchema` (línea ~20-23):
```ts
const conceptAssignmentSchema = z.object({
  subjectId: objectIdSchema,
  conceptId: objectIdSchema,
  conceptText: z.string().trim().min(1, 'El texto del concepto no puede estar vacío')
    .max(2000, 'El texto del concepto no puede superar los 2000 caracteres'),
}).strict();
```
(mismo límite de 2000 que `performanceDescription`/`observations` en este mismo archivo)

### Service (`student-valuation.service.ts`)
1. **Mapeo DTO** (`populateAndMapValuation`, línea ~118-127): añadir al objeto `base`:
   ```ts
   assignedConceptText: vs.assignedConceptText ?? undefined,
   ```
   Requiere añadir `assignedConceptText?: string | null;` a `PopulatedValuationBySubject`
   (línea ~55-64).

2. **Auto-asignación** (`updateStudentValuation`, bloque línea ~385-422): el `.select(...)` de
   `periodConcepts` (línea ~389) pasa de `'subjectId valuationType createdAt'` a
   `'subjectId valuationType createdAt description'`. `conceptCandidatesByKey` pasa de
   `Map<string, string[]>` a `Map<string, { id: string; description: string }[]>`. Al asignar
   un candidato nuevo (línea ~421, rama donde `currentConceptId` no es válido o no existe):
   ```ts
   const chosen = candidates[0];
   subject.assignedConceptId = chosen ? new Types.ObjectId(chosen.id) : undefined;
   subject.assignedConceptText = chosen ? chosen.description : undefined;
   ```
   En la rama `!isFullyValued` (línea ~410-412) que limpia `assignedConceptId`, limpiar también
   `assignedConceptText = undefined`. La rama de *early return* (línea 419, cuando el
   `currentConceptId` sigue siendo válido) no toca `assignedConceptText` — así se preserva
   cualquier snapshot editado manualmente mientras la asignación siga vigente.

3. **Selección manual** (`updateValuationConcepts`, línea ~445-508): el `.select(...)` de
   `concepts` (línea ~466) no necesita cambios (el texto ya no se toma del banco, se toma del
   `conceptText` que manda el cliente). Al asignar (línea ~496-503):
   ```ts
   data.assignments.forEach(assignment => {
     const subject = valuation.valuationsBySubject.find(s => s.subjectId.toString() === assignment.subjectId);
     if (subject) {
       subject.assignedConceptId = new Types.ObjectId(assignment.conceptId);
       subject.assignedConceptText = assignment.conceptText;
     }
   });
   ```
   El bloque de validación previo (línea ~472-494, que verifica que el `conceptId` exista,
   pertenezca a la institución y corresponda a dimensión/periodo/nivel) no cambia — sigue
   validando el `conceptId`; `conceptText` es texto libre del usuario, ya validado por Zod
   (no-vacío, máx. 2000).

### Report (`report.service.ts`, `getCommunicativeLetterReport`, línea ~231-262)
Reemplazar el cálculo de `conceptText` (línea ~247-250):
```ts
const level = resolveQualitativeValuation(subject.subjectPercentage);
const candidates = conceptsByKey.get(`${subject.subjectId}|${level}`) ?? [];
const isAssignmentValid = !!subject.assignedConceptId && candidates.some(c => c._id === subject.assignedConceptId);

const assignedConceptId = isAssignmentValid ? subject.assignedConceptId! : candidates[0]?._id ?? null;
const conceptText = isAssignmentValid
  ? (subject.assignedConceptText || candidates.find(c => c._id === assignedConceptId)?.description || '')
  : (candidates[0]?.description ?? '');
```
Es decir: si la asignación persistida sigue siendo un candidato vigente, se prioriza el
snapshot (`subject.assignedConceptText`); si por algún motivo el snapshot viniera vacío
(datos históricos previos a este spec), cae a la descripción en vivo del concepto asignado
como red de seguridad. Si la asignación ya no es válida, se recalcula igual que hoy
(`candidates[0]`, descripción en vivo) sin persistir el cambio desde un `GET`.

`IValuationBySubjectDTO` (usado como `IStudentValuationDTO.valuationsBySubject`, tipo
`ValuationBySubjectBase`) ya expone `subject.assignedConceptText` tras el cambio de tipos
anterior — no requiere import nuevo.

## Frontend

### `types/api.ts`
`ConceptAssignmentUpdate` (mirror del tipo backend):
```ts
export type ConceptAssignmentUpdate = {
  subjectId: string;
  conceptId: string;
  conceptText: string;
};
```

### `statusVisuals.ts` (nuevo)
```ts
import achievedSvg from "../../assets/images/achieved-icon.svg";
import inProcessSvg from "../../assets/images/in-process-icon.svg";
import withDifficultySvg from "../../assets/images/with-dificulty-icon.svg";
import achievedJpg from "../../assets/images/achieved-icon.jpg";
import inProcessJpg from "../../assets/images/in-process-icon.jpg";
import withDifficultyJpg from "../../assets/images/with-dificulty-icon.jpg";
import type { QualitativeValuation } from "./types";

export const STATUS_ICON_SVG: Record<QualitativeValuation, string> = {
  "Logrado": achievedSvg,
  "En proceso": inProcessSvg,
  "Con dificultad": withDifficultySvg,
};

export const STATUS_ICON_JPG: Record<QualitativeValuation, string> = {
  "Logrado": achievedJpg,
  "En proceso": inProcessJpg,
  "Con dificultad": withDifficultyJpg,
};
```
Cada JPG/SVG se importa **una sola vez** a nivel de módulo; todas las dimensiones que
comparten estado referencian la misma constante (misma URL resuelta por Vite) — no hay
recarga por ocurrencia, ni en la vista web ni en el PDF.

### `LetterConceptPicker.tsx` — reescritura del bloque `checklist`
- Layout por dimensión: `grid grid-cols-[1fr_120px] gap-3` (proporción: tarjeta de concepto a
  la izquierda más ancha, caja de estado a la derecha, angosta).
- **Tarjeta izquierda** (concepto): header con nombre de dimensión + `IconButton` con ícono
  Lucide `SquarePen` (o `Check` mientras está en modo edición, mismo botón alternando ícono).
  Cuerpo:
  - `Select`/`Option` (@material-tailwind/react) **solo si** `availableConcepts.length > 1`,
    igual que hoy (RPT-03, sin cambios de regla).
  - Debajo: si `isEditing` (estado local del componente, `useState<string | null>` con el
    `subjectId` que está en edición) → `Textarea` (@material-tailwind/react) con el valor de
    `conceptText[subject.subjectId]`, `onChange` llama `onTextChange(subject.subjectId, value)`.
    Si no está editando → `Typography` de solo lectura con el mismo valor.
- **Caja derecha** (estado): `<img src={STATUS_ICON_SVG[level]} className="h-10 w-10" />`
  arriba, `<span>` punto + texto de estado (mismos estilos `LEVEL_STYLES` ya existentes) abajo.
  Solo se renderiza para subjects `checklist` (los `description` no tienen nivel).
- Nueva prop: `onSelect` se mantiene; se añade `conceptText: Record<string, string>` y
  `onTextChange: (subjectId: string, text: string) => void`. Al `Select.onChange`, además de
  `onSelect(subjectId, conceptId)`, el padre (`CommunicativeLetterEditPage`) debe resetear
  `conceptText[subjectId]` a la descripción del `concept` elegido (ver abajo) — no lo hace
  `LetterConceptPicker` porque no tiene por qué conocer esa regla de reseteo, la referencia al
  `availableConcepts` completo ya está disponible en `subjects` que sí recibe.
- Subjects `description` (línea 22-35 actual): sin cambios de comportamiento; sin caja de
  estado a la derecha (o columna derecha vacía/colapsada, mismo `grid` con la celda derecha
  sin contenido).

### `CommunicativeLetterEditPage.tsx`
- Nuevo estado: `const [conceptText, setConceptText] = useState<Record<string, string>>({})`.
- `buildServerSelection` (línea 28-37) se acompaña de un `buildServerConceptText(letter)` que
  arma `Record<subjectId, string>` desde `subject.conceptText` (ya viene resuelto — snapshot o
  fallback — desde el backend) para subjects `checklist`. Se llama junto con
  `buildServerSelection` en el `useEffect` de línea 61-63 y en `handleDiscard` (línea 79-81).
- `handleSelect` (línea 75-77): además de `setSelection`, busca el concepto elegido en
  `currentLetter.subjects.find(s => s.subjectId === subjectId)?.availableConcepts` y hace
  `setConceptText(prev => ({ ...prev, [subjectId]: concept?.description ?? prev[subjectId] }))`.
- Nuevo `handleTextChange(subjectId, text)` → `setConceptText(prev => ({ ...prev, [subjectId]: text }))`.
- `isDirty` (línea 65-71): además de comparar `selection` contra `assignedConceptId`, compara
  `conceptText[subject.subjectId] ?? ''` contra `subject.conceptText ?? ''`.
- `handleSave` (línea 83-105): el `.map` de `assignments` añade
  `conceptText: (conceptText[subject.subjectId] ?? subject.conceptText ?? '').trim()`; el
  `.filter` exige también `assignment.conceptText.length > 0` (evita mandar texto vacío).
- Pasar `conceptText` y `onTextChange={handleTextChange}` a `<LetterConceptPicker />`
  (línea 197-202).

### `CommunicativeLetterDocument.tsx`
- Import `STATUS_ICON_JPG` desde `../statusVisuals`.
- Quitar el bloque `<Text style={styles.intro}>...</Text>` (línea ~79-82 actual).
- En `subjectHeaderRow` (línea ~86-94 actual), junto al `levelBadge` existente, añadir:
  ```tsx
  {subject.valuationType && (
    <Image src={STATUS_ICON_JPG[subject.valuationType]} style={styles.levelIcon} />
  )}
  ```
  con estilo `levelIcon: { width: 14, height: 14, marginRight: 4 }` (tamaño discreto dentro del
  header morado, junto al punto+texto existente — no se rediseña todo el bloque, solo se añade
  el ícono). Mismo `Image` de `@react-pdf/renderer` ya usado para el escudo; `STATUS_ICON_JPG`
  se referencia directamente (constante ya resuelta a nivel de módulo, sin fetch adicional por
  dimensión).

## Notas
- Decisión confirmada con el usuario: el `Select` de conceptos candidatos sigue mostrándose
  solo cuando hay 2+ candidatos (sin cambios respecto a RPT-03); lo nuevo es que el **texto**
  del concepto asignado (venga del banco o de una selección) se vuelve editable libremente vía
  `SquarePen`, y ese texto editado es lo que se persiste como snapshot — desacoplado de la
  `description` original del `Concept` en el banco.
- Decisión confirmada: el badge de estado se **mueve** (no se duplica) de la tarjeta de
  concepto a la caja nueva de la derecha.
- No se crean assets: los 6 archivos (`achieved-icon.svg/jpg`, `in-process-icon.svg/jpg`,
  `with-dificulty-icon.svg/jpg`) ya existen en `quartz-web/src/assets/images/`.
- La "optimización" del PDF pedida en el punto 3 se resuelve con importación estática única por
  ícono (Vite resuelve cada import a una sola URL de asset); referenciar la misma constante en
  N dimensiones no genera N cargas — no se requiere lógica de caché manual.
- Datos históricos (valuaciones evaluadas antes de este spec) no tienen `assignedConceptText`;
  el *fallback* del criterio EARS correspondiente cubre ese caso sin backfill.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- Manual: en `/evaluación`, abrir una carta con una dimensión con 2+ conceptos candidatos →
  cambiar `Select` → el texto se reinicia a la descripción del nuevo concepto → editar el texto
  con `SquarePen` → guardar → recargar y confirmar que persiste el texto editado. Editar la
  `description` del `Concept` original desde `/academico/conceptos` → confirmar que la carta ya
  guardada NO cambia. En `/informes`, confirmar ícono JPG de estado por dimensión y ausencia
  del párrafo introductorio en el PDF.
