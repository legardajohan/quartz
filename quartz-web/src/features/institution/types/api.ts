import type { ReportKind } from '@/types/domain';

// Entrada sin `_id` = jornada nueva (el backend le asigna un identificador propio).
export type ShiftInput = {
  _id?: string;
  name: string;
};

export type UpdateInstitutionSettings = Partial<{
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: ShiftInput[];
}>;
