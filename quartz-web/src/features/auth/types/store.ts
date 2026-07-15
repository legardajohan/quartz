import { ISessionData, Subject, Period, ReportKind } from "@/types/domain";

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
  setPeriods: (periods: Period[]) => void;
  setEnabledReports: (enabledReports: ReportKind[]) => void;
}