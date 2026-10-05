---
id: INF-03-session-sync-and-scope-audit
feature: session-sync-and-scope-audit
status: implemented
created: 2026-09-17
---

# INF-03 — Sincronización de sesión, clipping del Select y auditoría de alcance por sede (spec)

## Objetivo
Cerrar tres defectos detectados en la rama `feat/USR-02-teacher-ui-permissions`: el `Select` de periodo recortado en el modal «Nueva Plantilla», la `sessionData` persistida que se desincroniza del backend (síntoma: «No se encontró la valoración» en una sesión nueva) y el endurecimiento + documentación del alcance por sede en Evaluaciones.

## Contexto de los hallazgos

**1. Clipping del `Select`.** `ChecklistsPage.tsx:171` usa `FormModal` con `scrollable` por defecto, que aplica `max-h-[70vh] overflow-y-auto` al `DialogBody` (`FormModal.tsx:41`). El listbox del `Select` de Material Tailwind se renderiza dentro de ese contenedor, así que el `overflow` lo recorta. Precedente idéntico: commit `dbe601d` (`scrollable={false}` en `SubjectsPanel.tsx:226` y `SchoolsPanel.tsx:205`) y la nota 5 de `specs/ACAD-04-schools-and-shifts/plan.md`. Falta la entrada en `quartz-web/docs/known-issues.md`.

**2. Incógnito vs. navegador normal.** No es un problema de incógnito ni de rol: es la `sessionData` persistida. `StudentValuationDetail.tsx:38` resuelve el periodo con `sessionData?.periods?.find((p) => p.isActive)` y **solo llama al API si lo encuentra**; si no, cae en `if (!localValuation)` (`:131`) y pinta «No se encontró la valoración» sin haber hecho ninguna petición — por eso el mensaje es el texto gris plano y no el panel rojo de error. `sessionData` se escribe **únicamente en el login** (`useAuthStore.ts:25`) y se persiste en `localStorage` bajo `quartz-session`, sin caducidad ni revalidación (`refreshUser` existe pero nadie lo invoca, y solo refresca `sessionData.user`). Resultado: el navegador normal opera con una copia vieja que aún tiene un periodo activo, mientras una sesión nueva (incógnito) recibe el estado real del backend, donde ese periodo ya no lo está. La copia vieja es el defecto, no la sesión nueva: el Docente está valorando contra un periodo que la base de datos ya no considera activo, y lo mismo aplica a `subjects`, `enabledReports`, `shifts` y `user.schoolId` — este último gobierna filtros de UI vía `usePermissions`.
**Propuesta: ajustar, no mantener.** Revalidar `sessionData` completa en cada arranque de la app y dar un estado vacío explícito cuando no hay periodo activo.

**3. Alcance por sede en Evaluaciones.** El hueco descrito en `docs/roles-permissions.md:82` **ya está cerrado**: `VAL-04` (`dc1de75`) añadió `assertStudentInScope` y lo aplica en las 6 operaciones (`student-valuation.service.ts:281, 291, 308, 407, 567, 635`). Lo que queda es: (a) el guard no comprueba que el `:studentId` sea realmente un `Estudiante` —un Docente puede inicializar una valoración sobre otro docente de su sede, y el Jefe de Área sobre cualquier usuario del inquilino, porque `validateAllExist` solo valida existencia (`:322`)—; (b) el guard sale temprano para el Jefe de Área, que así no valida nada; (c) la documentación está desactualizada.

## Alcance
**Incluye:**
- `scrollable={false}` + `menuProps` en el modal «Nueva Plantilla»; entrada en `quartz-web/docs/known-issues.md`.
- `GET /api/auth/session` y revalidación de `sessionData` al arrancar la app.
- Estado vacío explícito «sin periodo activo» en `/evaluacion/:studentId`.
- Hook `useActivePeriod()` como fuente única del periodo activo; sustituye los cinco `find((p) => p.isActive)` duplicados.
- Endurecer `assertStudentInScope`: el objetivo debe existir en el inquilino **y** tener `role === Estudiante`, para todos los roles.
- Actualizar `docs/roles-permissions.md` (fila «Eliminar valoración» y nota «Hueco conocido»).

**Fuera:**
- Refresh token y caducidad de sesión: el JWT sigue con `expiresIn` de 8 h y el `401` se sigue resolviendo con `logout()`.
- `GET /api/auth/profile`, que se conserva intacto aunque el store deje de consumirlo.
- Vínculo Docente↔Estudiante a nivel de modelo: «sus estudiantes» sigue siendo «todos los de su `schoolId`» (`VAL-04`).
- Restricción de borrado al autor (`teacherId`): decisión tomada — el Docente elimina cualquier valoración de un estudiante de su sede.
- Estado vacío «sin periodo activo» en `/academico/aprendizajes`, `/academico/conceptos` e `/informes`: ahí solo se migra al hook, la UI no cambia.
- Restricción por jornada (`shiftId`).

## Criterios de aceptación (EARS)

### Modal «Nueva Plantilla»
- [x] Cuando el usuario abre el `Select` «Período académico» en `/academico/lista-chequeo`, el sistema muestra todas las opciones completas, sin recorte superior ni inferior.
- [x] Si el número de periodos excede el alto disponible, el menú del `Select` desplaza su propio contenido y el `DialogBody` no lo recorta.
- [x] Cuando se cierra este defecto, el sistema documenta la causa y la regla general en `quartz-web/docs/known-issues.md`.

### Sincronización de sesión
- [x] Cuando la app arranca y existe un `token` persistido, el sistema solicita `GET /api/auth/session` una sola vez y reemplaza `sessionData` con la respuesta.
- [x] Cuando `GET /api/auth/session` responde, el sistema devuelve exactamente la misma forma que el campo `sessionData` de `POST /api/auth/login`.
- [x] Si `GET /api/auth/session` responde `401`, el sistema ejecuta `logout()` y el router redirige a `/login`.
- [x] Si la revalidación falla por red o por `5xx`, el sistema conserva la `sessionData` persistida y no bloquea la navegación.
- [x] Mientras la revalidación está en curso, el sistema renderiza con la `sessionData` persistida y no muestra pantalla de carga.
- [x] Cuando el usuario navega entre rutas protegidas, el sistema no vuelve a solicitar la sesión.

### Periodo activo
- [x] Cuando el usuario abre `/evaluacion/:studentId` y ningún periodo tiene `isActive: true`, el sistema muestra «No hay un periodo académico activo» y **no** invoca `POST /api/student-valuations/student/:studentId/period/:periodId`.
- [x] Si el rol del solicitante es Jefe de Área, ese estado vacío ofrece un enlace a `/gestion/configuracion`; si es Docente, no lo ofrece.
- [x] Cuando existe un periodo activo, el sistema se comporta exactamente como hoy.
- [x] Cuando un componente necesita el periodo activo, el sistema lo obtiene de `useActivePeriod()` y no de un `find((p) => p.isActive)` propio.

### Alcance por sede en Evaluaciones
- [x] Cuando un Docente inicializa, consulta por estudiante, consulta por id, edita, actualiza conceptos o elimina una valoración de un estudiante de otra sede, el sistema responde `404` sin revelar la existencia del recurso.
- [x] Si el `studentId` objetivo corresponde a un usuario cuyo `role` no es `Estudiante`, el sistema responde `404` para **cualquier** rol, incluido Jefe de Área.
- [x] Si el `studentId` objetivo no existe en el inquilino, el sistema responde `404` para cualquier rol.
- [x] Cuando un Docente elimina la valoración de un estudiante de su sede, el sistema la elimina aunque el `teacherId` de la valoración sea otro docente.
- [x] Si el solicitante es Jefe de Área, el sistema no aplica filtro de sede y opera sobre toda la institución.
- [x] Cuando se cierra este spec, `docs/roles-permissions.md` no contiene la nota «Hueco conocido» sobre `student-valuation` y su fila «Eliminar valoración» refleja la regla implementada.

### Transversales
- [x] **Aislamiento:** toda lectura/escritura filtra y fuerza `institutionId` del token; `schoolId` y `role` del solicitante se toman de `req.user`, nunca de `body`/`params`/`query`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build` en verde en `quartz-web`. `npm run lint` sin errores nuevos (10 errores preexistentes al branch base, ajenos a este spec — ver `tasks.md`).

## Dependencias
- `VAL-04-teacher-valuation-scope` (`assertStudentInScope`, `RequestorScope`).
- `AUTH-02-role-access-baseline` (`usePermissions`).
- `ACAD-02-period-settings` (`Period.isActive`, índice parcial único).

## Trazabilidad
- Backend:  `quartz-api/src/features/auth/`, `quartz-api/src/features/student-valuation/`
- Frontend: `quartz-web/src/features/auth/`, `quartz-web/src/features/period/`, `quartz-web/src/features/student-valuation/`, `quartz-web/src/features/checklist-template/`
- Docs:     `docs/roles-permissions.md`, `quartz-web/docs/known-issues.md`
- Branch:   `feat/INF-03-session-sync-and-scope-audit`
