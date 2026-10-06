# USR-05 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `package.json` → dependencia `exceljs` |
| tocar | `src/middlewares/upload.middleware.ts` → `uploadSpreadsheetSingle` |
| tocar | `src/repositories/base.repository.ts` → `insertManyScoped` |
| crear | `src/services/spreadsheet.service.ts` |
| tocar | `src/features/users/users.types.ts` |
| tocar | `src/features/users/users.validation.ts` |
| tocar | `src/features/users/users.service.ts` → exportar `issueInvitation`, `normalizeEmail`, `isStaffRole` |
| crear | `src/features/users/users-import.service.ts` |
| tocar | `src/features/users/users.controller.ts` |
| tocar | `src/features/users/users.routes.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/users/types/api.ts` · `src/features/users/types/index.ts` |
| crear | `src/features/users/queries/useUserImportQuery.ts` |
| crear | `src/features/users/components/UserImportModal.tsx` |
| tocar | `src/features/users/pages/UsersPage.tsx` |

## Contratos
### Tipos / DTOs (`users.types.ts`, espejo en `types/api.ts`)
```ts
export const IMPORT_KINDS = ['students', 'staff'] as const;
export type ImportKind = typeof IMPORT_KINDS[number];
export const IMPORT_MAX_ROWS: Record<ImportKind, number> = { students: 500, staff: 100 };

// Fila ya normalizada (trim, email en minúsculas, sede/jornada resueltas a id).
export interface ImportRowDTO {
  row: number;                       // fila de Excel (≥ 2)
  role: WritableUserRole;            // students ⇒ Estudiante
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: IdentificationType;
  identificationNumber: number;
  phoneNumber?: string;
  email?: string;                    // obligatorio si role ∈ STAFF_ROLES
  schoolId: string;
  schoolName: string;                // solo para mostrar en la preview
  shiftId?: string;                  // solo Estudiante
}

export interface ImportRowError { row: number; reasons: string[] }
export interface ImportPreview { valid: ImportRowDTO[]; invalid: ImportRowError[] }
export interface ImportResult {
  created: number;
  skipped: ImportRowError[];
  invitationsFailed: { row: number; email: string }[];
}
```

### `spreadsheet.service.ts` (transversal, sin negocio)
| Función | Firma | Notas |
|---|---|---|
| `buildWorkbook` | `(sheet: { name; columns: { header; width?; list?: string[] }[] }) => Promise<Buffer>` | Hoja oculta `Listas` + `dataValidation` tipo `list` por columna con `list`; encabezados en negrita, fila 1 congelada |
| `readSheetRows` | `(buffer: Buffer, expectedHeaders: string[]) => Promise<{ row: number; cells: Record<string, string> }[]>` | Verifica firma ZIP (`PK\x03\x04`) → `AppError 422`; lee la 1ª hoja; compara encabezados normalizados; omite filas vacías; convierte toda celda a `string` (números, fórmulas `result`, rich text) |

### Modelo
- Sin cambios en `User`. Se apoya en el índice único `{ institutionId, identificationNumber }` (`auth.model.ts:62`).
- `insertManyScoped(model, institutionId, docs[], options)` → `model.insertMany(docs.map(d => ({ ...d, institutionId })), { ordered: false, ...options })`.

### Zod (`users.validation.ts`)
| Schema | Forma |
|---|---|
| `importTemplateSchema` | `{ query: { kind: z.enum(IMPORT_KINDS) } }` |
| `previewImportSchema` | `{ query: { kind: z.enum(IMPORT_KINDS) } }` |
| `confirmImportSchema` | `{ body: { kind, rows: z.array(importRowSchema).min(1).max(500) } .strict() }` + `refine` `rows.length ≤ IMPORT_MAX_ROWS[kind]` |

`importRowSchema`: mismos campos de `ImportRowDTO` con reglas de `baseUserFields`; `schoolName` se ignora en confirm (se re-resuelve por `schoolId`).

### Endpoints
Declarados **antes** de `/:userId` en `users.routes.ts`.

| Método | Ruta | Rol | Middlewares | Respuesta |
|---|---|---|---|---|
| GET | `/api/users/import/template?kind=` | Jefe de Área | `authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(importTemplateSchema)` | `200` binario, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="plantilla-<estudiantes\|equipo-docente>.xlsx"` |
| POST | `/api/users/import/preview?kind=` | Jefe de Área | `… → validate(previewImportSchema) → uploadSpreadsheetSingle` | `200 ImportPreview` |
| POST | `/api/users/import` | Jefe de Área | `… → validate(confirmImportSchema)` | `201 ImportResult` |

### `uploadSpreadsheetSingle` (`upload.middleware.ts`)
- `multer.memoryStorage()`, campo `file`, `limits.fileSize = 1 MB`.
- `fileFilter`: mimetype `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` → si no, `AppError 422` (mensajes del spec).
- Sin archivo → `AppError 422` "Selecciona un archivo .xlsx.".

### `users-import.service.ts`
| Función | Firma |
|---|---|
| `buildImportTemplate` | `(institutionId, kind) => Promise<Buffer>` |
| `previewImport` | `(institutionId, kind, buffer) => Promise<ImportPreview>` |
| `confirmImport` | `(institutionId, kind, rows: ImportRowDTO[]) => Promise<ImportResult>` |

Internas:
- `IMPORT_COLUMNS[kind]` (encabezados + clave de campo + obligatoria); Jornada solo si `multipleShifts`.
- `loadImportContext(institutionId)` → `findScoped(SchoolModel, …).select('_id name').lean()` → `Map<normalize(name), {_id, name}>`; `getShiftSettings` → `Map<normalize(name), _id>`.
- `parseRawRow(cells, kind, ctx)` → `{ dto?: ImportRowDTO; reasons: string[] }` (campos, enums, entero positivo, email con `z.string().email()`, sede, jornada).
- `checkDuplicates(rows, institutionId)` (compartida preview/confirm):
  - en archivo: `Map<identificationNumber, primeraFila>` y `Map<email, primeraFila>`;
  - en BD: `findScoped(User, institutionId, { identificationNumber: { $in } }).select('identificationNumber').lean()`; `User.find({ email: { $in } }).select('email').lean()` (global, igual que `assertUniqueEmail`).
- `normalize(s)` = `trim` + minúsculas + `normalize('NFD')` sin diacríticos.
- `confirmImport`: revalida `schoolId` ∈ sedes del tenant, `shiftId` ∈ jornadas habilitadas, `role` coherente con `kind` (`students` ⇒ solo `Estudiante`; `staff` ⇒ `STAFF_ROLES`), duplicados → arma docs (`gradesTaught`, `accountStatus: 'Pendiente'` en staff, `email` vía `normalizeEmail`, `ObjectId` de sede/jornada) → `insertManyScoped` en `try/catch` de `MongoBulkWriteError`: `writeErrors[].index` → `skipped` con motivo de duplicado; `insertedDocs` → creados.
- Staff: `for…of` secuencial sobre creados → `issueInvitation(institutionId, id)`; error → `invitationsFailed`.

### Controllers (`users.controller.ts`)
- `getImportTemplateController` → `res.setHeader(...)`, `res.send(buffer)`.
- `previewImportController` → `previewImport(institutionId, kind, req.file!.buffer)`.
- `confirmImportController` → `res.status(201).json(...)`.

### Frontend
- `useUserImportQuery.ts`:
  - `downloadImportTemplate(kind)` → `apiClient.get('/users/import/template', { params: { kind }, responseType: 'blob' })` → `URL.createObjectURL` + `<a download>` → `revokeObjectURL`.
  - `usePreviewImportMutation()` → `apiPost<ImportPreview, FormData>('/users/import/preview', fd, { params: { kind }, headers: multipart })`.
  - `useConfirmImportMutation()` → `apiPost<ImportResult>('/users/import', { kind, rows })`; `onSuccess` invalida `['users']` y `['dashboard']`.
- `UserImportModal.tsx` (props: `open`, `kind`, `onClose`), `Dialog` de material-tailwind; estado `step: 'select' | 'preview' | 'result'`:
  1. **select**: texto con columnas obligatorias, botón "Descargar plantilla", `<input type="file" accept=".xlsx">`, botón "Validar archivo".
  2. **preview**: "N usuarios listos para crear" + tabla filas omitidas (Fila · Motivos, scroll interno); "Volver" / "Crear N usuarios" (disabled si N=0 o `isPending`).
  3. **result**: creados, omitidos (tabla), invitaciones no enviadas (sugiere "Reenviar invitación"); "Cerrar".
  - Errores `422` del archivo → mensaje con `extractErrorMessage` en el paso 1.
  - Cerrar en cualquier paso resetea el estado.
- `UsersPage.tsx`: botón "Cargue masivo" (`ArrowUpTrayIcon`, estilo secundario outline púrpura) junto a "Crear", solo si `canCreate`; `kind = isStaffTab ? 'staff' : 'students'`.

## Notas
- **Stateless**: confirm recibe las filas válidas como JSON y revalida todo; no se guarda estado de la preview en servidor. Evita sesiones de import y tolera cambios entre pasos.
- `users-import.service.ts` separado de `users.service.ts` (~700 líneas) por responsabilidad única; mismo feature.
- `exceljs` en vez de SheetJS: la versión npm de SheetJS está desactualizada y con CVEs; `exceljs` escribe validaciones de datos.
- Listas desplegables con más de 255 caracteres totales requieren rango en hoja `Listas` (no lista inline): siempre se usa rango.
- Tope 100 filas en staff: los correos se envían en la misma petición; ~100 × SMTP cabe en el timeout.
- `normalizeEmail` y la unicidad global de correo replican USR-04; no se duplica la lógica.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Manual (Jefe de Área):
  - Descargar ambas plantillas; con `multipleShifts` on/off verificar columna Jornada y desplegables.
  - Subir archivo con: filas válidas, fila vacía, fila sin nombre, ID repetido en archivo, ID existente en BD, sede inexistente, correo repetido → preview con motivos exactos.
  - Confirmar → solo válidas creadas; staff `Pendiente` con correo recibido; tabla y dashboard actualizados.
  - `.xls`, `.xlsx` renombrado, > 1 MB, encabezados alterados, 0 filas, > límite → `422`.
  - Docente: sin botón; endpoints → `403`.
