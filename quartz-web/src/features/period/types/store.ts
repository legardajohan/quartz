import type { NewPeriod, UpdatePeriod } from './api';

export interface PeriodDto {
  _id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  closingAlertDate: string | null;
  isActive: boolean;
}

export interface PeriodState {
  periods: PeriodDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchPeriods: () => Promise<void>;
  createPeriod: (data: NewPeriod) => Promise<void>;
  updatePeriod: (id: string, data: UpdatePeriod) => Promise<void>;
  deletePeriod: (id: string) => Promise<void>;
}
