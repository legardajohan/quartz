import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "@material-tailwind/react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  ShieldAlert,
  UserX,
  Users,
} from "lucide-react";
import { usePermissions } from "@/features/auth/usePermissions";
import { useActivePeriod } from "@/features/period/useActivePeriod";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardQuery } from "../queries/useDashboardQuery";
import type { GetDashboardQuery } from "../types";
import { formatDaysToClose, formatPercentage } from "../types";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { ChartCard } from "../components/ChartCard";
import { StatTile } from "../components/StatTile";
import type { DashboardFilterValues } from "../components/DashboardFilters";
import { SubjectPerformanceChart } from "../components/charts/SubjectPerformanceChart";
import { ValuationStatusDonut } from "../components/charts/ValuationStatusDonut";
import { SubjectConceptChart } from "../components/charts/SubjectConceptChart";
import { TeacherProgressChart } from "../components/charts/TeacherProgressChart";
import { SchoolProgressChart } from "../components/charts/SchoolProgressChart";
import { PeriodTrendChart } from "../components/charts/PeriodTrendChart";
import { CurriculumHealthPanel } from "../components/CurriculumHealthPanel";
import { AtRiskStudentsList } from "../components/AtRiskStudentsList";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAreaLead } = usePermissions();
  const activePeriod = useActivePeriod();

  const [filters, setFilters] = useState<DashboardFilterValues>({
    periodId: activePeriod?._id ?? "",
    schoolId: "",
    shiftId: "",
    grade: "",
  });

  const query = useMemo<GetDashboardQuery>(
    () => ({
      ...(filters.periodId && { periodId: filters.periodId }),
      ...(isAreaLead && filters.schoolId && { schoolId: filters.schoolId }),
      ...(filters.shiftId && { shiftId: filters.shiftId }),
      ...(filters.grade && { grade: filters.grade }),
    }),
    [filters, isAreaLead]
  );

  const { data, isPending, isFetching, isError, dataUpdatedAt, refetch } = useDashboardQuery(query);

  const handleSelectTeacher = () => {
    navigate("/evaluacion");
  };

  if (isPending) {
    return <DashboardSkeleton isAreaLead={isAreaLead} />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No se pudo cargar el panel"
        description="Revisa tu conexión e inténtalo de nuevo."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white transition duration-150 hover:bg-purple-700 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        }
        className="mt-16"
      />
    );
  }

  const { period, cohort, itemProgress, atRiskStudents, teacherProgress, schoolProgress, curriculumHealth, periodTrend } = data;

  return (
    <div className="space-y-6">
      <DashboardHeader
        filters={filters}
        onFiltersChange={setFilters}
        dataUpdatedAt={dataUpdatedAt}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {!period ? (
        <EmptyState
          icon={CalendarClock}
          title="Esta institución no tiene un período activo"
          description="Activa un período en Configuración para ver las métricas del panel."
          className="mt-10"
        />
      ) : (
        <>
          {/* Capa 1 — KPIs */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Estudiantes" value={String(cohort.totalStudents)} icon={Users} accent="brand" />
            <StatTile
              label="Cobertura"
              value={formatPercentage(cohort.coveragePercentage)}
              icon={CheckCircle2}
              helpText={`${cohort.evaluated} evaluados`}
              accent="green"
            />
            <StatTile
              label="Ítems valorados"
              value={formatPercentage(itemProgress.percentage)}
              icon={ListChecks}
              helpText={`${itemProgress.valuedItems} / ${itemProgress.totalItems}`}
              accent="blue"
            />
            <StatTile
              label="Sin iniciar"
              value={String(cohort.notStarted)}
              icon={UserX}
              accent="gray"
            />
            <StatTile
              label="Cierre del período"
              value={String(period.daysToClose)}
              icon={CalendarClock}
              helpText={formatDaysToClose(period.daysToClose)}
              accent={period.daysToClose < 0 ? "red" : period.daysToClose <= 7 ? "amber" : "brand"}
            />
            <StatTile
              label="En riesgo"
              value={String(atRiskStudents.length)}
              icon={AlertTriangle}
              helpText="2+ dimensiones en dificultad"
              accent={atRiskStudents.length > 0 ? "red" : "gray"}
            />
          </div>

          {/* Capa 2 — Distribuciones */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Estado de las valoraciones"
              subtitle="Cohorte por estado global"
              isLoading={false}
              isEmpty={cohort.totalStudents === 0}
              emptyTitle="No hay estudiantes en esta cohorte"
            >
              <ValuationStatusDonut cohort={cohort} />
            </ChartCard>

            <ChartCard
              title="Desempeño por dimensión"
              subtitle="% de ítems por nivel, ordenado por dificultad"
              isLoading={false}
              isEmpty={data.performanceBySubject.length === 0}
              emptyTitle="Aún no hay ítems valorados"
              bodyHeightClassName="h-64"
            >
              <SubjectPerformanceChart data={data.performanceBySubject} />
            </ChartCard>
          </div>

          <ChartCard
            title="Concepto por dimensión"
            subtitle="Nivel resultante de los estudiantes ya calificados"
            isLoading={false}
            isEmpty={data.conceptBySubject.length === 0}
            emptyTitle="Aún no hay conceptos calculados"
          >
            <SubjectConceptChart data={data.conceptBySubject} />
          </ChartCard>

          {/* Capa 3 — Operación (solo Jefe de Área) */}
          {isAreaLead && teacherProgress && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Progreso por docente"
                subtitle="Ordenado por % evaluado, de menor a mayor"
                isLoading={false}
                isEmpty={teacherProgress.length === 0}
                emptyTitle="Ningún docente tiene valoraciones iniciadas"
              >
                <TeacherProgressChart data={teacherProgress} onSelectTeacher={handleSelectTeacher} />
              </ChartCard>

              {schoolProgress && (
                <ChartCard
                  title="Comparativa por sede"
                  subtitle="% de estudiantes evaluados"
                  isLoading={false}
                  isEmpty={schoolProgress.length === 0}
                  emptyTitle="Sin datos por sede"
                >
                  <SchoolProgressChart data={schoolProgress} />
                </ChartCard>
              )}
            </div>
          )}

          {isAreaLead && curriculumHealth && (
            <div className="rounded-xl border border-gray-200 p-5">
              <Typography variant="h6" color="blue-gray" className="mb-4 font-semibold">
                Salud curricular
              </Typography>
              <CurriculumHealthPanel data={curriculumHealth} />
            </div>
          )}

          {/* Capa 4 — Tendencia */}
          {periodTrend.length >= 2 && (
            <ChartCard title="Tendencia entre períodos" subtitle="Promedio de desempeño por período" isLoading={false}>
              <PeriodTrendChart data={periodTrend} />
            </ChartCard>
          )}

          {/* Capa 5 — Atención requerida */}
          <div className="rounded-xl border border-gray-200 p-5">
            <Typography variant="h6" color="blue-gray" className="mb-2 font-semibold">
              Estudiantes que requieren acompañamiento
            </Typography>
            {atRiskStudents.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sin estudiantes en alerta"
                description="Nadie acumula dos o más dimensiones en dificultad."
              />
            ) : (
              <AtRiskStudentsList data={atRiskStudents} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
