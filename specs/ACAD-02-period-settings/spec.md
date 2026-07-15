---
id: ACAD-02-period-settings
feature: period-settings
status: draft
created: 2026-07-15
---

# ACAD-02 — Periodos académicos e informes habilitados (spec)

## Objetivo
Permitir al Jefe de Área configurar, desde `Gestión → Configuración`, los periodos académicos de su institución (cantidad por año, fechas, periodo activo, alerta de cierre de plataforma) y qué informes se habilitan (Lista de Chequeo y/o Carta Comunicativa).

## Alcance
**Incluye:**
- Feature `institution` completo (hoy solo tiene `institution.model.ts` y no está montado).
- `Institution.settings`: `periodsPerYear` (default 4) y `enabledReports` (default ambos).
- `GET` / `PATCH` `/api/institutions/me`, solo Jefe de Área.
- CRUD completo de `Period` restringido a Jefe de Área, atado al `institutionId` del token.
- `Period.year` persistido y `Period.closingAlertDate` (alerta de cierre, opcional).
- Normalización del feature `period` al patrón de 6 archivos (`quartz-api/CLAUDE.md`).
- Corrección de `ref: 'EducationalInstitution'` → `'Institution'` en `period.model.ts`.
- Cumplimiento de la invariante *"un solo `Period` activo por institución"* (`docs/domain.md:64`), hoy sin proteger.
- Pestañas **Periodos** e **Informes** en `ConfigurationPage`.
- `/informes` respeta `enabledReports`.

**Fuera:**
- **Envío de notificaciones.** `closingAlertDate` solo se persiste y se expone; la colección `Notification` no tiene modelo (`docs/data-base.md §1.2`). El disparo va en un spec aparte.
- Subida del escudo institucional (`shield`) — ya fuera de alcance en `specs/reports.spec.md`; arrastra el primer mecanismo de upload del proyecto.
- Habilitar la Carta Comunicativa: sigue siendo placeholder deshabilitado. `enabledReports` solo controla su visibilidad.
- Edición del resto de datos de la institución (`name`, `daneCode`, `address`, `rectorName`, `email`): este spec expone solo `settings`.
- Migración de los `Period` existentes sin `year` (ver `plan.md`, Nota 3).

## Criterios de aceptación (EARS)
### Institución
- [ ] Cuando un Jefe de Área invoca `GET /api/institutions/me`, el sistema responde `200` con los datos de **su** institución y su `settings`.
- [ ] Si una institución nunca configuró `settings`, el sistema responde con `periodsPerYear: 4` y `enabledReports` con ambos informes.
- [ ] Cuando un Jefe de Área envía `PATCH /api/institutions/me` con `settings` válidos, el sistema los persiste y responde `200`.
- [ ] Si `enabledReports` llega vacío, el sistema responde `422` y no persiste.
- [ ] Si un usuario con rol `Docente` o `Estudiante` invoca `GET` o `PATCH` sobre `/api/institutions/me`, el sistema responde `403`.

### Periodos
- [ ] Cuando un Jefe de Área envía `POST /api/periods` con datos válidos, el sistema crea el `Period` y responde `201`.
- [ ] Si `endDate` no es posterior a `startDate`, el sistema responde `400` y no crea el `Period`.
- [ ] Si `closingAlertDate` viene y es anterior a `endDate`, el sistema responde `400` y no crea el `Period`.
- [ ] Si crear el `Period` excediera `settings.periodsPerYear` para ese `year`, el sistema responde `409` y no lo crea.
- [ ] Cuando un Jefe de Área crea o actualiza un `Period` con `isActive: true`, el sistema desactiva los demás periodos de la institución, quedando exactamente uno activo.
- [ ] Cuando un Jefe de Área envía `PATCH /api/periods/:periodId`, el sistema actualiza solo los campos enviados y responde `200`.
- [ ] Cuando un Jefe de Área envía `DELETE /api/periods/:periodId`, el sistema elimina el `Period` y responde `204`.
- [ ] Si el `:periodId` no existe o pertenece a otra institución, el sistema responde `404` en `PATCH` y `DELETE`.
- [ ] Si un usuario con rol `Docente` o `Estudiante` invoca `POST`, `PATCH` o `DELETE` sobre `/api/periods`, el sistema responde `403`.
- [ ] Cuando cualquier usuario autenticado invoca `GET /api/periods`, el sistema responde `200` con los periodos de su institución.

### Frontend
- [ ] Cuando un Jefe de Área abre la pestaña Periodos, el sistema lista los periodos de su institución con nombre, año, fechas, alerta de cierre y cuál está activo.
- [ ] Cuando el Jefe de Área establece la fecha de fin de un periodo, el formulario propone `closingAlertDate = endDate + 7 días` como valor por defecto editable.
- [ ] Cuando el Jefe de Área desmarca un informe en la pestaña Informes y guarda, `/informes` deja de ofrecerlo.
- [ ] Si el Jefe de Área intenta guardar con los dos informes desmarcados, el sistema impide el envío y muestra el error.

### Transversal
- [ ] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; ninguna operación lo acepta de `body`/`params`.
- [ ] `npx tsc --noEmit` en verde en cada paquete tocado (+ `npm run build && npm run lint` si toca `quartz-web`).

## Dependencias
- **`ACAD-01-subject-management`** — aporta el shell `ConfigurationPage`, `RoleRoute` y la entrada de menú. Sin él no hay dónde montar las pestañas.

## Trazabilidad
- Backend:  quartz-api/src/features/institution/ · quartz-api/src/features/period/
- Frontend: quartz-web/src/features/institution/ · quartz-web/src/features/period/ · quartz-web/src/features/configuration/
- Branch:   feat/ACAD-02-period-settings
