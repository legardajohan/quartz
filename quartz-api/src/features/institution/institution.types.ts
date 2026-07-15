export enum ReportKind {
  CHECKLIST = 'checklist',
  COMMUNICATIVE_LETTER = 'communicative-letter',
}

export interface IInstitutionSettings {
  periodsPerYear: number;
  enabledReports: ReportKind[];
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
}

export type UpdateInstitutionSettingsData = Partial<IInstitutionSettings>;
