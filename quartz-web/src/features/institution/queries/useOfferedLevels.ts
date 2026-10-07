import { useInstitutionSettingsQuery } from './useInstitutionQuery';
import type { GradeLevel } from '@/types/domain';

// Constante de módulo: referencia estable mientras carga o si la query falla.
const DEFAULT_OFFERED_LEVELS: GradeLevel[] = ['Transición'];

export interface OfferedLevels {
  levels: GradeLevel[];
  isSingle: boolean;
}

/** Niveles de Preescolar que ofrece la institución del usuario (orden 3→5 años, lo garantiza el backend). */
export function useOfferedLevels(): OfferedLevels {
  const { data: settings } = useInstitutionSettingsQuery();
  const levels = settings?.offeredLevels?.length ? settings.offeredLevels : DEFAULT_OFFERED_LEVELS;
  return { levels, isSingle: levels.length === 1 };
}
