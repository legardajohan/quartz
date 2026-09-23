import { Chip, Typography } from "@material-tailwind/react";
import type { UserDto } from "../types";
import { getAccountStatusView, type AccountStatusView } from "../accountStatus";

interface StatusConfig {
  label: string;
  color: "green" | "blue" | "amber";
  className: string;
  dotColor: string;
}

// Misma gramática visual que `ValuationStatusBadge`: chip ghost redondeado con punto de color.
const STATUS_CONFIG: Record<AccountStatusView, StatusConfig> = {
  active: { label: "Activo", color: "green", className: "bg-green-50 text-green-900", dotColor: "bg-green-500" },
  pending: { label: "Pendiente", color: "blue", className: "bg-blue-50 text-blue-900", dotColor: "bg-blue-500" },
  expired: { label: "Invitación vencida", color: "amber", className: "bg-amber-50 text-amber-900", dotColor: "bg-amber-500" },
};

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

export function AccountStatusBadge({ user }: { user: UserDto }) {
  const view = getAccountStatusView(user);
  const config = STATUS_CONFIG[view];
  const expiresAt = user.invitationExpiresAt ? new Date(user.invitationExpiresAt) : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <Chip
        size="sm"
        variant="ghost"
        color={config.color}
        value={
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${config.dotColor}`} aria-hidden />
            {config.label}
          </span>
        }
        className={`rounded-full px-3 py-1 text-xs font-bold normal-case ${config.className}`}
      />
      {view !== "active" && expiresAt && (
        <Typography variant="small" className="pl-1 text-xs font-normal text-gray-600">
          {view === "pending" ? "Vence el" : "Venció el"} {DATE_FORMAT.format(expiresAt)}
        </Typography>
      )}
    </div>
  );
}
