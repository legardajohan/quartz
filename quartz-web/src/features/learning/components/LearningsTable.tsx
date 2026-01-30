import {
    Typography,
    IconButton,
    Tooltip,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { DataTable, Column } from "../../../components/common/DataTable";
import { Learning } from "../types";

interface LearningsTableProps {
    learnings: Learning[];
    currentPage: number;
    totalPages: number;
    onNextPage: () => void;
    onPrevPage: () => void;
    isLoading: boolean;
    onEdit: (learning: Learning) => void;
    onDelete: (learning: Learning) => void;
}

export function LearningsTable({
    learnings,
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
    isLoading,
    onEdit,
    onDelete,
}: LearningsTableProps) {
    const columns: Column<Learning>[] = [
        {
            header: "Descripción",
            accessor: (item) => (
                <Typography variant="small" color="blue-gray" className="font-normal min-w-[200px] max-w-[450px] whitespace-normal break-words">
                    {item.description}
                </Typography>
            ),
            className: "w-auto", // Let it size naturally, or use w-[40%] if strictly needed
        },
        {
            header: "Autor",
            accessor: (item) => (
                <div className="flex flex-col min-w-[50px]">
                    <Typography variant="small" className="font-normal">
                        {item.author?.name || 'Desconocido'}
                    </Typography>
                    <Typography variant="small" className="font-normal text-pink-500 opacity-70 text-xs">
                        {item.author?.role || ''}
                    </Typography>
                </div>
            ),
        },
        {
            header: "Grado",
            accessor: (item) => (
                <Typography variant="small" className="font-normal min-w-[50px]">
                    {item.grade}
                </Typography>
            ),
        },
        {
            header: "Periodo",
            accessor: (item) => (
                <div className="border border-gray-200 bg-white rounded-xl font-normal text-xs px-2 py-1 inline-flex items-center justify-center">
                    {item.period.name}
                </div>
            ),
        },
        {
            header: "Dimensión",
            accessor: (item) => (
                <Typography variant="small" className="font-normal min-w-[50px]">
                    {item.subject.name}
                </Typography>
            ),
        },
        {
            header: "Acciones",
            accessor: (item) => (
                <div className="flex items-center gap-2 min-w-[50px]">
                    <Tooltip content="Editar" size="sm">
                        <IconButton
                            size="sm"
                            color="white"
                            className="text-gray-600 shadow-none hover:shadow-md hover:text-blue-500 transition-all border border-gray-200"
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
            ),
        },
    ];

    return (
        <DataTable
            data={learnings}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
            isLoading={isLoading}
            emptyMessage="No se encontraron aprendizajes con los filtros seleccionados."
        />
    );
}
