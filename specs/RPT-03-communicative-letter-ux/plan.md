# RPT-03 — Plan técnico

## Archivos

### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/report/report.validation.ts` |
| tocar | `src/features/report/report.service.ts` |
| tocar | `src/features/report/report.controller.ts` |
| tocar | `src/features/report/report.routes.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/report/usePdfShieldImage.ts` |
| tocar | `src/features/report/components/ChecklistReportModal.tsx` |
| tocar | `src/features/report/components/CommunicativeLetterDocument.tsx` |
| tocar | `src/features/report/components/CommunicativeLetterModal.tsx` |
| tocar | `src/features/report/components/LetterConceptPicker.tsx` |
| crear | `src/features/report/pages/CommunicativeLetterEditPage.tsx` |
| tocar | `src/App.tsx` |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` |
| tocar | `src/features/student-valuation/components/StudentValuationTable.tsx` |
| tocar | `src/features/report/components/ReportsTable.tsx` |
| tocar | `src/features/institution/components/ReportSettingsPanel.tsx` |

## Contratos

### Tipos / DTOs
Sin cambios. Reutiliza `ICommunicativeLetterTemplate`, `ILetterSubjectBlock`,
`ILetterConceptOption`, `ConceptAssignmentUpdate` (`quartz-web/src/features/report/types/api.ts`).

### Endpoint nuevo (mirror exacto de `/checklist/:valuationId/shield`)
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/reports/communicative-letter/:valuationId/shield` | Jefe de Área, Docente | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA, DOCENTE]) → validate(getCommunicativeLetterShieldSchema) → asyncHandler` |

Respuesta: `200` `Buffer` con `Content-Type` del `image` devuelto por `getImage(key)` (mismo
storage service que usa el checklist) · `404` `{ message }` si no hay `shieldJpgUrl` o la
imagen no existe en R2 · `409` si `globalStatus !== GlobalValuationStatus.COMPLETED` · `403` si
`requestorRole === DOCENTE` y el estudiante no pertenece a su sede.

Registrar la ruta en `report.routes.ts` después de `GET /communicative-letter/:valuationId`
(no colisiona con `/communicative-letter/availability`: distinto número de segmentos de path).

### Zod
```ts
// report.validation.ts — idéntico a getChecklistReportShieldSchema
export const getCommunicativeLetterShieldSchema = z.object({
  params: z.object({ valuationId: objectIdSchema }).strict(),
});
```

### Service (`report.service.ts`)
`getCommunicativeLetterShield(valuationId, institutionId, requestorRole, requestorSchoolId)`
— cuerpo idéntico a `getChecklistReportShield` (líneas 306-344 actuales): valida
`GlobalValuationStatus.COMPLETED`, resuelve `studentDoc.schoolId` con `findOneScoped`, valida
sede si `DOCENTE`, lee `Institution.shieldJpgUrl`, `keyFromPublicUrl` → `getImage(key)`.
Ambos reportes comparten exactamente esta lógica de resolución de escudo (mismo campo
`Institution.shieldJpgUrl`, no hay una versión "para carta" distinta) — se duplica la función
en vez de compartirla, siguiendo el patrón ya establecido en este archivo (checklist y letter
son funciones paralelas independientes, no una abstracción común).

### Controller (`report.controller.ts`)
`getCommunicativeLetterShieldController` — mismo patrón que
`getChecklistReportShieldController`: extrae `valuationId` de `params`, `institutionId`/
`schoolId`/`role` de `req.user!`, llama al service, `res.setHeader('Content-Type', ...)` +
`res.send(buffer)`.

### Frontend

**`usePdfShieldImage.ts`** — cambiar firma de
`usePdfShieldImage(valuationId, hasSource)` a
`usePdfShieldImage(valuationId, hasSource, reportKind: 'checklist' | 'communicative-letter')`;
construir la URL como `` `/reports/${reportKind}/${valuationId}/shield` `` en vez del literal
fijo `/reports/checklist/...`. Único call site existente (`ChecklistReportModal.tsx`) pasa
`'checklist'`; `CommunicativeLetterModal.tsx` pasa `'communicative-letter'`.

**`CommunicativeLetterDocument.tsx`** — añadir prop `shieldSrc?: string | null` a
`CommunicativeLetterDocumentProps`. Reemplazar:
```tsx
<View style={styles.shieldBox}>
  <Text style={styles.shieldPlaceholderText}>Escudo</Text>
</View>
```
por (idéntico patrón a `ChecklistReportDocument.tsx`):
```tsx
{shieldSrc && (
  <View style={styles.shieldBox}>
    <Image src={shieldSrc} style={styles.shieldImage} />
  </View>
)}
```
Añadir `Image` al import de `@react-pdf/renderer` y el estilo `shieldImage` (copiar de
`ChecklistReportDocument.tsx`: `{ width: 56, height: 56, objectFit: "contain" }`); quitar
`shieldPlaceholderText` del `StyleSheet` si queda sin uso.

**`CommunicativeLetterModal.tsx`** — reescribir sobre el esqueleto de `ChecklistReportModal.tsx`:
- Quitar: import de `LetterConceptPicker`, estados `selection`/`isSaving`, `useDeferredValue`,
  `isDirty`, `previewLetter` (memo de merge de selección), `handleSelect`, `handleSave`,
  `DialogFooter` con botón "Guardar", import de `ConceptAssignmentUpdate` y `saveLetterConcepts`.
- Mantener: `useEffect` de `fetchCommunicativeLetter`/`clearLetter`, header con
  `PDFDownloadLink` + botón cerrar, estados de loading/error (incluye el caso "Faltan
  conceptos" ya existente), `DialogBody` con `PDFViewer` a ancho completo (`flex-1`, sin panel
  lateral de 340px).
- Añadir: `const shield = usePdfShieldImage(valuationId ?? undefined, !!currentLetter?.institution.shield, 'communicative-letter')`;
  `isPdfReady` incorpora `!shield.isLoading`; pasar `shieldSrc={shield.src}` a
  `CommunicativeLetterDocument` tanto en `PDFViewer` como en `PDFDownloadLink`.

**`LetterConceptPicker.tsx`** — en la rama `evaluationMode === "checklist"` (líneas 42-74
actuales):
- Si `subject.availableConcepts.length > 1`: reemplazar el bloque de `Radio` por un
  `Select`/`Option` (`@material-tailwind/react`, mismo patrón que
  `features/concept/components/ConceptForm.tsx`), `value={selectedId}`,
  `onChange={(value) => value && onSelect(subject.subjectId, value)}`, una `Option` por
  `concept` con `concept.description` como label.
- Si `=== 1`: renderizar el único `concept.description` como texto de solo lectura (mismo
  estilo de caja que el bloque `evaluationMode === "description"` de arriba), sin `Select` ni
  `Radio` — no hay nada que elegir.
- Firma del componente (`subjects`, `selection`, `onSelect`, `disabled`) no cambia.

**`CommunicativeLetterEditPage.tsx`** (nuevo, en `src/features/report/pages/`) — estructura
calcada de `StudentValuationDetail.tsx`:
- `useParams<{ studentId: string; valuationId: string }>()`, `useNavigate()`.
- `useReportStore()`: `currentLetter`, `isLetterLoading`, `letterError`,
  `fetchCommunicativeLetter`, `saveLetterConcepts`, `clearLetter` (todos ya existentes, sin
  cambios de store).
- `useEffect` en mount: `fetchCommunicativeLetter(valuationId)`; cleanup: `clearLetter()`.
- Estado local `selection: Record<string, string>` seedeado desde
  `currentLetter.subjects[].assignedConceptId` (mismo `useEffect` que hoy tiene
  `CommunicativeLetterModal.tsx`); `isDirty` con la misma comparación.
- `useUsersQuery({ id: studentId })` para avatar (solo lectura, sin `ImageCropUploader` — esta
  vista no sube fotos).
- Header: `IconButton` con SVG "volver" (mismo inline SVG que `StudentValuationDetail.tsx`) →
  `navigate('/evaluacion')`; título "Carta Comunicativa" + badge de periodo
  (`currentLetter.period.name`); bloque avatar + nombre (`formatFullName(currentLetter.student)`).
- Cuerpo: `<LetterConceptPicker subjects={currentLetter.subjects} selection={selection} onSelect={...} disabled={isSaving} />`.
- Footer sticky (mismo patrón visual que `StudentValuationDetail.tsx`): "Deshacer cambios"
  (resetea `selection` a los `assignedConceptId` del servidor) / "Guardar"
  (`saveLetterConcepts(valuationId, assignments)` con el mismo mapeo que hace hoy
  `CommunicativeLetterModal.handleSave`), visible solo si `isDirty`.
- Bloqueo de navegación: `useBlocker(({currentLocation, nextLocation}) => isDirty && currentLocation.pathname !== nextLocation.pathname)`
  + `ConfirmationModal` (mismo patrón que `StudentValuationDetail.tsx`).
- Estados de loading/error: mismo tratamiento que el modal actual (incluye mensaje especial
  cuando `letterError` contiene "faltan conceptos").
- **Sin** `PDFViewer`, `PDFDownloadLink`, `usePdfShieldImage` — esta vista no genera PDF.

**Ruta (`App.tsx`)** — añadir junto a las rutas `/evaluacion` existentes (dentro del mismo
`<Route element={<ProtectedRoute />}>`):
```tsx
<Route path="/evaluacion/:studentId/carta-comunicativa/:valuationId" element={<CommunicativeLetterEditPage />} />
```

**`StudentValuationsPage.tsx`** — quitar `import CommunicativeLetterModal`, estados
`selectedLetterValuationId`/`selectedLetterStudentName` y el `<CommunicativeLetterModal .../>`
del JSX. `handleViewLetter` pasa a recibir `(studentId, valuationId)` y hacer
`navigate(\`/evaluacion/${studentId}/carta-comunicativa/${valuationId}\`)`.

**`StudentValuationTable.tsx`** — prop `onViewLetter?: (studentId: string, valuationId: string) => void`;
`onClick={() => user.valuations[0] && onViewLetter?.(user._id, user.valuations[0]._id)}`.
Iconos: `import { Plus, ClipboardList, Mail, Trash2 } from "lucide-react"` reemplaza el import
de `@heroicons/react`; mismas clases Tailwind condicionales de color que hoy (`h-5 w-5
text-...`/`h-4 w-4`).

**`ReportsTable.tsx`** — `import { ClipboardList, Mail } from "lucide-react"` reemplaza
`ClipboardDocumentListIcon`/`EnvelopeIcon`; mismas clases condicionales.

**`ReportSettingsPanel.tsx`** — línea 19: `"Informe narrativo para las familias (próximamente)."`
→ `"Informe narrativo para las familias, con edición de conceptos por dimensión."`

## Notas
- El escudo de Carta Comunicativa reutiliza `Institution.shieldJpgUrl` (JPEG precomputado al
  subir, por INF-01) — no hay conversión de formato adicional que hacer en este spec; ese
  problema ya lo resolvió el backend al precomputar el JPEG en la subida.
- La duplicación de `getChecklistReportShield`/`getCommunicativeLetterShield` es intencional:
  sigue el patrón existente en `report.service.ts` donde checklist y carta son funciones
  paralelas independientes (no comparten un helper), igual que `getChecklistReport`/
  `getCommunicativeLetterReport`.
- `LetterConceptPicker.tsx` es el único componente compartido entre la vista de edición nueva
  y (antes) el modal de Informes; tras este cambio queda usado únicamente por
  `CommunicativeLetterEditPage.tsx`.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola; probar los dos flujos manuales
  descritos en `spec.md`.
