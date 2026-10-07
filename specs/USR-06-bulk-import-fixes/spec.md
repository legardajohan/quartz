---
id: USR-06-bulk-import-fixes
feature: bulk-import-fixes
status: implemented        # draft | approved | implemented | released
created: 2026-10-06
---

# USR-06 — Correcciones del cargue masivo (spec)

## Objetivo
Cerrar los pendientes de USR-05 tras la prueba manual: grado en la plantilla de estudiantes, feedback prolijo al confirmar el cargue y tiempos de respuesta del envío de invitaciones.

## Alcance
**Incluye:**
- Columna **Grado** en la plantilla de Estudiantes (lista = niveles ofertados, ACAD-05) y `gradesTaught` correcto al crear.
- Confirmación con botón en carga, cierre del modal y toast (éxito / advertencia de invitaciones fallidas).
- Medición y mejora del tiempo de envío de invitaciones (1 usuario tardaba demasiado).
- `SMTP_SECURE` coherente en el `.env` local.

**Fuera:**
- Cambiar las reglas de unicidad y correo obligatorio (ya cumplidas en USR-05; solo se re-verifican).
- Cola/reintentos automáticos de correo, informe descargable (siguen fuera, como en USR-05).
- Tocar `rejectUnauthorized`/TLS: el fallo `self-signed certificate` lo causaba el escudo de correo de Avast, sin cambio de código.

## Criterios de aceptación (EARS)

**Grado**
- [ ] ~~La plantilla de Estudiantes incluye la columna `Grado*`...; la de Equipo docente no la incluye.~~ **Desviación (ver nota):** ya implementado en ACAD-05 con diseño distinto — columna "Nivel" (Estudiante, obligatoria) y "Niveles" (Equipo docente, opcional, multi-valor); ambas solo aparecen si hay más de un nivel ofertado.
- [ ] ~~Si `Grado` está vacío... `"Grado" no es un valor permitido.`~~ **Desviación:** mensajes equivalentes ya existentes (`"Nivel" es obligatorio.` / `La institución no ofrece el nivel: …`) sobre el campo `gradesTaught`, no `grade`.
- [ ] ~~Al confirmar, el Estudiante se crea con `gradesTaught: [<grado>]`; Docente y Jefe de Área con `gradesTaught` = todos los `offeredLevels`...~~ **Desviación:** el Estudiante sí queda con exactamente un nivel; el Docente elige explícitamente sus niveles cuando hay más de uno ofertado (no se le fuerzan todos); Jefe de Área conserva `[]`. Decisión del usuario: mantener este comportamiento más flexible.
- [x] El confirm revalida el grado contra los `offeredLevels` del token (nunca confía en el cliente).

**Confirmación (UX)**
- [x] Mientras se crea, el botón "Crear N usuarios" muestra spinner y el texto "Creando…" (estudiantes) o "Creando y enviando invitaciones…" (equipo docente), y queda deshabilitado junto con "Volver"/"Cancelar".
- [x] Cuando termina con éxito, el sistema cierra el modal, resetea su estado y muestra toast `"N usuarios creados"` (equipo docente: `"N usuarios creados e invitaciones enviadas"`).
- [x] Si hay `invitationsFailed`, el sistema muestra además un toast ámbar de 8 s con los correos afectados y la indicación "Reenviar invitación".
- [x] Si hay filas omitidas en el confirm (`skipped`), el toast lo indica con su cantidad.
- [x] Si la petición falla, el sistema muestra `toast.error`, mantiene el modal en la previsualización y permite reintentar.
- [x] La tabla de usuarios y el dashboard se refrescan al terminar.

**Invitaciones (rendimiento)**
- [x] El transporte SMTP define `connectionTimeout`, `greetingTimeout` y `socketTimeout` explícitos (≤ 15 s) para que un fallo de red se reporte en `invitationsFailed` sin colgar la petición.
- [ ] Crear 1 usuario de equipo docente con SMTP operativo responde en menos de 5 s (medido en `confirmImport`: tiempo de insert vs invitación). **Pendiente:** requiere medición manual con SMTP real, fuera del alcance de esta sesión.
- [x] Si se envían varias invitaciones, el sistema las procesa con concurrencia limitada (máx. 5) y conserva el reporte por fila.
- [x] `SMTP_SECURE` en el `.env` local es `false` o `true` (no `STARTTLS`).

**Transversales**
- [x] **Aislamiento:** `offeredLevels`, sedes y jornadas se resuelven solo contra el inquilino del token; ningún endpoint de import acepta `institutionId`.
- [x] `npx tsc --noEmit` en verde en `quartz-api`; `npm run build && npm run lint` sin errores nuevos en `quartz-web`.

## Nota de alcance (desviación del plan original)
El diseño de "Grado" ya quedó resuelto en `feat/ACAD-05-offered-levels` (commit `f254a30`), antes de
escribir este spec, con un enfoque más general que el descrito arriba: campo `gradesTaught` (array)
en vez de `grade` singular, y columna opcional "Niveles" también para Equipo docente (útil cuando la
institución ofrece más de un nivel). Consultado explícitamente, el usuario decidió **mantener ese
diseño** en vez de reescribirlo para igualar la redacción literal de los tres criterios marcados
arriba — soporta mejor instituciones con 0, 1 o varios niveles ofertados y evita revertir código ya
funcional. El resto del spec (UX de confirmación, rendimiento de invitaciones, `SMTP_SECURE`) se
implementó tal como estaba planeado.

## Dependencias
- USR-05 (cargue masivo), ACAD-05 (`offeredLevels`, enum de grados), USR-04 (`issueInvitation`).

## Trazabilidad
- Backend:  `quartz-api/src/features/users/users-import.service.ts` · `users.types.ts` · `users.validation.ts` · `quartz-api/src/services/mail.service.ts`
- Frontend: `quartz-web/src/features/users/components/UserImportModal.tsx` · `pages/UsersPage.tsx` · `queries/useUserImportQuery.ts` · `types/api.ts`
- Branch:   `feat/USR-06-bulk-import-fixes`
