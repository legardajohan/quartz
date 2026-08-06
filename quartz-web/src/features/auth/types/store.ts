import { ISessionData, Subject, Period, ReportKind, Shift } from "@/types/domain";

export interface AuthState {
  token: string | null;
  sessionData: ISessionData | null;
  isLoading: boolean;
  error: string | null;
  showWelcomeLoader: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  setSubjects: (subjects: Subject[]) => void;
  setPeriods: (periods: Period[]) => void;
  setEnabledReports: (enabledReports: ReportKind[]) => void;
  setShifts: (multipleShifts: boolean, shifts: Shift[]) => void;
  dismissWelcomeLoader: () => void;
}