import { Select, Option } from "@material-tailwind/react";
import { usePeriodsQuery } from "@/features/period/queries/usePeriodsQuery";
import { useInstitutionSettingsQuery } from "@/features/institution/queries/useInstitutionQuery";
import type { PeriodDto } from "@/features/period/types";
import { usePermissions } from "@/features/auth/usePermissions";
import { useSchoolsQuery } from "@/features/school/queries/useSchoolsQuery";
import type { GradeLevel, Shift } from "@/types/domain";
import { useOfferedLevels } from "@/features/institution/queries/useOfferedLevels";

const ALL_SCHOOLS_LABEL = "Todas las sedes";
const ALL_GRADES_LABEL = "Todos los grados";
const ALL_SHIFTS_LABEL = "Todas las jornadas";
const NO_PERIODS: PeriodDto[] = [];
const NO_SHIFTS: Shift[] = [];

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
  const { levels: offeredLevels } = useOfferedLevels();
  const { isAreaLead } = usePermissions();
  const { data: schools = [] } = useSchoolsQuery();

  const { data: periods = NO_PERIODS } = usePeriodsQuery();
  const { data: settings } = useInstitutionSettingsQuery();
  const multipleShifts = settings?.multipleShifts ?? false;
  const shifts = settings?.shifts ?? NO_SHIFTS;

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
      <div className="w-full sm:w-52">
        <Select
          color="purple"
          label="Período"
          value={values.periodId}
          onChange={(val) => onChange({ ...values, periodId: val ?? "" })}
          menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
          key={periods.length}
        >
          {periods.map((period) => (
            <Option key={period._id} value={period._id}>
              {period.name}
            </Option>
          ))}
        </Select>
      </div>

      {isAreaLead && (
        <div className="w-full sm:w-52">
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
        <div className="w-full sm:w-52">
          <Select
            color="purple"
            label="Jornada"
            value={values.shiftId}
            onChange={(val) => onChange({ ...values, shiftId: val ?? "" })}
            menuProps={{ placement: "bottom", className: "max-h-[60vh] overflow-y-auto" }}
          >
            <Option value="">{ALL_SHIFTS_LABEL}</Option>
            {shifts.map((shift) => (
              <Option key={shift._id} value={shift._id}>
                {shift.name}
              </Option>
            ))}
          </Select>
        </div>
      )}

      <div className="w-full sm:w-52">
        <Select
          color="purple"
          label="Grado"
          value={values.grade}
          onChange={(val) => onChange({ ...values, grade: (val as GradeLevel) ?? "" })}
          menuProps={{ placement: "bottom" }}
        >
          <Option value="">{ALL_GRADES_LABEL}</Option>
          {offeredLevels.map((level) => (
            <Option key={level} value={level}>
              {level}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
}
