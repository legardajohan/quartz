import { UserRole, IdentificationType, GradeLevel, UserAccountStatus } from '../auth/auth.types';
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
    accountStatus?: UserAccountStatus;
    invitationExpiresAt?: string; // ISO; solo si la cuenta está Pendiente.
};

// Roles que se pueden dar de alta desde /gestion/usuarios.
export type WritableUserRole = UserRole.ESTUDIANTE | UserRole.DOCENTE | UserRole.JEFE_DE_AREA;

// Roles del "Equipo docente": se invitan por correo (USR-04).
export const STAFF_ROLES = [UserRole.DOCENTE, UserRole.JEFE_DE_AREA] as const;
export type StaffRole = typeof STAFF_ROLES[number];

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
    email?: string;    // requerido si role ∈ STAFF_ROLES
    shiftId?: string;  // solo Estudiante; opcional
}

export type CreatedUserResponse = UserWithValuations & { invitationEmailSent: boolean };

// El rol es inmutable tras la creación: no forma parte del payload de actualización.
// shiftId admite `null` explícito para desasignar la jornada del estudiante.
export type UpdateUserDTO = Partial<Omit<CreateUserDTO, 'role' | 'shiftId'>> & {
    shiftId?: string | null;
};

// ─── Mi cuenta (USR-03): el usuario objetivo siempre es el del token ─────────

export interface OwnProfile {
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
    school: School;
    avatarUrl?: string;
}

// `email` y `schoolId` solo los puede cambiar el Jefe de Área sobre sí mismo.
export interface UpdateOwnProfileDTO {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    secondLastName?: string;
    identificationType?: IdentificationType;
    identificationNumber?: number;
    phoneNumber?: string;
    email?: string;
    schoolId?: string;
}

export interface ChangeOwnPasswordDTO {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ProfileRequestor {
    userId: string;
    role: UserRole;
}

// ─── Cargue masivo (USR-05) ──────────────────────────────────────────────────

export const IMPORT_KINDS = ['students', 'staff'] as const;
export type ImportKind = typeof IMPORT_KINDS[number];
export const IMPORT_MAX_ROWS: Record<ImportKind, number> = { students: 500, staff: 100 };

// Fila ya normalizada (trim, email en minúsculas, sede/jornada resueltas a id).
export interface ImportRowDTO {
    row: number; // Fila de Excel (≥ 2).
    role: WritableUserRole; // students ⇒ Estudiante.
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    identificationType: IdentificationType;
    identificationNumber: number;
    phoneNumber?: string;
    email?: string; // Obligatorio si role ∈ STAFF_ROLES.
    schoolId: string;
    schoolName: string; // Solo para mostrar en la preview.
    shiftId?: string; // Solo Estudiante.
}

export interface ImportRowError {
    row: number;
    reasons: string[];
}

export interface ImportPreview {
    valid: ImportRowDTO[];
    invalid: ImportRowError[];
}

export interface ImportResult {
    created: number;
    skipped: ImportRowError[];
    invitationsFailed: { row: number; email: string }[];
}
