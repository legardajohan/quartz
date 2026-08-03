import { UserRole, IdentificationType, GradeLevel } from '../auth/auth.types';
import { GlobalValuationStatus } from '../student-valuation/student-valuation.types';

export interface School {
    _id: string;
    schoolNumber: number;
    name: string;
}

export interface ValuationSummary {
    _id: string;
    periodId: string;
    status: GlobalValuationStatus | null;
}

export type UserWithValuations = {
    _id: string;
    role: UserRole;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    identificationType: IdentificationType;
    identificationNumber: number;
    email?: string;
    school: School;
    gradesTaught: string[];
    valuations: ValuationSummary[];
    avatarUrl?: string;
};

// Roles que se pueden dar de alta desde /gestion/usuarios. Jefe de Área queda fuera.
export type WritableUserRole = UserRole.ESTUDIANTE | UserRole.DOCENTE;

export interface CreateUserDTO {
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
    email?: string;    // requerido si role === Docente
    password?: string; // requerido si role === Docente
}

// El rol es inmutable tras la creación: no forma parte del payload de actualización.
export type UpdateUserDTO = Partial<Omit<CreateUserDTO, 'role'>>;
