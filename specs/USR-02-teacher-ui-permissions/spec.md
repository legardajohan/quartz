---
id: USR-02-teacher-ui-permissions
feature: teacher-ui-permissions
status: implemented
created: 2026-09-15
---

# USR-02 — Permisos de UI del Docente (spec)

## Objetivo
Alinear lo que el Docente **ve** con lo que la API le **permite**, en Aprendizajes, Conceptos, Informes y Usuarios; y habilitarle la actualización de los estudiantes de su sede, único permiso de backend que le faltaba.

## Alcance
**Incluye:**
- Aprendizajes: el Docente solo lista (sin Crear, sin columna Acciones).
- Conceptos: señal de solo lectura en la columna Acciones de los conceptos ajenos.
- Informes: sede del Jefe de Área preseleccionada; filtro de sede oculto al Docente.
- Usuarios: `PATCH /api/users/:userId` habilitado al Docente sobre estudiantes de su sede; separación de `canCreate` / `canEdit` / `canDelete` en la UI.
- Consolidación de `docs/roles-permissions.md` y `docs/domain.md`.

**Fuera:**
- Crear y eliminar usuarios: siguen siendo exclusivos del Jefe de Área.
- Cambiar el rol o la sede de un usuario: el Docente no puede, en ningún caso.
- `POST`/`PATCH`/`DELETE` de aprendizajes: ya son exclusivos del Jefe de Área y no se tocan (`learning.routes.ts:25,34,43`).
- Carga masiva de estudiantes y `Gestión → Configuración`.

## Criterios de aceptación (EARS)

**Aprendizajes**
- [x] Cuando un Docente abre `/academico/aprendizajes`, el sistema no muestra el botón "Crear" ni la columna "Acciones".
- [x] Si el usuario es Jefe de Área, el sistema muestra la pantalla exactamente igual que hoy.

**Conceptos**
- [x] Cuando un Docente ve un concepto del que no es autor, el sistema muestra en "Acciones" un indicador de solo lectura no accionable, con la razón accesible al pasar el cursor.
- [x] Cuando un Docente ve un concepto propio, el sistema muestra editar y eliminar.
- [x] Si el usuario es Jefe de Área, el sistema muestra editar y eliminar en todos los conceptos.

**Informes**
- [x] Cuando un Jefe de Área abre `/informes`, el sistema preselecciona su sede en el filtro "Sede" y le permite quitarla o elegir otras.
- [x] Cuando un Docente abre `/informes`, el sistema no muestra el grupo de filtro "Sede" y lista solo los estudiantes de su sede.
- [x] Cuando una valoración está en estado "Evaluado", el sistema habilita la descarga individual y consolidada de Lista de Chequeo y Carta Comunicativa para ambos roles. (sin cambios; ya vigente)

**Usuarios**
- [x] Cuando un Docente actualiza un usuario con rol Estudiante de su propia sede, el sistema aplica el cambio.
- [x] Si un Docente intenta actualizar un usuario de otra sede o con rol distinto de Estudiante, el sistema responde `404`.
- [x] Si la petición de un Docente incluye `schoolId`, el sistema la rechaza con `403` y no modifica nada.
- [x] Cuando un Docente abre `/gestion/usuarios`, el sistema no muestra el botón "Crear", ni el icono de eliminar, ni la pestaña "Docentes".
- [x] Cuando un Docente abre el modal de actualizar, el sistema le permite cargar la foto del estudiante y deja los campos de sede y jornada deshabilitados.
- [x] Si el usuario es Jefe de Área, el sistema mantiene el comportamiento actual de la pantalla, sin cambios.

**Transversal**
- [x] Cuando se carga una imagen de usuario, el sistema solo lo permite desde el modal de `/gestion/usuarios`; ningún otro punto de la app ofrece esa acción sobre un usuario. (cerrado por `VAL-04`)
- [x] **Aislamiento:** toda lectura/escritura del feature filtra y fuerza `institutionId` del token; el `schoolId` del solicitante se toma de `req.user`, nunca de `body`/`params`/`query`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` en verde en `quartz-web`.

## Dependencias
- `AUTH-02-role-access-baseline` (hook `usePermissions`).
- `VAL-04-teacher-valuation-scope` (retira la carga de foto de `/evaluacion/:studentId`, que esta spec asume ya hecha).

## Trazabilidad
- Backend:  `quartz-api/src/features/users/`
- Frontend: `quartz-web/src/features/{learning,concept,report,users}/`
- Docs:     `docs/roles-permissions.md`, `docs/domain.md`
- Branch:   `feat/USR-02-teacher-ui-permissions`
