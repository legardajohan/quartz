import { QUALITATIVE_VALUATION_COLORS } from "@/types/domain";

/** Series del desempeño por dimensión (widget 5): los 3 niveles de `QualitativeValuation` + pendiente. */
export const PERFORMANCE_SERIES = [
  { key: "achieved", label: "Logrado", color: QUALITATIVE_VALUATION_COLORS["Logrado"] },
  { key: "inProcess", label: "En proceso", color: QUALITATIVE_VALUATION_COLORS["En proceso"] },
  { key: "withDificulty", label: "Con dificultad", color: QUALITATIVE_VALUATION_COLORS["Con dificultad"] },
  { key: "pending", label: "Sin valorar", color: "#cbd5e1" },
] as const;

/** Series del concepto por dimensión (widget 7): solo los 3 niveles, sin "pendiente" (ya excluye maxSubjectScore = 0). */
export const CONCEPT_SERIES = [
  { key: "achieved", label: "Logrado", color: QUALITATIVE_VALUATION_COLORS["Logrado"] },
  { key: "inProcess", label: "En proceso", color: QUALITATIVE_VALUATION_COLORS["En proceso"] },
  { key: "withDificulty", label: "Con dificultad", color: QUALITATIVE_VALUATION_COLORS["Con dificultad"] },
] as const;

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatRelativeTime(iso: string | number): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 10) return "justo ahora";
  if (diffSeconds < 60) return `hace ${diffSeconds} s`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} d`;
}

export function formatDaysToClose(days: number): string {
  if (days < 0) return `Cerrado hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Cierra hoy";
  return `${days} día${days === 1 ? "" : "s"} para el cierre`;
}
