import { usePeriodsQuery } from "./queries/usePeriodsQuery";
import type { PeriodsResponse } from "./types";
import type { Period } from "@/types/domain";

// De módulo: una referencia estable evita que `select` se re-ejecute en cada render.
const findActivePeriod = (periods: PeriodsResponse): Period | undefined => periods.find((p) => p.isActive);

/**
 * Periodo con `isActive: true` de la institución, o `undefined` si no tiene ninguno activo (o la
 * lista aún no llega tras un F5). Fuente única: lee la caché de periodos sembrada con la sesión.
 */
export function useActivePeriod(): Period | undefined {
  return usePeriodsQuery(findActivePeriod).data;
}
