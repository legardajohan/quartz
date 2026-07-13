---
feature: checklist-template
status: implemented
created: 2026-06-27
---

# Spec — Lista de Chequeo (Checklist Template)

## Problema
- Como Docente, quiero crear plantillas de lista de chequeo a partir de los aprendizajes de un período
  y grado —pudiendo editar y añadir ítems— para usarlas como base en /Evaluación sin que se alteren si
  los aprendizajes originales cambian.
- Como Docente, quiero ver, editar y eliminar mis plantillas creadas para mantener mis listas al día.
- Como Jefe de Área, quiero ver el autor de cada plantilla para supervisar las listas de chequeo de la
  institución (visión orientada a una implementación futura).

## Solución (visión general)
- Nueva pantalla en `/académico/lista-chequeo` con una **vista de cards** (una por plantilla) que
  muestra nombre, período, grado y autor, con iconos de **editar** y **eliminar**.
- **Crear:** el usuario selecciona período y grado y asigna un nombre; el sistema carga los aprendizajes
  vigentes de ese período/grado **agrupados por dimensión** y los presenta en **acordeones editables**
  (mismo patrón visual que /Evaluación). El usuario puede editar el texto de cada ítem, **añadir** ítems
  con un botón "+" debajo de cada dimensión, y luego **guardar** o **cancelar**.
- La plantilla guarda los textos de los ítems como **copia (snapshot)**, sin referenciar el `id` de los
  aprendizajes; por eso cambios posteriores en los aprendizajes no afectan plantillas ya guardadas.
- **Editar:** se reabren los acordeones; un **clic sobre el texto** de un ítem activa el modo edición,
  señalado con un **indicador morado** (referencia de Tailwind del proyecto). El botón **"Guardar
  cambios"** aparece **solo si hay cambios** respecto al estado guardado; "Cancelar" descarta.
- Multi-tenancy y autorización siguen las reglas del proyecto: toda operación se limita a la institución
  del usuario y está disponible para los roles **Docente** y **Jefe de Área**.

## Criterios de aceptación (EARS)
- [x] Cuando un Docente o Jefe de Área abre `/académico/lista-chequeo`, el sistema muestra sus plantillas
  como cards con nombre, período, grado, autor y acciones de editar/eliminar.
- [x] Cuando el usuario inicia la creación y selecciona período y grado, el sistema carga los aprendizajes
  vigentes de ese período y grado agrupados por dimensión y los presenta en acordeones editables.
- [x] Mientras el usuario crea o edita una plantilla, cuando hace clic sobre el texto de un ítem, el
  sistema activa el modo edición de ese ítem con un indicador visual morado.
- [x] Cuando el usuario pulsa el botón "+" bajo una dimensión, el sistema agrega a esa dimensión un nuevo
  ítem editable.
- [x] Cuando el usuario guarda una plantilla nueva, el sistema persiste los textos de los ítems como copia
  (snapshot), sin referenciar el id de los aprendizajes, asociándola a autor, período y grado dentro de su
  institución.
- [x] Si los aprendizajes originales se modifican o eliminan después, el sistema mantiene intacto el
  contenido de las plantillas ya guardadas.
- [x] Si el usuario cancela la creación o la edición, el sistema descarta los cambios sin persistir nada.
- [x] Mientras el usuario edita una plantilla existente, el sistema muestra el botón "Guardar cambios"
  solo cuando hay cambios pendientes respecto al estado guardado.
- [x] Cuando el usuario confirma la eliminación de una plantilla, el sistema la elimina (dentro de su
  institución) y actualiza la vista de cards.

## Tareas

### Backend (`quartz-api/src/features/checklist-template/`)
- [x] **Modelo** (`checklist-template.model.ts`): añadir `grade` (`GradeLevel`) al schema; mantener el
  snapshot `subjects[].subject.{_id,name}` y `subjects[].learnings[].description` (sin `learningId`);
  conservar `teacherId` como autor e índice por `institutionId`.
- [x] **Validación Zod** (`checklist-template.validation.ts`):
  - `createChecklistTemplateSchema`: body con `name`, `periodId`, `grade`, `subjects[]`
    (`subject.{_id,name}` + `learnings[].description`), validando ObjectId.
  - `updateChecklistTemplateSchema`: `params.id` + body parcial (`name?`, `subjects?`).
  - `deleteChecklistTemplateSchema`: `params.id`.
- [x] **Servicio** (`checklist-template.service.ts`):
  - Ajustar `createChecklistTemplate` para **persistir el snapshot editado** que envía el cliente (en
    vez de auto-generar desde todos los learnings del período).
  - Añadir `updateChecklistTemplate(id, institutionId, userId, userRole, data)` y
    `deleteChecklistTemplate(id, institutionId, userId, userRole)`, ambos *scoped* por `institutionId`
    y con autorización autor/Jefe de Área (patrón de `concept.service.ts`).
- [x] **Controller** (`checklist-template.controller.ts`): mapper a `IChecklistTemplateResponse`
  incluyendo `grade` y **autor poblado** (`firstName`, `lastName`); añadir controllers de update y delete.
- [x] **Rutas** (`checklist-template.routes.ts`): añadir `PATCH /checklist-templates/:id` y
  `DELETE /checklist-templates/:id` con la cadena
  `authenticateJWT → requireTenant → authorize(['Jefe de Área','Docente']) → validate → asyncHandler`;
  ampliar `authorize` de las rutas `GET`/`POST` para incluir `Docente`.
- [x] **Precarga**: reutilizar `GET /learnings?periodId=&grade=` para obtener los aprendizajes de la
  plantilla en borrador (no requiere endpoint nuevo).

### Frontend (`quartz-web/src/features/checklist-template/`)
- [x] **Tipos** (`types/api.ts`, `types/store.ts`, `types/index.ts`): DTO de plantilla (con `name`,
  `period`, `grade`, `author`, `subjects[]` snapshot), payloads de create/update y tipos del store.
- [x] **Store Zustand** (`useChecklistTemplateStore.ts`): `fetchTemplates`, `createTemplate`,
  `updateTemplate`, `deleteTemplate` y `fetchDraftLearnings(periodId, grade)` (vía `apiGet('/learnings')`),
  con estados `isLoading`/`isSubmitting`/`error` e inmutabilidad (patrón de `useConceptStore`).
- [x] **Página** (`pages/ChecklistsPage.tsx`): reemplazar el stub por la vista de **cards** + modales de
  crear/editar/eliminar (patrón de `concept/pages/ConceptsPage.tsx`).
- [x] **Componentes** (`components/`):
  - `ChecklistCard`: muestra nombre, período, grado y autor con iconos editar/eliminar
    (patrón `learning/components/LearningCard.tsx`).
  - `ChecklistEditor`: acordeones por dimensión reutilizando el patrón de
    `student-valuation/components/ValuationChecklist.tsx`, con selector de **período + grado + nombre**.
  - `EditableLearningItem`: clic sobre el texto → modo edición con **indicador morado**
    (`ring-purple-*` / `border-purple-300` de `tailwind.config.ts`).
  - Botón **"+"** por dimensión para agregar un ítem editable vacío.
  - Botones **Guardar** / **Cancelar** en creación, y **"Guardar cambios"** en edición visible solo con
    *dirty check* respecto al estado guardado.
- [x] **UX/errores**: feedback con `react-hot-toast`; conectar la página a la ruta ya registrada
  `/academico/lista-chequeo`.

## Trazabilidad
- Backend:  quartz-api/src/features/checklist-template/
- Frontend: quartz-web/src/features/checklist-template/
- Branch:   feat/checklist-template
