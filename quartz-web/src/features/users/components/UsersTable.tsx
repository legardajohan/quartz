import { Avatar, Chip, Typography, IconButton, Tooltip } from "@material-tailwind/react";
import { EnvelopeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { DataTable, type Column } from "@/components/common/DataTable";
import { AVATAR_FALLBACK } from "@/constants/assets";
import type { UserDto } from "../types";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { getAccountStatusView } from "../accountStatus";

interface UsersTableProps {
  users: UserDto[];
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  isLoading?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  multipleShifts?: boolean;
  /** Pestaña "Equipo docente": columnas Rol y Estado + reenvío de invitación (USR-04). */
  isStaffView?: boolean;
  /** La fila del usuario autenticado no tiene acciones: su cuenta se gestiona en Mi cuenta. */
  currentUserId?: string;
  resendingUserId?: string | null;
  onEdit: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
  onResendInvitation?: (user: UserDto) => void;
}

const ROLE_CHIP_CLASS: Record<string, string> = {
  "Jefe de Área": "bg-purple-50 text-purple-900",
  Docente: "bg-blue-gray-50 text-blue-gray-900",
};

export function UsersTable({
  users,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  isLoading,
  canEdit,
  canDelete,
  multipleShifts,
  isStaffView = false,
  currentUserId,
  resendingUserId,
  onEdit,
  onDelete,
  onResendInvitation,
}: UsersTableProps) {
  const staffColumns: Column<UserDto>[] = isStaffView
    ? [
        {
          header: "Rol",
          accessor: (item) => (
            <Chip
              size="sm"
              variant="ghost"
              value={item.role}
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold normal-case ${ROLE_CHIP_CLASS[item.role] ?? ""}`}
            />
          ),
        },
      ]
    : [];

  const statusColumn: Column<UserDto>[] = isStaffView
    ? [{ header: "Estado", accessor: (item) => <AccountStatusBadge user={item} /> }]
    : [];

  const columns: Column<UserDto>[] = [
    {
      header: "Nombre",
      accessor: (item) => {
        const fullLastName = [item.lastName, item.secondLastName].filter(Boolean).join(" ");
        const fullFirstName = [item.firstName, item.middleName].filter(Boolean).join(" ");
        return (
          <div className="flex items-center gap-3">
            <Avatar src={item.avatarUrl || AVATAR_FALLBACK} alt={fullLastName} size="sm" />
            <div className="flex flex-col">
              <Typography variant="small" color="blue-gray" className="flex items-center gap-2 font-medium">
                {fullLastName}
                {item._id === currentUserId && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800">Tú</span>
                )}
              </Typography>
              <Typography variant="small" color="blue-gray" className="font-normal opacity-70 text-xs">
                {fullFirstName}
              </Typography>
            </div>
          </div>
        );
      },
    },
    {
      header: "Identificación",
      accessor: (item) => (
        <div className="flex flex-col">
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.identificationNumber}
          </Typography>
          <Typography variant="small" color="blue-gray" className="font-normal opacity-70 text-xs">
            {item.identificationType}
          </Typography>
        </div>
      ),
    },
    ...staffColumns,
    {
      header: "Grado",
      accessor: (item) => (
        <Typography variant="small" color="blue-gray" className="font-normal min-w-[50px]">
          {item.gradesTaught.length > 0 ? item.gradesTaught.join(", ") : "—"}
        </Typography>
      ),
    },
    {
      header: "Sede",
      accessor: (item) => (
        <div className="flex flex-col">
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.school?.name ?? "—"}
          </Typography>
          {multipleShifts && item.shift && (
            <Typography variant="small" color="blue-gray" className="font-normal opacity-70 text-xs">
              {item.shift.name}
            </Typography>
          )}
        </div>
      ),
    },
    ...statusColumn,
    {
      header: "Acciones",
      accessor: (item) => {
        const isSelf = item._id === currentUserId;
        const canResend = isStaffView && !!onResendInvitation && getAccountStatusView(item) !== "active";
        const isResending = resendingUserId === item._id;

        if (isSelf) {
          return (
            <Tooltip content="Gestiona tu cuenta desde Mi cuenta" size="sm">
              <span
                role="img"
                aria-label="Tu cuenta: sin acciones aquí"
                className="flex h-8 w-8 items-center justify-center min-w-[50px] text-blue-gray-300"
              >
                <LockClosedIcon className="h-4 w-4" />
              </span>
            </Tooltip>
          );
        }

        return canEdit || canDelete || canResend ? (
          <div className="flex items-center gap-2 min-w-[50px]">
            {canResend && (
              <Tooltip content={isResending ? "Enviando invitación…" : "Reenviar invitación"} size="sm">
                <IconButton
                  size="sm"
                  color="white"
                  aria-label="Reenviar invitación"
                  disabled={isResending}
                  className="text-gray-600 shadow-none hover:shadow-md hover:text-purple-600 transition-all border border-gray-200"
                  onClick={() => onResendInvitation?.(item)}
                >
                  <EnvelopeIcon className={`h-4 w-4 ${isResending ? "animate-pulse" : ""}`} />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip content="Ver / Editar" size="sm">
                <IconButton
                  size="sm"
                  color="white"
                  className="text-gray-600 shadow-none hover:shadow-md hover:text-green-500 transition-all border border-gray-200"
                  onClick={() => onEdit(item)}
                >
                  <PencilIcon className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip content="Eliminar" size="sm">
                <IconButton
                  size="sm"
                  color="white"
                  className="text-gray-600 shadow-none hover:shadow-md hover:text-pink-500 transition-all border border-gray-200"
                  onClick={() => onDelete(item)}
                >
                  <TrashIcon className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        ) : (
          <Tooltip content="Sin acciones disponibles" size="sm">
            <span
              role="img"
              aria-label="Solo lectura"
              className="flex h-8 w-8 items-center justify-center min-w-[50px] text-blue-gray-300"
            >
              <LockClosedIcon className="h-4 w-4" />
            </span>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      currentPage={currentPage}
      totalPages={totalPages}
      onNextPage={onNextPage}
      onPrevPage={onPrevPage}
      isLoading={isLoading}
      emptyMessage="No se encontraron usuarios."
    />
  );
}
