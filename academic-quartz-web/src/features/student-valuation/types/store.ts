import { GetUsersQuery, UserDto } from './api';

export interface StudentValuationState {
  users: UserDto[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: (query: GetUsersQuery) => Promise<void>;
}
