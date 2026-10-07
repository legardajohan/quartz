import type { IdentificationType, UserRole } from '@/types/domain';
import type { UserSchool } from '@/features/users/types';

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
  school: UserSchool;
  avatarUrl?: string;
}

// `email` y `schoolId` solo los acepta la API si quien pide es Jefe de Área.
export interface UpdateOwnProfile {
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

export interface ChangeOwnPassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
