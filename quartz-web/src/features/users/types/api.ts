import type { UserRole, IdentificationType, GradeLevel } from '@/types/domain';

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
  email?: string;
  school: UserSchool;
  gradesTaught: string[];
  valuations: UserValuationSummary[];
  avatarUrl?: string;
}

export interface GetUsersQuery {
  id?: string;
  role?: UserRole;
  schoolId?: string;
}

// Roles que se pueden dar de alta desde /gestion/usuarios. Jefe de Área queda fuera.
export type WritableUserRole = Extract<UserRole, 'Estudiante' | 'Docente'>;

export interface NewUser {
  role: WritableUserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType: IdentificationType;
  identificationNumber: number;
  phoneNumber?: string;
  schoolId: string;
  gradesTaught: GradeLevel[];
  email?: string;    // requerido si role === 'Docente'
  password?: string; // requerido si role === 'Docente'
}

// El rol es inmutable tras la creación: no forma parte del payload de actualización.
export type UpdateUser = Partial<Omit<NewUser, 'role'>>;
