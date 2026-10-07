# USR-06 — Tasks

## Preparación
- [x] ACAD-05 implementado (`GradeLevel` configurable y `offeredLevels` disponibles)
- [x] Rama `feat/USR-06-bulk-import-fixes` desde la rama de ACAD-05

## Backend (`quartz-api`)
- [x] `users.types.ts` / `users.validation.ts` / `users-import.service.ts` — el "Grado" (columna, lista de `offeredLevels`, motivos, `gradesTaught` en `buildUserDoc`) ya quedó implementado en ACAD-05 (commit `f254a30`) con un diseño más general que el de este spec: campo `gradesTaught` (array) en vez de `grade` singular, y columna opcional "Niveles" (multi-valor) también para Equipo docente. Decisión del usuario: mantener ese diseño tal cual; no se reescribe para igualar la redacción literal del spec (ver nota abajo).
- [ ] `users-import.service.ts` — tiempos temporales (`console.time`) en insert e invitaciones; medir con 1 y ~20 docentes; retirar los logs *(pendiente de medición manual con SMTP real — fuera del alcance de esta sesión automatizada)*
- [x] `mail.service.ts` — `connectionTimeout`, `greetingTimeout`, `socketTimeout` (10s/10s/15s) + `pool: true`
- [x] `users-import.service.ts` — concurrencia ≤ 5 con `Promise.allSettled` en lotes, en vez del `for…of` secuencial
- [x] `.env` local — `SMTP_SECURE=false`

## Frontend (`quartz-web`)
- [x] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design`
- [x] `types/api.ts` — ya tenía `ImportRowDto.gradesTaught` (ver nota de Backend)
- [x] `UserImportModal.tsx` — spinner en el botón, cierre al terminar, `onCompleted(result, kind)`, retirar paso `result`
- [x] `UsersPage.tsx` — toasts de éxito (con sufijo de omitidas), invitaciones fallidas (ámbar, 8s)

## Verificación final
- [x] `npx tsc --noEmit` en verde (`quartz-api`)
- [x] `npm run build && npm run lint` sin errores nuevos (`quartz-web`)
- [x] Servidor y web arrancan sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación *(pendiente: requiere SMTP real y archivos de prueba — a cargo del usuario)*
- [x] Repaso de aislamiento: `offeredLevels`, sedes y jornadas filtran `institutionId` del token (sin cambios; ya lo hacía `loadImportContext`)

## Nota de alcance (desviación del plan original)
El plan asumía que el manejo de "Grado" estaba pendiente; en realidad ya lo cubrió ACAD-05 con un
diseño distinto (array `gradesTaught` + columna opcional "Niveles" también en Equipo docente, en vez
de un campo `grade` singular solo para Estudiante). El usuario confirmó mantenerlo así: es más general
(soporta instituciones con 0, 1 o varios niveles ofertados) y no se revierte código ya funcional.

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
