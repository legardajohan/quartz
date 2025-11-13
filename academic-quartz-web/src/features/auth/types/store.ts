export type UserRole = 'Jefe de Área' | 'Docente' | 'Estudiante';

export type IdentificationType = 'CC' | 'TI' | 'RC';

export type GradeLevel = 'Transición' | '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | '7mo' | '8vo' | '9no' | '10mo' | '11mo';

export interface User {
  _id: string;
  institutionId: string;
  role: UserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType?: IdentificationType;
  identificationNumber?: number;
  email: string;
  schoolId: string;
  gradesTaught?: GradeLevel[];
}

export interface ISessionData {
  user: {
    _id: string;
    institutionId: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    secondLastName?: string;
    schoolId?: string;
  };
  periods: {
    _id: string;
    name: string;
    isActive: boolean;
  }[];
  subjects: {
    _id: string;
    name: string;
  }[];
}

export interface AuthState {
  token: string | null;
  sessionData: ISessionData | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}