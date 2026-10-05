import type { ISessionData } from '@/types/domain';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  sessionData: ISessionData;
  message?: string;
}

export interface SessionResponse {
  sessionData: ISessionData;
}

// Activación de cuenta por invitación (USR-04).
export interface ActivationPreview {
  email: string;
  firstName: string;
  institutionName: string;
}

export interface ActivateAccountRequest {
  token: string;
  password: string;
  confirmPassword: string;
}
