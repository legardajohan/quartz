import type { UserDto, GetUsersQuery } from '../../student-valuation/types';
import type {
  IReportTemplate,
  ICommunicativeLetterTemplate,
  ILetterAvailability,
  ConceptAssignmentUpdate,
} from './api';

export type { UserDto, GetUsersQuery };

export interface ReportState {
  users: UserDto[];
  isLoading: boolean;
  error: string | null;
  currentReport: IReportTemplate | null;
  isReportLoading: boolean;
  reportError: string | null;
  currentLetter: ICommunicativeLetterTemplate | null;
  isLetterLoading: boolean;
  letterError: string | null;
  letterAvailability: ILetterAvailability | null;
  fetchUsers: (query: GetUsersQuery) => Promise<void>;
  fetchChecklistReport: (valuationId: string) => Promise<void>;
  clearReport: () => void;
  fetchLetterAvailability: (periodId: string) => Promise<void>;
  fetchCommunicativeLetter: (valuationId: string) => Promise<void>;
  saveLetterConcepts: (valuationId: string, assignments: ConceptAssignmentUpdate[]) => Promise<void>;
  clearLetter: () => void;
}
