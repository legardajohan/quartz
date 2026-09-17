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