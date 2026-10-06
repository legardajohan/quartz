# ACAD-05 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| tocar | `src/features/auth/auth.types.ts` → `GradeLevel` (3 valores), `GRADE_LEVELS`, `ISessionData.offeredLevels` |
| tocar | `src/features/auth/auth.model.ts` → enum de `gradesTaught` (ya usa `Object.values(GradeLevel)`) |
| tocar | `src/features/auth/auth.service.ts` → `getSessionData` |
| tocar | `src/features/institution/institution.model.ts` → `settings.offeredLevels` |
| tocar | `src/features/institution/institution.types.ts` → `IInstitutionSettings`, `UpdateInstitutionSettingsData` |
| tocar | `src/features/institution/institution.validation.ts` → `updateInstitutionSettingsSchema` |
| tocar | `src/features/institution/institution.service.ts` → `getInstitutionSettings`, `mapInstitutionToDTO`, `updateInstitutionSettings` |
| tocar | `src/features/users/users.service.ts` → `createUser`, `updateUser` (grado ⊂ `offeredLevels`; estudiante = 1 grado) |
| tocar | `src/features/checklist-template/checklist-template.validation.ts` · `src/features/learning/learning.validation.ts` → `z.nativeEnum(GradeLevel)` |
| crear | `scripts/migrate-grade-levels.ts` (o ruta equivalente de scripts del paquete) |
| tocar | `dev/data_base/insert-db.js` (+ `insert.learnings.db.js` si usa valores fuera del enum) |

### quartz-web
| Acción | Ruta |
|---|---|
| tocar | `src/types/domain.ts` → `GradeLevel`, `GRADE_LEVELS`, `ISessionData.offeredLevels` |
| tocar | `src/features/auth/seedSessionCatalogs.ts` → siembra `offeredLevels` |
| tocar | `src/features/institution/types` → `InstitutionSettingsDto`, `UpdateInstitutionSettings` |
| crear | `src/features/institution/queries/useOfferedLevels.ts` |
| crear | `src/features/institution/components/LevelsPanel.tsx` |
| tocar | `src/features/configuration/pages/ConfigurationPage.tsx` → `STEPS` + texto "seis pasos" |
| tocar | `src/features/users/components/UserForm.tsx` · `pages/UsersPage.tsx` |
| tocar | `src/features/dashboard/components/DashboardFilters.tsx` |
| tocar | `src/features/report/pages/ReportsPage.tsx` · `components/ConsolidatedReportsPanel.tsx` |
| tocar | `src/features/student-valuation/pages/StudentValuationsPage.tsx` |
| tocar | `src/features/checklist-template/components/ChecklistCreateForm.tsx` |
| tocar | `src/features/learning/pages/LearningsPage.tsx` (hoy `grade: "Transición"` fijo en `:186`) |

### Docs
`docs/domain.md` (Fase y alcance) · `docs/data-model.md` (`Institution.settings`, `User.gradesTaught`) · `CLAUDE.md`, `quartz-api/CLAUDE.md`, `quartz-web/CLAUDE.md` (línea de sistema).

## Contratos
### Tipos
```ts
export enum GradeLevel { PREJARDIN = 'Prejardín', JARDIN = 'Jardín', TRANSICION = 'Transición' }
export const GRADE_LEVELS: readonly GradeLevel[] = [PREJARDIN, JARDIN, TRANSICION]; // orden 3→5 años
// IInstitutionSettings / ISessionData
offeredLevels: GradeLevel[];
```
Web: `type GradeLevel = 'Prejardín' | 'Jardín' | 'Transición'` + `export const GRADE_LEVELS = [...] as const` (fuente única; los componentes importan, no re-hardcodean).

### Modelo Mongoose
`Institution.settings.offeredLevels: { type: [String], enum: Object.values(GradeLevel), default: [GradeLevel.TRANSICION] }`.

### Zod (`updateInstitutionSettingsSchema`, dentro del `settings` ya `.strict()`)
`offeredLevels: z.array(z.nativeEnum(GradeLevel)).min(1, 'Selecciona al menos un nivel.').refine(sin duplicados).optional()`. Lista vacía → 422 desde el service (mismo patrón que `enabledReports`); duplicados/enum inválido → 400 de Zod.

### Service
- `updateInstitutionSettings`: al quitar niveles, `countDocuments` en `User` (`findScoped`, `gradesTaught: { $in: removed }`); si > 0 → `AppError(..., 409)`.
- `createUser`/`updateUser`: `offeredLevels` desde `getInstitutionSettings(institutionId)`; `gradesTaught ⊄ offeredLevels` → `AppError(422)`; Estudiante → longitud 1 también en `updateUser`.

### Endpoints
Sin rutas nuevas: `PATCH /api/institutions/me` y `GET /api/institutions/me/settings` ya existen (`authenticateJWT → requireTenant → authorize([JEFE_DE_AREA]) → validate(...)` en el PATCH).

### Frontend
- `useOfferedLevels()` → `{ levels: GradeLevel[]; isSingle: boolean }` sobre `useInstitutionSettingsQuery()` (estable: constante de módulo como fallback `['Transición']`).
- `LevelsPanel`: patrón de `ReportSettingsPanel` (estado local sincronizado por `useEffect`, `isDirty`, `toast.promise`, `useUpdateInstitutionSettingsMutation`); etiquetas con edad ("Prejardín · 3 años").
- Reutilizar Select/Checkbox de material-tailwind (memoria `feedback_reuse_material_tailwind`).

## Notas
- `GradeLevel` del front sigue duplicado a mano del backend; el comentario de espejo se mantiene (como `passwordPolicy.ts`).
- Estudiantes ya creados con `1ro…` solo existen en datos de prueba: la migración los lleva a `Transición`; no hay compat hacia atrás en el enum.
- Docente: `gradesTaught` ⊂ `offeredLevels`; "Cursos a cargo" ofrece solo los ofertados.
- El filtro de grado del dashboard sigue opcional ("Todos los grados").

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint` (12 problemas preexistentes ajenos)
- `npm run dev` en ambos: cero errores en consola.
- Manual: guardar 1/2/3 niveles; quitar nivel en uso → 409; vaciar → 422; selectores/filtros acotados; crear estudiante con nivel no ofertado → 422; migración en base de prueba.
