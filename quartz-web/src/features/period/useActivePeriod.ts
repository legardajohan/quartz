import { useAuthStore } from "../auth/useAuthStore";
import type { Period } from "@/types/domain";

/**
 * Periodo con `isActive: true` de la sesión actual, o `undefined` si la institución no
 * tiene ninguno activo. Fuente única: sustituye los `sessionData.periods?.find(p => p.isActive)`
 * repetidos por feature.
 */
export function useActivePeriod(): Period | undefined {
  return useAuthStore((state) => state.sessionData?.periods?.find((p) => p.isActive));
}
