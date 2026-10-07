import type { GradeLevel, ReportKind, Shift } from '@/types/domain';

export type ShiftDto = Shift;

export interface InstitutionSettingsDto {
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: ShiftDto[];
  offeredLevels: GradeLevel[];
}

export interface InstitutionDto {
  _id: string;
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber?: string;
  email: string;
  isActive: boolean;
  settings: InstitutionSettingsDto;
  shieldUrl?: string;
  adjustedTeachers?: number;
}

export interface InstitutionBrandingDto {
  name: string;
  shieldUrl?: string;
  shieldVersion: string | null;
}

// Entrada sin `_id` = jornada nueva (el backend le asigna un identificador propio).
export type ShiftInput = {
  _id?: string;
  name: string;
};

export type UpdateInstitutionSettings = Partial<{
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: ShiftInput[];
  offeredLevels: GradeLevel[];
}>;
