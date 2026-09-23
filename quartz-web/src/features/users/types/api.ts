import type { UserRole, IdentificationType, GradeLevel, Shift, AccountStatus } from '@/types/domain';

export interface UserSchool {
  _id: string;
  schoolNumber: number;
  name: string;
}

export type UserShift = Shift;

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
  shift?: UserShift | null;
  accountStatus?: AccountStatus; // Docente/Jefe de Área. Ausente ⇒ Activo.
  invitationExpiresAt?: string;  // ISO; solo si la cuenta está Pendiente.
}

// Respuesta del alta: indica si el correo de invitación salió (USR-04).
export type CreatedUser = UserDto & { invitationEmailSent: boolean };

// Roles que se pueden dar de alta desde /gestion/usuarios.
export type WritableUserRole = Extract<UserRole, 'Estudiante' | 'Docente' | 'Jefe de Área'>;

// Roles del "Equipo docente": se invitan por correo (USR-04).
export const STAFF_ROLES = ['Docente', 'Jefe de Área'] as const satisfies readonly UserRole[];
export type StaffRole = typeof STAFF_ROLES[number];

export interface GetUsersQuery {
  id?: string;
  role?: UserRole;
  roles?: readonly StaffRole[];
  schoolId?: string;
}

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
  email?: string;    // requerido si role ∈ STAFF_ROLES
  shiftId?: string;  // solo Estudiante; opcional
}

// El rol es inmutable tras la creación: no forma parte del payload de actualización.
// shiftId admite `null` explícito para desasignar la jornada del estudiante.
export type UpdateUser = Partial<Omit<NewUser, 'role' | 'shiftId'>> & {
  shiftId?: string | null;
};
