import { UserRole, IdentificationType, GradeLevel } from '../auth/auth.types';
import { GlobalValuationStatus } from '../student-valuation/student-valuation.types';

export interface School {
    _id: string;
    schoolNumber: number;
    name: string;
}

export interface Shift {
    _id: string;
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
    shift?: Shift | null;
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
    shiftId?: string;  // solo Estudiante; opcional
}

// El rol es inmutable tras la creación: no forma parte del payload de actualización.
// shiftId admite `null` explícito para desasignar la jornada del estudiante.
export type UpdateUserDTO = Partial<Omit<CreateUserDTO, 'role' | 'shiftId'>> & {
    shiftId?: string | null;
};
