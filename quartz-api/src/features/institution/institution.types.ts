export enum ReportKind {
  CHECKLIST = 'checklist',
  COMMUNICATIVE_LETTER = 'communicative-letter',
}

export interface IShiftDTO {
  _id: string;
  name: string;
}

// Payload de entrada: una entrada sin `_id` es una jornada nueva.
export type ShiftInput = {
  _id?: string;
  name: string;
};

export interface IShiftSettings {
  multipleShifts: boolean;
  shifts: IShiftDTO[];
}

export interface IInstitutionSettings {
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: IShiftDTO[];
}

export interface IInstitutionDTO {
  _id: string;
  name: string;
  daneCode: string;
  address: string;
  rectorName: string;
  phoneNumber?: string;
  email: string;
  isActive: boolean;
  settings: IInstitutionSettings;
  shieldUrl?: string;
}

export type UpdateInstitutionSettingsData = Partial<{
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: ShiftInput[];
}>;
