# ACAD-01 — Plan técnico

## Archivos
### quartz-api
| Acción | Ruta |
|---|---|
| crear | `src/features/subject/subject.types.ts` |
| tocar | `src/features/subject/subject.model.ts` |
| crear | `src/features/subject/subject.validation.ts` |
| tocar | `src/features/subject/subject.service.ts` |
| tocar | `src/features/subject/subject.controller.ts` |
| tocar | `src/features/subject/subject.routes.ts` |
| tocar | `src/features/auth/auth.types.ts` |
| tocar | `src/features/auth/auth.service.ts` |

### quartz-web
| Acción | Ruta |
|---|---|
| crear | `src/features/subject/types/{api.ts,store.ts,index.ts}` |
| crear | `src/features/subject/useSubjectStore.ts` |
| crear | `src/features/subject/components/SubjectsPanel.tsx` |
| crear | `src/features/subject/components/SubjectForm.tsx` |
| crear | `src/features/configuration/pages/ConfigurationPage.tsx` |
| crear | `src/components/router/RoleRoute.tsx` |
| tocar | `src/App.tsx` |
| tocar | `src/components/layouts/SidebarMenu.tsx` |
| tocar | `src/types/domain.ts` |
| tocar | `src/features/auth/useAuthStore.ts` |

### docs
| Acción | Ruta |
|---|---|
| tocar | `docs/domain.md` |

## Contratos
### Tipos / DTOs
`subject.types.ts`:
```typescript
export enum SubjectType {
  DIMENSION = 'Dimensión',
  ASIGNATURA = 'Asignatura',
}

export enum SubjectEvaluationMode {
  CHECKLIST = 'checklist',
  DESCRIPTION = 'description',
}

export interface ISubjectDTO {
  _id: string;
  name: string;
  type: SubjectType;
  evaluationMode: SubjectEvaluationMode;
}

export type CreateSubjectData = {
  name: string;
  type: SubjectType;
  evaluationMode?: SubjectEvaluationMode;
};

export type UpdateSubjectData = Partial<CreateSubjectData>;
```
`SubjectType` y `SubjectEvaluationMode` son la **única fuente** de esos literales; `subject.model.ts` los consume vía `Object.values(...)` en el `enum` del schema. Los valores actuales `'Dimensión' | 'Asignatura'` están hoy escritos a mano en `subject.model.ts:7,17`.

### Modelo Mongoose
`subject.model.ts` — `ISubject` pasa a:

| Campo | Tipo | Notas |
|---|---|---|
| `institutionId` | `ObjectId` | **`required: true`, `index: true`**, `ref: 'Institution'` |
| `name` | `String` | `required`, `trim` |
| `type` | `String` | `enum: Object.values(SubjectType)`, `required` |
| `evaluationMode` | `String` | `enum: Object.values(SubjectEvaluationMode)`, `default: SubjectEvaluationMode.CHECKLIST` |

Índice compuesto **único**: `{ institutionId: 1, name: 1 }` → respalda el `409` por nombre duplicado.

**Corrección obligatoria:** `subject.model.ts:15` declara `ref: 'EducationalInstitution'`, pero el modelo se registra como `'Institution'` (`institution.model.ts:27`). Es un bug real: cualquier `.populate('institutionId')` sobre `Subject` lanza *MissingSchemaError*. Además hoy `institutionId` no es `required` ni está indexado, contra `quartz-api/CLAUDE.md`.

### Zod
`subject.validation.ts` — reutiliza el `objectIdSchema = /^[0-9a-fA-F]{24}$/` ya usado en `student-valuation.validation.ts`.

| Esquema | Forma |
|---|---|
| `createSubjectSchema` | `body: { name: string().trim().min(1).max(120), type: nativeEnum(SubjectType), evaluationMode: nativeEnum(SubjectEvaluationMode).optional() }` |
| `updateSubjectSchema` | `params: { subjectId: objectIdSchema }` · `body: createSubjectSchema.body.partial()` |
| `deleteSubjectSchema` | `params: { subjectId: objectIdSchema }` |

Ningún esquema acepta `institutionId`.

### Endpoints
| Método | Ruta | Rol | Middlewares |
|---|---|---|---|
| GET | `/api/subjects` | Autenticado | `authenticateJWT → requireTenant → asyncHandler` |
| POST | `/api/subjects` | Jefe de Área | `authenticateJWT → requireTenant → authorize([UserRole.JEFE_DE_AREA]) → validate(createSubjectSchema) → asyncHandler` |
| PATCH | `/api/subjects/:subjectId` | Jefe de Área | `… → validate(updateSubjectSchema) → asyncHandler` |
| DELETE | `/api/subjects/:subjectId` | Jefe de Área | `… → validate(deleteSubjectSchema) → asyncHandler` |

`GET` conserva su firma actual (sin `authorize`): la consumen Docentes y Jefes de Área. Ya está montado en `app.ts:32` — no se toca `app.ts`.

Usar el enum `UserRole` de `auth.types.ts`, **no** el literal `'Jefe de Área'`. `authorize()` está tipado como `string[]` (`role.middleware.ts`), por eso los literales sueltos de `student-valuation.routes.ts` compilan; no replicar ese patrón.

### Service
- `getSubjectsByInstitution` — hoy (`subject.service.ts:5-11`) envuelve todo en `try/catch`, hace `console.error` y lanza `throw new Error('Failed to fetch subjects.')`. Contradice `quartz-api/CLAUDE.md`: el service lanza `AppError` y el `errorHandler` central traduce. Quitar el `try/catch`, dejar que el error propague. Añadir `type` y `evaluationMode` al mapeo del DTO.
- `createSubject(institutionId, data)` → `createScoped`. Duplicado (`code === 11000`) → `AppError('Ya existe una dimensión con ese nombre en la institución.', 409)`.
- `updateSubject(subjectId, institutionId, data)` → `findOneAndUpdateScoped(..., { new: true, runValidators: true })`; `null` → `AppError('Dimensión no encontrada o no pertenece a la institución.', 404)`.
- `deleteSubject(subjectId, institutionId)` → `deleteOneScoped`; `deletedCount === 0` → `AppError(..., 404)`.

Todo sobre `repositories/base.repository.ts`, que ya fuerza `institutionId` en filtro y payload.

### auth — `sessionData`
`auth.types.ts:43-46` — `ISessionData['subjects']` pasa de `{ _id, name }[]` a `{ _id, name, type, evaluationMode }[]`.
`auth.service.ts:36` — el `map` incluye los dos campos nuevos.

Espejo en el front: `src/types/domain.ts` — `interface Subject { _id; name; }` gana `type` y `evaluationMode` (allí `UserRole` es una union de strings, no un enum; seguir esa convención: `type SubjectEvaluationMode = 'checklist' | 'description'`).

### Frontend
**`features/subject/`** — patrón canónico de `features/learning/`:
- `types/api.ts`: `NewSubject`, `UpdateSubject = Partial<NewSubject>`, `SubjectsResponse`.
- `types/store.ts`: entidad `SubjectDto` + interfaz `SubjectState`.
- `types/index.ts`: `export * from './store'; export * from './api';`
- `useSubjectStore.ts`: `subjects[]`, `isLoading`, `isSubmitting`, `error` + `fetchSubjects` / `createSubject` / `updateSubject` / `deleteSubject` sobre `apiGet/apiPost/apiPatch/apiDelete`. Convención de `useLearningStore.ts`: `fetch*` traga el error (`set({ error })`); `create/update/delete` hacen `set({ error })` **y** `throw new Error(msg)` para que `toast.promise` lo capture en la page. Inmutabilidad: `[...state.subjects, nuevo]`, `state.subjects.map(...)`, `state.subjects.filter(...)`.
- `components/SubjectsPanel.tsx`: tabla + acciones. Reutiliza `components/common/DataTable.tsx` (genérico `<T extends { _id: string }>`, paginación integrada, exporta `Column<T>` e `ITEMS_PER_PAGE`).
- `components/SubjectForm.tsx`: presentacional, sin llamadas API. Campos: `name`, `type` (Select), `evaluationMode` (Select o Radio). Se monta dentro de `components/common/FormModal.tsx`.
- Borrado con `components/common/ConfirmationModal.tsx`.

**`features/configuration/pages/ConfigurationPage.tsx`** — shell con `Tabs`/`TabsHeader`/`TabsBody` de Material Tailwind. ACAD-01 entrega solo la pestaña **Dimensiones**, que renderiza `<SubjectsPanel />`. ACAD-02 añade **Periodos** e **Informes**.

**`components/router/RoleRoute.tsx`** — nuevo:
```tsx
export const RoleRoute = ({ allowedRoles }: { allowedRoles: UserRole[] }) => { … }
```
Lee `useAuthStore((s) => s.sessionData?.user.role)`; si no está en `allowedRoles` → `<Navigate to="/dashboard" replace />`; si sí → `<Outlet />`. Se anida dentro de `ProtectedRoute`, que solo comprueba token (`ProtectedRoute.tsx:5-10`).

**`App.tsx`** — dentro de `<ProtectedRoute>` → `<Dashboard>`:
```tsx
<Route element={<RoleRoute allowedRoles={['Jefe de Área']} />}>
  <Route path="/gestion/configuracion" element={<ConfigurationPage />} />
</Route>
```

**`SidebarMenu.tsx`** — dos cambios:
1. Añadir `{ id: 53, label: "Configuración", path: "/gestion/configuracion" }` a los `subItems` de Gestión (`SidebarMenu.tsx:70-73`). Encaja sin tocar la lógica de render.
2. Filtrado por rol: hoy `menuItems` es un array estático a nivel de módulo y el componente **no importa `useAuthStore`** — renderiza los 5 items para todos. Añadir `roles?: UserRole[]` opcional a los items/subitems (ausente = visible para todos) y filtrar contra `sessionData?.user.role` dentro del componente.

**`useAuthStore.ts`** — acción nueva `setSubjects(subjects: Subject[])` que reemplaza `sessionData.subjects` de forma inmutable. Ver Nota 1.

## Notas
1. **Staleness de `sessionData.subjects`.** Es el riesgo principal del feature. `sessionData` solo se puebla en el login (`auth.service.ts:getSessionData`) y `refreshUser()` únicamente refresca `sessionData.user` (`useAuthStore.ts:62-71`). Tres pantallas leen `sessionData.subjects` directo: `LearningsPage.tsx:20`, `ConceptsPage.tsx:20` y `StudentValuationDetail.tsx:210`. Sin sincronización, crear una dimensión y navegar a Aprendizajes muestra la lista vieja. Solución: tras cada `create/update/delete` con éxito, `useSubjectStore` llama a `useAuthStore.getState().setSubjects(...)`. Alternativa descartada: refetch global de sesión — más viajes y `sessionData` no tiene endpoint propio.

2. **El borrado libre deja `Learning` huérfanos.** Decisión tomada: CRUD sin restricciones. `ChecklistTemplate` y `StudentValuation` sobreviven porque embeben *snapshots* (`docs/data-base.md §2`) y el mapper ya es null-safe (`student-valuation.service.ts:111` → `'Asignatura no disponible'`). Pero `Learning.subjectId` **sí** queda apuntando a un documento inexistente: esos aprendizajes desaparecen de los filtros por dimensión sin aviso. Se acepta conscientemente en esta fase; si molesta en uso real, el arreglo natural es `isActive` en `Subject` + desactivar en vez de borrar.

3. **Los iconos de dimensión se reordenan al crear/borrar.** `StudentValuationDetail.tsx:209-215` asigna el icono por **índice posicional** sobre `sessionData.subjects`: `SUBJECT_ICONS[subjectIndex % SUBJECT_ICONS.length]`. Con las 7 dimensiones fijas era estable; con CRUD libre, insertar o borrar una dimensión cambia el icono de todas las demás. Se deja fuera de alcance a propósito para no inflar el spec, pero queda anotado: el arreglo es un campo `icon` en `Subject` o un mapa `name → icono`.

4. **Materias globales.** `docs/data-model.md:16` prevé `Subject.institutionId` nulo = materia global. Este spec hace el campo `required`, cerrando esa puerta por ahora — coherente con la decisión de que toda dimensión pertenece a un inquilino. Reabrirlo cuando exista el caso de uso real (grados 1°–11°, `docs/domain.md:6`).

5. **`docs/domain.md:17`** declara las 7 dimensiones como **fijas**. Este feature relaja ese invariante: pasan a ser semilla por defecto. La línea debe reescribirse en el mismo PR, o el doc queda mintiendo.

## Verificación
- `cd quartz-api && npx tsc --noEmit`
- `cd quartz-web && npm run build && npm run lint`
- `npm run dev` en ambos paquetes: cero errores en consola.
- Login como Jefe de Área → `/gestion/configuracion` monta; login como Docente → redirige a `/dashboard` y el menú no muestra la entrada.
- Crear una dimensión → aparece en el select de `/academico/aprendizajes` sin volver a iniciar sesión.
