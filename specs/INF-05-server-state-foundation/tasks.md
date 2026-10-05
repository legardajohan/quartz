# INF-05 — Tasks

## Frontend (`quartz-web`)
- [x] `src/lib/queryClient.ts` — `STALE_TIME`, `gcTime 30min`, `retry` sin 4xx, `mutations.retry 0` (`isAxiosError` desde `axios`, sin imports de `src/`)
- [x] `features/auth/useAuthStore.ts` — `queryClient.clear()` en `logout`, `login` (éxito), `activateAccount`
- [x] `src/api/withErrorMessage.ts` — helper compartido de mensajes de error para mutaciones (no planeado; anotado en `plan.md`)
- [x] `features/learning/queries/useLearningsQuery.ts` — `learningKeys` + query + 3 mutaciones (invalidan `learnings` y `dashboard`)
- [x] `LearningsPage.tsx` — consumir hooks; borrar `useEffect` de fetch; `toast.promise(mutateAsync(...))`
- [x] Borrar `useLearningStore.ts`, `learning/types/store.ts` (`Learning` pasa a `types/api.ts`); ajustar `learning/types/index.ts`
- [x] `features/concept/queries/useConceptsQuery.ts` — `conceptKeys` + query + 3 mutaciones (invalidan `concepts` y `dashboard`)
- [x] `ConceptsPage.tsx` — consumir hooks; borrar fetch en `useEffect`
- [x] Borrar `useConceptStore.ts`, `concept/types/store.ts`; ajustar `concept/types/index.ts`
- [x] `features/checklist-template/queries/useChecklistTemplatesQuery.ts` — `checklistTemplateKeys` + query + 3 mutaciones (rama `409` en create)
- [x] `ChecklistsPage.tsx` — consumir hooks; borrar fetch en `useEffect`
- [x] Borrar `useChecklistTemplateStore.ts`, `checklist-template/types/store.ts`; ajustar `types/index.ts`
- [x] `grep -rn "useLearningStore\|useConceptStore\|useChecklistTemplateStore" src` → 0 resultados
- [x] `quartz-web/CLAUDE.md` § "Estado" reescrita (plan.md)

## Verificación final
- [x] `npm run build && npm run lint` en verde (build OK; lint: 0 errores en archivos tocados, 6 errores previos en `App.tsx`, `StudentValuationTable.tsx`, `ValuationChecklist.tsx` y `.vite/deps`)
- [x] `npm run dev` sin errores de compilación ni runtime (módulos migrados sirven 200 en el dev server activo)
- [x] Repaso de aislamiento: `queryClient.clear()` en las 3 transiciones de sesión

## Definición de "hecho"
Todos los criterios EARS del `spec.md` cubiertos y marcados · `status: implemented`.
