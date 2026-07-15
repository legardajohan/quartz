import type { ReportKind } from '@/types/domain';
import type { UpdateInstitutionSettings } from './api';

export interface InstitutionSettingsDto {
  enabledReports: ReportKind[];
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
}

export interface InstitutionState {
  institution: InstitutionDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchInstitution: () => Promise<void>;
  updateSettings: (data: UpdateInstitutionSettings) => Promise<void>;
}
