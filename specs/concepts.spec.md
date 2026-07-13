---
feature: concepts
status: implemented
created: 2026-06-22
---

# Spec — Conceptos (CRUD)

> Reglas invariantes de negocio y datos: ver [`docs/domain.md`](../docs/domain.md), [`docs/data-model.md`](../docs/data-model.md) y la estructura canónica de la colección en [`docs/data-base.md`](../docs/data-base.md) §8.6. Esta spec solo describe lo propio del feature.

## Problema
- Como **Jefe de Área**, quiero crear y administrar los conceptos descriptivos por dimensión, período y nivel de logro, para estandarizar el texto cualitativo que se usa en los informes.
- Como **Docente**, quiero crear mis propios conceptos por dimensión, período y nivel, para personalizar la retroalimentación de mis grupos.
- Como **autor de un concepto**, quiero consultar, editar y eliminar los conceptos que registré, para mantener actualizado el banco de textos.

## Solución (visión general)
- CRUD del feature `concept` (backend `quartz-api` + frontend `quartz-web`) sobre la colección `Concept`.
- Cada Concepto guarda: **descripción** (texto cualitativo), **valoración** (`valuationType`: enum `QualitativeValuation` reutilizado de `student-valuation` — `Logrado` · `En proceso` · `Con dificultad`), **dimensión** (`Subject`), **período** (`Period`), **autor** (`User`) e **institución** (tenant).
- El **rango de porcentaje no se almacena**: el nivel cualitativo (`valuationType`) es el dato; los umbrales (≥80 / 46–79 / 0–45) viven en `docs/domain.md`.
- **Multi-tenancy:** toda lectura/escritura filtra y fuerza `institutionId` desde el token (nunca se acepta del cliente); además `subjectId`, `periodId` y `authorId` deben pertenecer a la misma institución.
- **Permisos:** Jefe de Área y Docente pueden crear y listar; editar/eliminar lo permite el **autor**; el Jefe de Área puede gestionar cualquier concepto de su institución.
- **Relación con valoraciones (fuera de alcance de este CRUD):** estos conceptos son la fuente de `StudentValuation.assignedConceptId`; la lógica de asignación por rango de % vive en el feature `student-valuation`.

## Estructura de la colección `Concept` (canónica: `docs/data-base.md` §8.6)
| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | PK |
| `institutionId` | ObjectId → Institution | **requerido**, índice (tenant) |
| `description` | string | requerido (texto del concepto) |
| `valuationType` | enum `QualitativeValuation`: `Logrado` \| `En proceso` \| `Con dificultad` (reutilizado de `student-valuation.types.ts`) | requerido (mismo nivel usado en la asignación) |
| `subjectId` | ObjectId → Subject | requerido (dimensión; misma institución) |
| `periodId` | ObjectId → Period | requerido (misma institución) |
| `authorId` | ObjectId → User | requerido (autor; **extensión** sobre data-base.md §8.6) |
| `createdAt` / `updatedAt` | Date | `timestamps: true` |

> El rango % no es columna: se deriva de `valuationType` según `docs/domain.md`.
> `authorId` no figura en data-base.md §8.6; se añade por requerimiento y se sincroniza el doc.
> `valuationType` reutiliza el enum `QualitativeValuation` (`Logrado`/`En proceso`/`Con dificultad`) ya definido en `student-valuation.types.ts`, en vez de crear un enum nuevo en inglés — alineado con la nota de `docs/data-base.md`.

## Criterios de aceptación (EARS)
- [x] Cuando un Jefe de Área o Docente envía un concepto con descripción, dimensión, período y valoración válidos, el sistema lo crea en su institución y registra como `autor` al usuario autenticado.
- [x] Si falta la descripción, la dimensión, el período o la valoración, o la valoración (`valuationType`) no es un nivel permitido (`Logrado` · `En proceso` · `Con dificultad`), el sistema rechaza la operación con error de validación.
- [x] Si la dimensión (`subjectId`) o el período (`periodId`) no pertenecen a la institución del usuario, el sistema rechaza la operación.
- [x] Cuando un usuario autenticado solicita el listado de conceptos, el sistema devuelve únicamente los conceptos de su institución.
- [x] Cuando se consulta el listado, el sistema permite filtrar por dimensión, período y/o valoración.
- [x] Cuando el autor de un concepto (o un Jefe de Área de la misma institución) lo edita, el sistema actualiza descripción/valoración/dimensión/período conservando institución y autor.
- [x] Si un Docente intenta editar o eliminar un concepto del que no es autor, el sistema rechaza la operación con error de autorización.
- [x] Cuando el autor o un Jefe de Área elimina un concepto de su institución, el sistema lo retira y deja de estar disponible para futuras asignaciones.
- [x] Mientras un usuario no esté autenticado o no tenga institución asignada, el sistema deniega el acceso al recurso.

## Indicaciones de implementación

### Backend — `quartz-api/src/features/concept/`
Seguir el flujo HTTP canónico y la arquitectura modular funcional (ver `quartz-api/CLAUDE.md`), tomando `checklist-template` como referencia:
- `concept.types.ts` — `IConcept`, DTOs de entrada/salida; reexporta y usa el enum `QualitativeValuation` (`Logrado`/`En proceso`/`Con dificultad`) de `student-valuation.types.ts` para `valuationType` (sin crear un enum nuevo en inglés).
- `concept.model.ts` — schema Mongoose `Concept` (colección `concepts`) con los campos de la tabla; `institutionId` requerido + índice. Validar que `subjectId`/`periodId` sean de la misma institución.
- `concept.validation.ts` — esquemas Zod `{ body, params, query }` (ObjectId regex, `.strict()`).
- `concept.service.ts` — lógica con `findScoped` / `createScoped` / `findByIdScoped` / `findOneAndUpdateScoped` / `findOneAndDeleteScoped` (siempre con `institutionId`); `AppError` para fallos; chequeo de autoría en update/delete.
- `concept.controller.ts` — extrae `req.user!` (`institutionId`, `_id` como autor), llama al service, responde; sin try/catch.
- `concept.routes.ts` — cadena `authenticateJWT → requireTenant → authorize(['Jefe de Área','Docente']) → validate → asyncHandler`.
- Registrar en `quartz-api/src/app.ts`: `app.use('/api/concepts', conceptRoutes)`.
- Endpoints: `GET /` (listar + filtros), `POST /`, `PATCH /:id`, `DELETE /:id` (y opcional `GET /:id`).

### Frontend — `quartz-web/src/features/concept/`
Seguir `quartz-web/CLAUDE.md` (apiClient + Zustand + Tailwind), tomando `student-valuation` como referencia:
- `types/` (`api.ts`, `store.ts`, `index.ts`) — DTOs y estado del store.
- `useConceptStore.ts` — acciones `fetchConcepts`, `createConcept`, `updateConcept`, `deleteConcept` usando `apiGet/apiPost/apiPatch/apiDelete` sobre `/concepts`; manejo de `isLoading`/`error`; inmutabilidad.
- `components/` — tabla/listado y formulario (presentacionales, sin llamadas API directas).
- `pages/ConceptsPage.tsx` — completar el stub existente, consumir el store.
- Ruta en `App.tsx`.

## Trazabilidad
- Backend:  quartz-api/src/features/concept/
- Frontend: quartz-web/src/features/concept/ (stub existente: `pages/ConceptsPage.tsx`)
- Branch:   feat/concept
