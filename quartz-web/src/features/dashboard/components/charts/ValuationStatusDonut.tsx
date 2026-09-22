import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { VALUATION_STATE_LABELS, VALUATION_STATE_ORDER, type ValuationState } from "@/features/student-valuation/types/domain";
import type { ICohortSummary } from "../../types";

// Mismos colores que las bolitas de estado en ValuationStatusBadge.tsx:12-43, en hex (Recharts no acepta clases Tailwind).
const STATE_COLORS: Record<ValuationState, string> = {
  COMPLETED: "#22c55e",
  IN_PROGRESS: "#3b82f6",
  CREATED: "#6b7280",
  NOT_STARTED: "#9ca3af",
};

const STATE_VALUE_KEY: Record<ValuationState, keyof ICohortSummary> = {
  COMPLETED: "evaluated",
  IN_PROGRESS: "inProgress",
  CREATED: "created",
  NOT_STARTED: "notStarted",
};

interface ValuationStatusDonutProps {
  cohort: ICohortSummary;
}

export function ValuationStatusDonut({ cohort }: ValuationStatusDonutProps) {
  const data = VALUATION_STATE_ORDER.map((state) => ({
    state,
    label: VALUATION_STATE_LABELS[state],
    value: cohort[STATE_VALUE_KEY[state]],
    color: STATE_COLORS[state],
  })).filter((row) => row.value > 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          stroke="#fff"
          strokeWidth={2}
        >
          {data.map((row) => (
            <Cell key={row.state} fill={row.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} estudiantes`, name]} />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
