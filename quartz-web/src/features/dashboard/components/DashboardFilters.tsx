import { Select, Option } from "@material-tailwind/react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { usePermissions } from "@/features/auth/usePermissions";
import { useSchoolsQuery } from "@/features/users/queries/useSchoolsQuery";
import type { GradeLevel } from "@/types/domain";

// Fase actual del sistema: solo Grado Transición (ver CLAUDE.md raíz).
const GRADE_LEVELS: GradeLevel[] = ["Transición"];
const ALL_SCHOOLS_LABEL = "Todas las sedes";
const ALL_GRADES_LABEL = "Todos los grados";
const ALL_SHIFTS_LABEL = "Todas las jornadas";

export interface DashboardFilterValues {
  periodId: string;
  schoolId: string;
  shiftId: string;
  grade: GradeLevel | "";
}

interface DashboardFiltersProps {
  values: DashboardFilterValues;
  onChange: (values: DashboardFilterValues) => void;
}

export function DashboardFilters({ values, onChange }: DashboardFiltersProps) {
  const { sessionData } = useAuthStore();
  const { isAreaLead } = usePermissions();
  const { data: schools = [] } = useSchoolsQuery();

  const multipleShifts = sessionData?.multipleShifts ?? false;

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
      <div className="w-full sm:w-48">
        <Select
          color="purple"
          label="Período"
          value={values.periodId}
          onChange={(val) => onChange({ ...values, periodId: val ?? "" })}
          menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
          key={sessionData?.periods.length}
        >
          {(sessionData?.periods ?? []).map((period) => (
            <Option key={period._id} value={period._id}>
              {period.name}
            </Option>
          ))}
        </Select>
      </div>

      {isAreaLead && (
        <div className="w-full sm:w-48">
          <Select
            color="purple"
            label="Sede"
            value={values.schoolId}
            onChange={(val) => onChange({ ...values, schoolId: val ?? "" })}
            menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
            key={schools.length}
          >
            <Option value="">{ALL_SCHOOLS_LABEL}</Option>
            {schools.map((school) => (
              <Option key={school._id} value={school._id}>
                {school.name}
              </Option>
            ))}
          </Select>
        </div>
      )}

      {multipleShifts && (
        <div className="w-full sm:w-44">
          <Select
            color="purple"
            label="Jornada"
            value={values.shiftId}
            onChange={(val) => onChange({ ...values, shiftId: val ?? "" })}
            menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
          >
            <Option value="">{ALL_SHIFTS_LABEL}</Option>
            {(sessionData?.shifts ?? []).map((shift) => (
              <Option key={shift._id} value={shift._id}>
                {shift.name}
              </Option>
            ))}
          </Select>
        </div>
      )}

      <div className="w-full sm:w-44">
        <Select
          color="purple"
          label="Grado"
          value={values.grade}
          onChange={(val) => onChange({ ...values, grade: (val as GradeLevel) ?? "" })}
          menuProps={{ placement: "bottom" }}
        >
          <Option value="">{ALL_GRADES_LABEL}</Option>
          {GRADE_LEVELS.map((level) => (
            <Option key={level} value={level}>
              {level}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
}
