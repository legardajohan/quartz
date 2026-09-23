import { ISessionData, Subject, Period, ReportKind, Shift } from "@/types/domain";
import type { ActivateAccountRequest } from "./api";

export interface AuthState {
  token: string | null;
  sessionData: ISessionData | null;
  isLoading: boolean;
  error: string | null;
  showWelcomeLoader: boolean;

  login: (email: string, password: string) => Promise<void>;
  /** Activa la cuenta invitada e inicia sesión. Relanza el error para que la página lo muestre. */
  activateAccount: (request: ActivateAccountRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshSession: () => Promise<void>;
  setSubjects: (subjects: Subject[]) => void;
  setPeriods: (periods: Period[]) => void;
  setEnabledReports: (enabledReports: ReportKind[]) => void;
  setShifts: (multipleShifts: boolean, shifts: Shift[]) => void;
  dismissWelcomeLoader: () => void;
}