import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_PALETTE } from "@/types/domain";
import type { IPeriodTrendPoint } from "../../types";

interface PeriodTrendChartProps {
  data: IPeriodTrendPoint[];
}

export function PeriodTrendChart({ data }: PeriodTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
        <XAxis dataKey="periodName" stroke={CHART_PALETTE.axis} fontSize={12} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
          stroke={CHART_PALETTE.axis}
          fontSize={12}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => `${Number(value).toFixed(0)}%`}
          labelFormatter={(label, payload) => {
            const point = payload?.[0]?.payload as IPeriodTrendPoint | undefined;
            return point ? `${label} · ${point.scoredStudents} estudiantes` : label;
          }}
        />
        <Line
          type="monotone"
          dataKey="averagePercentage"
          name="Promedio"
          stroke={CHART_PALETTE.brand}
          strokeWidth={2}
          dot={{ r: 4, fill: CHART_PALETTE.brand }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
