import type { IStudentValuationDTO, StudentValuationUpdateData, ValuationSummary } from './api';

// --- Tipos de Usuario (movidos aquí) ---
// Query params aceptados al consumir el endpoint de usuarios
export interface GetUsersQuery {
  id?: string;
  role?: string;
  schoolId?: string;
}

// DTO de usuario devuelto por el backend
export interface UserDto {
  _id: string;
  role: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: string;
  identificationNumber: number;
  phoneNumber?: string;
  schoolId: string;
  valuations: ValuationSummary[];
}

// --- Interfaz del Store ---
export interface StudentValuationState {
  users: UserDto[];
  isLoading: boolean;
  error: string | null;
  currentPage: number; // Para paginación
  fetchUsers: (query: GetUsersQuery) => Promise<void>;
  updateValuation: (
    valuationId: string,
    payload: StudentValuationUpdateData
  ) => Promise<IStudentValuationDTO>;
  nextPage: () => void; // Para paginación
  prevPage: () => void; // Para paginación
}