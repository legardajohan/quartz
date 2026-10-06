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
`offeredLevels: z.array(z.nativeEnum(GradeLevel)).refine(sin duplicados).optional()` — **sin `.min(1)`**: la lista vacía llega al service y responde 422 (mismo patrón que `enabledReports`); duplicados/enum inválido → 400 de Zod.

### Service
- `createUser`/`updateUser`: `offeredLevels` desde `getOfferedLevels(institutionId)`; `gradesTaught ⊄ offeredLevels` → `AppError(422)`; Estudiante → longitud 1 también en `updateUser`.
- `updateInstitutionSettings` → ver "Enmienda: quitar un nivel".

## Enmienda: quitar un nivel (2026-10-06)
Reemplaza la regla original del 409 (usuarios + aprendizajes + plantillas).

### `quartz-api/src/features/institution/institution.service.ts`
| Función | Cambio |
|---|---|
| `assertLevelNotInUse(institutionId, level)` → renombrar a `assertNoStudentsInLevel` | Solo `findScoped(User, institutionId, { role: UserRole.ESTUDIANTE, gradesTaught: level }).countDocuments()`; > 0 → `AppError('El nivel «<nivel>» tiene N estudiante(s). Cámbialos de nivel antes.', 409)`. Se retiran los conteos de `LearningModel` y `ChecklistTemplateModel`. |
| nueva `reassignTeachersForRemovedLevels(institutionId, removed, nextLevels): Promise<number>` | 1) `User.updateMany({ institutionId, role: DOCENTE, gradesTaught: { $in: removed } }, { $pull: { gradesTaught: { $in: removed } } })`. 2) `User.updateMany({ institutionId, role: DOCENTE, gradesTaught: { $size: 0 } }, { $set: { gradesTaught: sortLevels(nextLevels) } })`. Devuelve `modifiedCount` del paso 1. `institutionId` siempre del token. |
| `updateInstitutionSettings` | Orden: validar todo (incluido el 409 de estudiantes para **cada** nivel quitado) → `findByIdAndUpdate($set)` → `reassignTeachersForRemovedLevels`. El conteo de docentes ajustados se devuelve en el DTO como `adjustedTeachers?: number` (solo si > 0). |

Riesgo: sin transacción, si el `$set` de la institución pasa y el `updateMany` falla, quedan docentes con un nivel ya no ofertado; es inocuo (solo se ve en su ficha) y se corrige al reintentar el guardado. No se introduce transacción (el proyecto no usa sesiones Mongo).

### Ocultar aprendizajes y plantillas de niveles no ofertados
| Archivo | Cambio |
|---|---|
| `src/features/learning/learning.service.ts` → `getAllLearnings` (`:45`) | Añadir `grade: { $in: await getOfferedLevels(institutionId) }` al filtro (si llega `filter.grade`, se intersecta). |
| `src/features/checklist-template/checklist-template.service.ts` (`:73`, listado) | Mismo filtro `grade: { $in: offeredLevels }`. |
| `src/features/institution/institution.types.ts` | `IInstitutionDTO.adjustedTeachers?: number` (solo respuesta del PATCH). |

Revisar en la implementación los consumidores de aprendizajes fuera del listado (dashboard, valoración, informes): como un nivel con estudiantes no se puede quitar, no deberían verse afectados; confirmarlo y anotarlo.

### `quartz-web`
| Archivo | Cambio |
|---|---|
| `src/features/institution/components/LevelsPanel.tsx` | Toast de éxito: "Niveles guardados" + ", se ajustaron N docentes" si `adjustedTeachers`. El 409 se muestra con `extractErrorMessage` (sin cambios). |
| `src/features/institution/types/api.ts` | `adjustedTeachers?: number` en el DTO. |
| tras guardar | Invalidar `['learnings']`, `['checklist-templates']` (o sus factories de keys) y `['users']`, porque cambian sus listados. |

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

## Desvíos durante la implementación
- Migración en `quartz-api/scripts/migrate-grade-levels.js` (JS, como `migrate-period-year.js`; se corre con `node`).
- `learning/components/LearningForm.tsx` + `learning/types/api.ts`: el formulario no tenía campo de grado; ahora lleva el selector "Nivel" (oculto con un único nivel) y `Learning.grade`/`NewLearning.grade` son `GradeLevel`.
- `src/lib/diffChanges.ts`: `diffLearning` reporta cambio de nivel en el aviso de conflicto.
- Zod de `offeredLevels` sin `.min(1)`: el vacío llega al service y responde `422` (como pide el spec), no `400`.
- Cargue masivo (antes fuera de alcance → USR-06): `users-import.service.ts` (columna de nivel condicional, `gradeReasons` en preview y confirm), `ImportRowDTO.gradesTaught` en API/web, `importRowSchema` y texto de ayuda en `UserImportModal`.
- `institution.service.ts → assertLevelNotInUse`: el 409 cuenta también aprendizajes y plantillas de chequeo (`findScoped`), no solo usuarios. **Sustituido por la enmienda "Quitar un nivel".**
- `dev/data_base/insert-db.js` está en `.gitignore`: se corrigió en disco (Jefes de Área con `gradesTaught: []`, institución con `offeredLevels`), pero no entra al commit.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint` (12 problemas preexistentes ajenos)
- `npm run dev` en ambos: cero errores en consola.
- Manual: guardar 1/2/3 niveles; vaciar → 422; selectores/filtros acotados; crear estudiante con nivel no ofertado → 422; migración en base de prueba.
- Manual (enmienda): quitar Jardín con estudiantes en Jardín → 409 y nada cambia; moverlos y reintentar → guarda; docente con `[Jardín, Transición]` queda `[Transición]`; docente solo `[Jardín]` recibe los niveles restantes; Jefe de Área intacto; aprendizajes/plantillas de Jardín desaparecen del listado y reaparecen al volver a ofrecer Jardín; toast con docentes ajustados.
