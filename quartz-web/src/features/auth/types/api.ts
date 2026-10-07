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

// Recuperación de contraseña (AUTH-04).
export interface PasswordResetPreview {
  email: string;
  firstName: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// `location.state` con el que se navega a `/login` (aviso tras restablecer) y a `/recuperar-contrasena`.
export interface AuthLocationState {
  notice?: string;
  email?: string;
}
