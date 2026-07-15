export interface IPeriodDTO {
  _id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  closingAlertDate: string | null;
  isActive: boolean;
}

export type CreatePeriodData = {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  closingAlertDate?: Date | null;
  isActive?: boolean;
};

export type UpdatePeriodData = Partial<CreatePeriodData>;
