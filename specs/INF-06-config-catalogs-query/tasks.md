# INF-06 — Tasks

## Frontend (`quartz-web`)
- [ ] `period/queries/usePeriodsQuery.ts` — `periodKeys`, query (`catalog`), 3 mutaciones con `setPeriods(fresh)` + invalida `periods`, `dashboard`
- [ ] `PeriodsPanel.tsx` — consumir hooks; borrar fetch en `useEffect`
- [ ] `subject/queries/useSubjectsQuery.ts` — `subjectKeys`, query (`catalog`), 3 mutaciones con `setSubjects(fresh)` + invalida `subjects`, `dashboard`
- [ ] `SubjectsPanel.tsx` — consumir hooks; borrar fetch en `useEffect`
- [ ] `school/queries/useSchoolsQuery.ts` — `schoolKeys`, query (`catalog`, opción `enabled`), 3 mutaciones (invalidan `schools`, `users`)
- [ ] `SchoolsPanel.tsx` — consumir hooks
- [ ] `UsersPage.tsx` — importar `useSchoolsQuery` de `school`; verificar tipo `UserSchool` vs `SchoolDto`
- [ ] Borrar `users/queries/useSchoolsQuery.ts`
- [ ] `institution/queries/useInstitutionQuery.ts` — `institutionKeys`, `useInstitutionQuery`, `useInstitutionBrandingQuery` (`retry: false`), 2 mutaciones
- [ ] `useInstitutionShieldQuery.ts` — `shieldVersion` desde `useInstitutionBrandingQuery`
- [ ] `ReportSettingsPanel`, `ShiftsPanel`, `InstitutionShieldPanel` — consumir hooks; borrar `fetchInstitution` en `useEffect`
- [ ] `components/common/InstitutionBrand.tsx` — `useInstitutionBrandingQuery`; borrar `useEffect(fetchBranding)`
- [ ] Borrar `usePeriodStore`, `useSubjectStore`, `useSchoolStore`, `useInstitutionStore` + sus `types/store.ts`; ajustar `types/index.ts`
- [ ] `grep -rn "usePeriodStore\|useSubjectStore\|useSchoolStore\|useInstitutionStore" src` → 0 resultados

## Verificación final
- [ ] `npm run build && npm run lint` en verde
- [ ] `npm run dev` sin errores de compilación ni runtime
- [ ] Repaso de aislamiento: ninguna key nueva queda fuera de la purga de INF-05 (`clear()` es global)

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
