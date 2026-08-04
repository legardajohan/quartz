import type { UserDto, GetUsersQuery } from '../../student-valuation/types';
import type { IReportTemplate } from './api';

export type { UserDto, GetUsersQuery };

export interface ReportState {
  users: UserDto[];
  isLoading: boolean;
  error: string | null;
  currentReport: IReportTemplate | null;
  isReportLoading: boolean;
  reportError: string | null;
  fetchUsers: (query: GetUsersQuery) => Promise<void>;
  fetchChecklistReport: (valuationId: string) => Promise<void>;
  clearReport: () => void;
}
