# USR-06 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/users/users.types.ts` → `ImportRowDTO.grade?: GradeLevel` |
| tocar | `src/features/users/users.validation.ts` → `importRowSchema.grade` |
| tocar | `src/features/users/users-import.service.ts` → `buildColumns`, `loadImportContext`, `buildImportTemplate`, `parseRawRow`, `revalidateRow`, `buildUserDoc`, `confirmImport` |
| tocar | `src/services/mail.service.ts` → timeouts del transporte |
| tocar | `.env` (local, no versionado) → `SMTP_SECURE=false` |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/features/users/types/api.ts` → `ImportRowDto.grade?: GradeLevel` |
| tocar | `src/features/users/components/UserImportModal.tsx` → spinner, props `onCompleted(result)` |
| tocar | `src/features/users/pages/UsersPage.tsx` → toasts del resultado y cierre del modal |

## Contratos
### Tipos
```ts
// ImportRowDTO (API) / ImportRowDto (web)
grade?: GradeLevel;   // solo Estudiante; GradeLevel de ACAD-05
```
`ImportResult` no cambia: `{ created, skipped[], invitationsFailed[] }`.

### Plantilla y parseo
- `ImportField` += `'grade'`. `buildColumns('students', …)`: `Grado*` (required) entre `Sede*` y `Jornada`; `'staff'` no la incluye.
- `ImportContext` += `levels: Map<normalize(level), GradeLevel>` desde `getInstitutionSettings(institutionId).offeredLevels` (una sola llamada junto a `getShiftSettings`).
- `listFor('grade')` → `offeredLevels`.
- `parseRawRow`: vacío → `"Grado" es obligatorio.`; no resuelto → `"Grado" no es un valor permitido.`
- `buildUserDoc`: Estudiante `gradesTaught: [row.grade]`; Docente `[...offeredLevels]`; Jefe de Área `[]`. `buildUserDoc(row, offeredLevels)`.
- `revalidateRow`: Estudiante sin `grade` o ∉ `offeredLevels` → `"Grado" no es un valor permitido.`

### Zod
`importRowSchema`: `grade: z.nativeEnum(GradeLevel).optional()` (`.strict()` ya está en el objeto interno, no en el envoltorio: `quartz-api/docs/known-issues.md`).

### Endpoints
Sin cambios (`/api/users/import/{template,preview}`, `/api/users/import`).

### Invitaciones (rendimiento)
1. **Medir primero:** `console.time` temporal en `confirmImport` para `insertRows` y cada `issueInvitation` (sub-pasos: `findOneAndUpdateScoped`, `Institution.findById`, `sendMail`); registrar y retirar.
2. `mail.service.ts`: `createTransport({ …, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 })`.
3. Según la medición: `pool: true` (conexión reutilizada) si el costo es el handshake; envío con concurrencia limitada (lotes de 5 con `Promise.allSettled`) en `confirmImport` en lugar de `for…of` secuencial; el `Institution.findById` se hace una vez por import y se pasa a `issueInvitation` solo si el costo lo justifica (cambio opcional, mantiene la firma pública de USR-04 si no).
4. Si la medición muestra Mongo como cuello (latencia remota), documentarlo y no cambiar código de correo.

### Frontend
- `UserImportModal`: `handleConfirm` → `await mutateAsync` → `onCompleted(result)` y `handleClose()`; el paso `result` desaparece (la tabla de omitidas queda solo en `preview`). Botón con el SVG spinner de `components/common/FormModal.tsx` y `isBusy` bloqueando cierre.
- `UsersPage.handleImportCompleted(result, kind)`:
  - éxito: `toast.success`.
  - `invitationsFailed.length`: toast ámbar 8 s (mismo estilo que `UsersPage.tsx` en el alta individual, `ExclamationTriangleIcon`).
  - `skipped.length`: línea adicional en el toast.
- Errores: `toast.error(extractErrorMessage(...))`, modal abierto.
- Antes de editar UI: invocar `emil-design-eng`, `impeccable`, `frontend-design` (regla de `quartz-web/CLAUDE.md`).

## Notas
- Staff queda con todos los niveles ofertados por defecto; el Jefe de Área puede ajustarlos desde "Editar" (campo "Cursos a cargo").
- Decisión: el resultado detallado por fila deja de mostrarse tras confirmar; el preview ya listó las omitidas y el confirm solo omite por carreras.
- Dependencia dura de ACAD-05: no implementar USR-06 antes de que `GradeLevel` y `offeredLevels` existan.
- `NODE_ENV`/TLS: no se agrega opción de saltar verificación de certificados.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos: cero errores en consola.
- Manual (Jefe de Área): plantilla de estudiantes con `Grado*` desplegable; archivo con grado vacío/ inválido → motivos exactos; docente: spinner → cierre → toast; apagar red SMTP → toast ámbar y usuario `Pendiente` en ≤ 15 s; ID repetido, ID existente, correo repetido y correo vacío en staff → motivos exactos; tiempos con 1 y ~20 docentes.
