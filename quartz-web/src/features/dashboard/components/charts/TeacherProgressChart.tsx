import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_PALETTE } from "@/types/domain";
import type { ITeacherProgressRow } from "../../types";

interface TeacherProgressChartProps {
  data: ITeacherProgressRow[];
  onSelectTeacher: () => void;
}

export function TeacherProgressChart({ data, onSelectTeacher }: TeacherProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
          stroke={CHART_PALETTE.axis}
          fontSize={12}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="teacherName"
          width={140}
          stroke={CHART_PALETTE.axis}
          fontSize={12}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => `${Number(value).toFixed(0)}% evaluado`}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
        />
        <Bar
          dataKey="percentage"
          name="Evaluado"
          fill={CHART_PALETTE.brand}
          radius={[0, 4, 4, 0]}
          cursor="pointer"
          onClick={() => onSelectTeacher()}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
