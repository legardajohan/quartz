import type { UserDto } from "./types";

export type AccountStatusView = "active" | "pending" | "expired";

// Ausencia de `accountStatus` ⇒ Activo (usuarios previos a USR-04). El vencimiento se deriva en el cliente.
export function getAccountStatusView(
  user: Pick<UserDto, "accountStatus" | "invitationExpiresAt">,
  now = Date.now()
): AccountStatusView {
  if (user.accountStatus !== "Pendiente") return "active";
  const expiresAt = user.invitationExpiresAt ? Date.parse(user.invitationExpiresAt) : NaN;
  return Number.isNaN(expiresAt) || expiresAt <= now ? "expired" : "pending";
}
