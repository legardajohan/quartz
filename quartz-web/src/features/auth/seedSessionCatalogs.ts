import { queryClient } from '@/lib/queryClient';
import { periodKeys } from '@/features/period/queries/usePeriodsQuery';
import { subjectKeys } from '@/features/subject/queries/useSubjectsQuery';
import { institutionKeys } from '@/features/institution/queries/useInstitutionQuery';
import type { InstitutionSettingsDto } from '@/features/institution/types';
import type { ISessionData } from '@/types/domain';

/**
 * Escribe los catálogos de la respuesta de sesión en React Query, su único dueño. Llamar después
 * de `queryClient.clear()` en login/activación. `setQueryData` los marca frescos: cuentan los
 * 30 min de `STALE_TIME.catalog` sin requests a `/periods`, `/subjects` ni `/institutions/me/settings`.
 * No importa `useAuthStore`: el store lo importa a él.
 */
export function seedSessionCatalogs(payload: ISessionData): void {
  queryClient.setQueryData(periodKeys.list(), payload.periods);
  queryClient.setQueryData(subjectKeys.list(), payload.subjects);
  queryClient.setQueryData<InstitutionSettingsDto>(institutionKeys.settings, {
    enabledReports: payload.enabledReports,
    multipleShifts: payload.multipleShifts,
    shifts: payload.shifts,
    offeredLevels: payload.offeredLevels,
  });
}
