import type { UserRole, IdentificationType } from '@/types/domain';

export interface UserSchool {
  _id: string;
  schoolNumber: number;
  name: string;
}

export interface UserValuationSummary {
  _id: string;
  periodId: string;
  status: 'Evaluado' | 'Evaluando' | 'Por diligenciar' | null;
}

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
  school: UserSchool;
  gradesTaught: string[];
  valuations: UserValuationSummary[];
}

export interface GetUsersQuery {
  id?: string;
  role?: UserRole;
  schoolId?: string;
}
