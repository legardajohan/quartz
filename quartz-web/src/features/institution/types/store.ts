import type { ReportKind, Shift } from '@/types/domain';
import type { UpdateInstitutionSettings, InstitutionBrandingDto } from './api';

export type ShiftDto = Shift;

export interface InstitutionSettingsDto {
  enabledReports: ReportKind[];
  multipleShifts: boolean;
  shifts: ShiftDto[];
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
}

export interface InstitutionState {
  institution: InstitutionDto | null;
  branding: InstitutionBrandingDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchInstitution: () => Promise<void>;
  fetchBranding: () => Promise<void>;
  updateSettings: (data: UpdateInstitutionSettings) => Promise<void>;
  uploadShield: (blob: Blob) => Promise<void>;
}
