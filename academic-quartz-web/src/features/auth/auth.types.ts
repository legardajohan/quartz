/**
 * Authentication and User Types
 * Academic Quartz - MERN Stack Application
 */

// User role types based on business requirements
export type UserRole = 'Jefe de Área' | 'Docente' | 'Estudiante';

// Identification types for Colombian context
export type IdentificationType = 'CC' | 'TI' | 'RC'; // Citizen ID, Identity Card, Civil Registry

// Grade levels supported by the system
export type GradeLevel = 'Transition' | '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th' | '9th' | '10th' | '11th';

/**
 * Core User entity - matches MongoDB schema
 */
export interface User {
  _id: string;
  institutionId: string;
  role: UserRole;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  identificationType?: IdentificationType; // Only for students
  identificationNumber?: number; // Only for students  
  phoneNumber?: string;
  email: string;
  schoolId: string;
  gradesTaught?: GradeLevel[]; // Only for teachers/area managers
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication request/response types
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
  };
  message: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: User;
  message: string;
}

/**
 * Permission and access control types
 */
export interface UserPermissions {
  canManageUsers: boolean;
  canManageLearnings: boolean;
  canManageConcepts: boolean;
  canManageChecklists: boolean;
  canViewAllSchools: boolean;
  canGenerateReports: boolean;
  canManagePeriods: boolean;
  canViewConsolidated: boolean;
}

/**
 * Auth store state interface
 */
export interface AuthState {
  // Core state
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // Computed properties
  isAuthenticated: boolean;
  userPermissions: UserPermissions | null;
}

/**
 * JWT Token payload structure
 */
export interface JwtPayload {
  userId: string;
  institutionId: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Error response structure from API
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>; // Validation errors
}

/**
 * Utility type for login form state
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Auth context provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}