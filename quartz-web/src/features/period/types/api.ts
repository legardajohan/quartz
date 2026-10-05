export interface PeriodDto {
  _id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  closingAlertDate: string | null;
  isActive: boolean;
}

export type PeriodsResponse = PeriodDto[];

export interface NewPeriod {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  closingAlertDate?: string | null;
  isActive?: boolean;
}

export type UpdatePeriod = Partial<NewPeriod>;
