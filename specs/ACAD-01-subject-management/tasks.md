# ACAD-01 — Tasks

## Preparación
- [x] Crear rama `feat/ACAD-01-subject-management` desde `develop`.

## Backend (`quartz-api`)
- [x] `subject.types.ts` — crear: enums `SubjectType`, `SubjectEvaluationMode`; `ISubjectDTO`, `CreateSubjectData`, `UpdateSubjectData`.
- [x] `subject.model.ts` — añadir `evaluationMode` (`default: CHECKLIST`); `institutionId` → `required: true` + `index: true` + `ref: 'Institution'` (**corrige el bug** `'EducationalInstitution'`, línea 15); `type`/`enum` desde `Object.values(SubjectType)`; índice único `{ institutionId: 1, name: 1 }`.
- [x] `subject.validation.ts` — crear: `createSubjectSchema`, `updateSubjectSchema`, `deleteSubjectSchema`. Ninguno acepta `institutionId`.
- [x] `subject.service.ts` — quitar `try/catch` + `console.error` + `throw new Error` de `getSubjectsByInstitution` y mapear `type`/`evaluationMode`; añadir `createSubject` / `updateSubject` / `deleteSubject` sobre `base.repository` (`createScoped`, `findOneAndUpdateScoped`, `deleteOneScoped`), con `AppError` 409/404.
- [x] `subject.controller.ts` — añadir `createSubjectController`, `updateSubjectController`, `deleteSubjectController`. Sin `try/catch`, `institutionId` vía `req.user!.institutionId.toString()`.
- [x] `subject.routes.ts` — añadir `POST /`, `PATCH /:subjectId`, `DELETE /:subjectId` con `authorize([UserRole.JEFE_DE_AREA])` + `validate(...)` + `asyncHandler`. `GET /` sin cambios.
- [x] `auth/auth.types.ts` — `ISessionData['subjects']` gana `type` y `evaluationMode`.
- [x] `auth/auth.service.ts` — `getSessionData()` mapea los dos campos nuevos.
- [x] No tocar `app.ts`: `/api/subjects` ya está montado (línea 32).

## Frontend (`quartz-web`)
- [x] `src/types/domain.ts` — `interface Subject` gana `type` y `evaluationMode` (union de strings, según la convención del archivo).
- [x] `features/subject/types/` → `api.ts`, `store.ts`, `index.ts`.
- [x] `features/subject/useSubjectStore.ts` — `fetch/create/update/delete` con `apiClient`; tras cada mutación con éxito, sincronizar `useAuthStore.setSubjects(...)`.
- [x] `features/auth/useAuthStore.ts` — acción `setSubjects(subjects)`, inmutable.
- [x] `components/router/RoleRoute.tsx` — crear.
- [x] `features/subject/components/SubjectForm.tsx` — presentacional, sin API.
- [x] `features/subject/components/SubjectsPanel.tsx` — `DataTable` + `FormModal` + `ConfirmationModal`; feedback con `react-hot-toast`.
- [x] `features/configuration/pages/ConfigurationPage.tsx` — shell con `Tabs`; pestaña Dimensiones → `<SubjectsPanel />`.
- [x] `App.tsx` — `/gestion/configuracion` bajo `<RoleRoute allowedRoles={['Jefe de Área']} />`, dentro de `ProtectedRoute` → `Dashboard`.
- [x] `SidebarMenu.tsx` — subItem `Configuración` + filtrado por rol (importar `useAuthStore`).
- [x] Acabado visual del panel y el formulario con las skills `impeccable`, `emil-design-eng` y `frontend-design`.

## Docs
- [x] `docs/domain.md:17` — reescribir "7 Dimensiones … **fijas**" → semilla por defecto, gestionables por institución; documentar `evaluationMode` (`checklist` | `description`) y su default.

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` en verde (`quartz-web`)
- [x] Servidor arranca sin errores de compilación ni runtime
- [x] Repaso de aislamiento: ninguna query sin `institutionId` del token; ningún esquema Zod acepta `institutionId`
- [x] Docente y Estudiante reciben `403` en `POST`/`PATCH`/`DELETE` y no ven la entrada del menú
- [x] Crear/editar/borrar una dimensión se refleja en `/academico/aprendizajes` sin re-login

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented` · PR → `develop`.
