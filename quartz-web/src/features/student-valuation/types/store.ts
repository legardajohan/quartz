import { UserRole, IdentificationType } from '@/types/domain';
import type { IStudentValuationDTO, SchoolDto, StudentValuationUpdateData, ValuationSummary } from './api';

// Query params aceptados al consumir el endpoint de usuarios
export interface GetUsersQuery {
  id?: string;
  role?: UserRole;
  schoolId?: string;
}

// DTO de usuario devuelto por el backend
export interface UserDto {
  _id: string;
  role: UserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: IdentificationType;
  identificationNumber: number;
  phoneNumber?: string;
  school: SchoolDto;
  gradesTaught: string[];
  valuations: ValuationSummary[];
}

// --- Interfaz del Store ---
export interface StudentValuationState {
  users: UserDto[];
  currentValuation: IStudentValuationDTO | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number; // Para paginación
  fetchUsers: (query: GetUsersQuery) => Promise<void>;
  fetchValuation: (studentId: string, periodId: string) => Promise<void>;
  clearValuation: () => void;
  updateValuation: (
    valuationId: string,
    payload: StudentValuationUpdateData
  ) => Promise<IStudentValuationDTO>;
  deleteValuation: (valuationId: string, userId: string) => Promise<void>;
  nextPage: () => void; // Para paginación
  prevPage: () => void; // Para paginación
}