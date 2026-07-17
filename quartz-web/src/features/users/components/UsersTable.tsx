import { Avatar, Typography, IconButton, Tooltip } from "@material-tailwind/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { DataTable, type Column } from "@/components/common/DataTable";
import type { UserDto } from "../types";

const AVATAR_FALLBACK = "/avatar-default.svg";

interface UsersTableProps {
  users: UserDto[];
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  isLoading?: boolean;
  canManage: boolean;
  onEdit: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
}

export function UsersTable({
  users,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  isLoading,
  canManage,
  onEdit,
  onDelete,
}: UsersTableProps) {
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
              <Typography variant="small" color="blue-gray" className="font-medium">
                {fullLastName}
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
        <Typography variant="small" color="blue-gray" className="font-normal">
          {item.school?.name ?? "—"}
        </Typography>
      ),
    },
    {
      header: "Acciones",
      accessor: (item) =>
        canManage ? (
          <div className="flex items-center gap-2 min-w-[50px]">
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
          </div>
        ) : (
          <Typography variant="small" className="font-normal text-gray-400 min-w-[50px]">
            —
          </Typography>
        ),
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
