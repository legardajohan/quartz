import type { ISessionData, User } from '@/types/domain';

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

export interface ProfileResponse {
  success: boolean;
  user: User; 
  message?: string;
}