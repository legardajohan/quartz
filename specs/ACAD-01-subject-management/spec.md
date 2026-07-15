---
id: ACAD-01-subject-management
feature: subject-management
status: implemented
created: 2026-07-15
---

# ACAD-01 — Gestión de dimensiones por institución (spec)

## Objetivo
Permitir al Jefe de Área crear, editar y eliminar las dimensiones/asignaturas (`Subject`) de su institución desde `Gestión → Configuración`, y definir el **modo de evaluación** de cada una (`checklist` o `description`).

## Alcance
**Incluye:**
- CRUD de `Subject` restringido a Jefe de Área, atado al `institutionId` del token.
- Campo `evaluationMode` en `Subject`: `checklist` (default) | `description`.
- Normalización del feature `subject` al patrón de 6 archivos (`quartz-api/CLAUDE.md`).
- Corrección de `ref: 'EducationalInstitution'` → `'Institution'` en `subject.model.ts`.
- `ISessionData['subjects']` extendido con `type` y `evaluationMode`.
- Pantalla `/gestion/configuracion` (shell con pestañas) + pestaña **Dimensiones**.
- `RoleRoute`: guarda de ruta por rol (no existe en el proyecto).
- Filtrado del menú lateral por rol.
- Reescritura del invariante de las 7 dimensiones en `docs/domain.md`.

**Fuera:**
- Consumo de `evaluationMode` en `ChecklistTemplate`, `StudentValuation` e informes → `VAL-03-description-mode`.
- Periodos académicos e informes habilitados → `ACAD-02-period-settings`.
- Materias globales (`institutionId: null`, previstas en `docs/data-model.md`): esta fase no las crea ni las expone.
- Reordenar o anclar los iconos de dimensión (ver Nota 3 en `plan.md`).

## Criterios de aceptación (EARS)
- [x] Cuando un Jefe de Área envía `POST /api/subjects` con `name` y `type` válidos, el sistema crea el `Subject` con `evaluationMode: 'checklist'` y responde `201` con el `ISubjectDTO`.
- [x] Cuando un Jefe de Área envía `POST /api/subjects` con `evaluationMode: 'description'`, el sistema persiste ese modo.
- [x] Si el `name` ya existe en la institución, el sistema responde `409` y no crea el `Subject`.
- [x] Cuando un Jefe de Área envía `PATCH /api/subjects/:subjectId`, el sistema actualiza solo los campos enviados y responde `200` con el DTO resultante.
- [x] Cuando un Jefe de Área envía `DELETE /api/subjects/:subjectId`, el sistema elimina el `Subject` y responde `204`.
- [x] Si el `:subjectId` no existe o pertenece a otra institución, el sistema responde `404` en `PATCH` y `DELETE`.
- [x] Si un usuario con rol `Docente` o `Estudiante` invoca `POST`, `PATCH` o `DELETE` sobre `/api/subjects`, el sistema responde `403`.
- [x] Cuando cualquier usuario autenticado invoca `GET /api/subjects`, el sistema responde `200` con las dimensiones de su institución ordenadas por `name`, incluyendo `type` y `evaluationMode`.
- [x] Cuando un usuario inicia sesión, `sessionData.subjects[]` incluye `type` y `evaluationMode` por cada dimensión.
- [x] Cuando un Jefe de Área navega a `/gestion/configuracion`, el sistema muestra el shell de Configuración con la pestaña Dimensiones activa.
- [x] Si un usuario que no es Jefe de Área navega a `/gestion/configuracion`, el sistema lo redirige a `/dashboard` y no monta la página.
- [x] Si el rol del usuario no es Jefe de Área, el menú lateral no muestra la entrada `Gestión → Configuración`.
- [x] Cuando una acción de crear/editar/eliminar una dimensión termina con éxito, `sessionData.subjects` refleja el cambio sin necesidad de volver a iniciar sesión.
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [x] `npx tsc --noEmit` en verde en cada paquete tocado (+ `npm run build && npm run lint` si toca `quartz-web`).

## Dependencias
- Ninguna.

## Trazabilidad
- Backend:  quartz-api/src/features/subject/
- Frontend: quartz-web/src/features/subject/ · quartz-web/src/features/configuration/
- Branch:   feat/ACAD-01-subject-management
