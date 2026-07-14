import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Avatar, Typography, IconButton, Tooltip } from "@material-tailwind/react";
import { DataTable, type Column } from "../../../components/common/DataTable";
import { ITEMS_PER_PAGE } from "../useReportStore";
import type { UserDto } from "../types";
import userImage from "../../../assets/images/default-user.jpg";

interface ReportsTableProps {
  users: UserDto[];
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  isLoading?: boolean;
  onViewChecklist: (valuationId: string) => void;
}

export default function ReportsTable({
  users,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  isLoading,
  onViewChecklist,
}: ReportsTableProps) {
  const columns: Column<UserDto>[] = [
    {
      header: "ID",
      accessor: (item) => {
        const rowIndex = users.findIndex((u) => u._id === item._id);
        return (
          <Typography variant="small" color="blue-gray" className="font-normal">
            {(currentPage - 1) * ITEMS_PER_PAGE + rowIndex + 1}
          </Typography>
        );
      },
    },
    {
      header: "Apellidos",
      accessor: (item) => {
        const fullLastName = [item.lastName, item.secondLastName].filter(Boolean).join(" ");
        return (
          <div className="flex items-center gap-3">
            <Avatar src={userImage} alt={fullLastName} size="sm" />
            <Typography variant="small" color="blue-gray" className="font-normal">
              {fullLastName}
            </Typography>
          </div>
        );
      },
    },
    {
      header: "Nombres",
      accessor: (item) => {
        const fullFirstName = [item.firstName, item.middleName].filter(Boolean).join(" ");
        return (
          <Typography variant="small" color="blue-gray" className="font-normal">
            {fullFirstName}
          </Typography>
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
        <Typography variant="small" color="blue-gray" className="font-normal">
          {item.gradesTaught[0]}
        </Typography>
      ),
    },
    {
      header: "Sede",
      accessor: (item) => (
        <div className="flex flex-col">
          <Typography variant="small" color="blue-gray" className="font-normal">
            {item.school.name}
          </Typography>
          <Typography variant="small" color="blue-gray" className="font-normal opacity-70 text-xs">
            Sede {item.school.schoolNumber}
          </Typography>
        </div>
      ),
    },
    {
      header: "Informes",
      accessor: (item) => {
        const valuation = item.valuations[0];
        const isChecklistReady = valuation?.status === "Evaluado";

        return (
          <div className="flex items-center gap-2">
            <Tooltip
              content={isChecklistReady ? "Ver Lista de Chequeo" : "Disponible cuando la evaluación esté completa"}
              size="sm"
            >
              {/* span envuelve el botón deshabilitado para que el Tooltip siga funcionando */}
              <span>
                <IconButton
                  variant="text"
                  size="sm"
                  color="white"
                  disabled={!isChecklistReady}
                  onClick={() => valuation && onViewChecklist(valuation._id)}
                  className="shadow-none enabled:hover:shadow-md bg-white transition-all border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <ClipboardDocumentListIcon
                    className={`h-5 w-5 ${isChecklistReady ? "text-green-600" : "text-gray-400"}`}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip content="Próximamente" size="sm">
              <span>
                <IconButton
                  variant="text"
                  size="sm"
                  color="white"
                  disabled
                  className="shadow-none bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </IconButton>
              </span>
            </Tooltip>
          </div>
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
      emptyMessage="No se encontraron estudiantes"
    />
  );
}
