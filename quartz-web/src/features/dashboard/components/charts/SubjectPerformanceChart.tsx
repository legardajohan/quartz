import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_PALETTE } from "@/types/domain";
import { PERFORMANCE_SERIES } from "../../types";
import type { ISubjectPerformanceRow } from "../../types";

interface SubjectPerformanceChartProps {
  data: ISubjectPerformanceRow[];
}

export function SubjectPerformanceChart({ data }: SubjectPerformanceChartProps) {
  const rows = useMemo(() => {
    return data
      .map((row) => {
        const total = row.total || 1;
        return {
          subjectName: row.subjectName,
          achieved: (row.achieved / total) * 100,
          inProcess: (row.inProcess / total) * 100,
          withDificulty: (row.withDificulty / total) * 100,
          pending: (row.pending / total) * 100,
          _withDificultyRaw: row.withDificulty / total,
        };
      })
      .sort((a, b) => b._withDificultyRaw - a._withDificultyRaw);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 48)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
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
          dataKey="subjectName"
          width={132}
          stroke={CHART_PALETTE.axis}
          fontSize={12}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(value) => `${Number(value).toFixed(0)}%`} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {PERFORMANCE_SERIES.map((serie) => (
          <Bar
            key={serie.key}
            dataKey={serie.key}
            name={serie.label}
            stackId="performance"
            fill={serie.color}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
