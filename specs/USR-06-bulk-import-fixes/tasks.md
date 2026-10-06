# USR-06 — Tasks

## Preparación
- [ ] ACAD-05 implementado (`GradeLevel` de 3 valores y `offeredLevels` disponibles)
- [ ] Rama `feat/USR-06-bulk-import-fixes` desde la rama de ACAD-05

## Backend (`quartz-api`)
- [ ] `users.types.ts` — `ImportRowDTO.grade`
- [ ] `users.validation.ts` — `importRowSchema.grade` (`z.nativeEnum(GradeLevel).optional()`)
- [ ] `users-import.service.ts` — columna `Grado*` (solo estudiantes), `levels` en `ImportContext`, lista en plantilla, motivos de grado en `parseRawRow`/`revalidateRow`, `gradesTaught` en `buildUserDoc`
- [ ] `users-import.service.ts` — tiempos temporales (`console.time`) en insert e invitaciones; medir con 1 y ~20 docentes; retirar los logs
- [ ] `mail.service.ts` — `connectionTimeout`, `greetingTimeout`, `socketTimeout`
- [ ] `users-import.service.ts` / `mail.service.ts` — mejora según medición (`pool`, concurrencia ≤ 5 con `Promise.allSettled`)
- [ ] `.env` local — `SMTP_SECURE=false`

## Frontend (`quartz-web`)
- [ ] Invocar skills `emil-design-eng`, `impeccable`, `frontend-design`
- [ ] `types/api.ts` — `ImportRowDto.grade`
- [ ] `UserImportModal.tsx` — spinner en el botón, cierre al terminar, `onCompleted(result)`, retirar paso `result`
- [ ] `UsersPage.tsx` — toasts de éxito, omitidas e invitaciones fallidas

## Verificación final
- [ ] `npx tsc --noEmit` en verde (`quartz-api`)
- [ ] `npm run build && npm run lint` sin errores nuevos (`quartz-web`)
- [ ] Servidor y web arrancan sin errores de compilación ni runtime
- [ ] Recorrido manual de `plan.md` → Verificación
- [ ] Repaso de aislamiento: `offeredLevels`, sedes y jornadas filtran `institutionId` del token

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
