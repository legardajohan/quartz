import { ISessionData, Subject } from "@/types/domain";

export interface AuthState {
  token: string | null;
  sessionData: ISessionData | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  setSubjects: (subjects: Subject[]) => void;
}