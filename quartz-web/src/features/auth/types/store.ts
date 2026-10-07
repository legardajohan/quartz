import type { ISessionData } from "@/types/domain";
import type { ActivateAccountRequest } from "./api";

export type SessionUser = ISessionData["user"];

// Solo identidad: los catálogos de la sesión viven en React Query.
export type SessionIdentity = { user: SessionUser };

export interface AuthState {
  token: string | null;
  sessionData: SessionIdentity | null;
  isLoading: boolean;
  error: string | null;
  showWelcomeLoader: boolean;

  login: (email: string, password: string) => Promise<void>;
  /** Activa la cuenta invitada e inicia sesión. Relanza el error para que la página lo muestre. */
  activateAccount: (request: ActivateAccountRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshSession: () => Promise<void>;
  dismissWelcomeLoader: () => void;
}
