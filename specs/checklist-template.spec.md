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

---

## Ajuste (2026-07-13) — Límite de plantillas por período y pulido de edición

### Problema
- Como Docente, quiero que el sistema me impida crear más de 2 plantillas por período para mantener el
  banco de listas de chequeo acotado y obligarme a editar o eliminar una existente en lugar de acumular.
- Como Docente, quiero que la pantalla de edición se sienta ordenada y clara —con acciones que floten al
  modificar y una activación de edición fluida— para trabajar cómodamente en plantillas largas.

### Solución (visión general)
- **Límite backend:** al crear, el sistema cuenta las plantillas existentes del mismo
  `institutionId + periodId + teacherId`; si ya hay 2, rechaza con `409` y el mensaje
  "Máximo 2 plantillas por período alcanzado." El frontend captura ese `409` y lo muestra al usuario.
- **Pulido UX (referencia `student-valuation`):** espaciado más aireado en los ítems (filas con
  separadores tipo tabla); **barra de acciones flotante** (`sticky`) que aparece solo cuando hay cambios,
  con indicador "Hay cambios pendientes" y acciones Deshacer/Guardar; **X de cierre** persistente en el
  header del modal.
- **Color e interacción (Emil Kowalski):** el título del modal y los ítems en **reposo van en gris
  neutro**; el **morado aparece solo al entrar en edición** (foco del título, subrayado del ítem) con
  transición fluida y sin salto de layout. Los íconos y el botón Guardar conservan el morado de marca.
  Se corrige el hover "pegado" del ícono de editar al abrir el modal (sin ripple, `blur()` al abrir,
  estados `active:`/`focus-visible:` reales).

### Criterios de aceptación (EARS)
- [x] Si un Docente ya tiene 2 plantillas en un período (misma institución, período y docente) e intenta
  crear otra, el sistema rechaza la operación con `409` y el mensaje "Máximo 2 plantillas por período
  alcanzado."; con 0 o 1 plantillas, permite la creación.
- [x] Cuando la creación falla con `409`, el frontend expone el mensaje del backend al usuario
  (variable `error` del store y toast).
- [x] Mientras el usuario edita una plantilla, cuando existen cambios respecto al estado guardado, el
  sistema muestra una barra de acciones flotante con "Hay cambios pendientes", Deshacer y Guardar; cuando
  no hay cambios, la barra permanece oculta.
- [x] Cuando el usuario abre el editor, el sistema ofrece siempre una acción de cierre (X) en el header,
  incluso con el descarte por clic-fuera deshabilitado.
- [x] Mientras un ítem o el título están en reposo, el sistema los muestra en gris neutro; cuando el
  usuario los enfoca para editar, aplica el acento morado con una transición fluida y sin salto de layout.
- [x] Cuando el usuario pasa el cursor por el ícono de editar y abre el modal, al regresar el sistema no
  conserva el estado de hover de forma indebida.

### Trazabilidad del ajuste
- Backend:  quartz-api/src/features/checklist-template/checklist-template.service.ts
- Frontend: useChecklistTemplateStore.ts · components/ChecklistEditor.tsx ·
  components/EditableLearningItem.tsx · components/ChecklistCard.tsx · pages/ChecklistsPage.tsx
