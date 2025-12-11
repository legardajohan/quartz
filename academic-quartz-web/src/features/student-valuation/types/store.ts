import { GetUsersQuery, UserDto, IStudentValuationDTO, StudentValuationUpdateData } from './api';

export interface StudentValuationState {
  users: UserDto[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: (query: GetUsersQuery) => Promise<void>;
  // Update a student valuation (only valuationsBySubject)
  updateValuation: (valuationId: string, payload: StudentValuationUpdateData) => Promise<IStudentValuationDTO>;
}
