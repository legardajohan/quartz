# INF-06 — Tasks

## Frontend (`quartz-web`)
- [x] `period/queries/usePeriodsQuery.ts` — `periodKeys`, query (`catalog`), 3 mutaciones con `setPeriods(fresh)` + invalida `periods`, `dashboard`
- [x] `PeriodsPanel.tsx` — consumir hooks; borrar fetch en `useEffect`
- [x] `subject/queries/useSubjectsQuery.ts` — `subjectKeys`, query (`catalog`), 3 mutaciones con `setSubjects(fresh)` + invalida `subjects`, `dashboard`
- [x] `SubjectsPanel.tsx` — consumir hooks; borrar fetch en `useEffect`
- [x] `school/queries/useSchoolsQuery.ts` — `schoolKeys`, query (`catalog`, opción `enabled`), 3 mutaciones (invalidan `schools`, `users`)
- [x] `SchoolsPanel.tsx` — consumir hooks
- [x] `UsersPage.tsx` — importar `useSchoolsQuery` de `school`; verificar tipo `UserSchool` vs `SchoolDto`
- [x] Borrar `users/queries/useSchoolsQuery.ts`
- [x] `institution/queries/useInstitutionQuery.ts` — `institutionKeys`, `useInstitutionQuery`, `useInstitutionBrandingQuery` (`retry: false`), 2 mutaciones
- [x] `useInstitutionShieldQuery.ts` — `shieldVersion` desde `useInstitutionBrandingQuery`
- [x] `ReportSettingsPanel`, `ShiftsPanel`, `InstitutionShieldPanel` — consumir hooks; borrar `fetchInstitution` en `useEffect`
- [x] `components/common/InstitutionBrand.tsx` — `useInstitutionBrandingQuery`; borrar `useEffect(fetchBranding)`
- [x] Borrar `usePeriodStore`, `useSubjectStore`, `useSchoolStore`, `useInstitutionStore` + sus `types/store.ts`; ajustar `types/index.ts`
- [x] `grep -rn "usePeriodStore\|useSubjectStore\|useSchoolStore\|useInstitutionStore" src` → 0 resultados

## Verificación final
- [x] `npm run build && npm run lint` en verde
- [x] `npm run dev` sin errores de compilación ni runtime
- [x] Repaso de aislamiento: ninguna key nueva queda fuera de la purga de INF-05 (`clear()` es global)

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
