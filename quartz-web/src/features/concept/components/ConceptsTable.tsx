import {
    Typography,
    IconButton,
    Tooltip,
    Chip,
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { DataTable, Column } from "../../../components/common/DataTable";
import { useSubjectAxisLabel } from "../../subject/useSubjectAxisLabel";
import { ConceptDto, QualitativeValuation } from "../types";

const VALUATION_CHIP_COLOR: Record<QualitativeValuation, "green" | "amber" | "red"> = {
    'Logrado': 'green',
    'En proceso': 'amber',
    'Con dificultad': 'red',
};

interface ConceptsTableProps {
    concepts: ConceptDto[];
    currentPage: number;
    totalPages: number;
    onNextPage: () => void;
    onPrevPage: () => void;
    isLoading: boolean;
    canManage: (concept: ConceptDto) => boolean;
    onEdit: (concept: ConceptDto) => void;
    onDelete: (concept: ConceptDto) => void;
}

export function ConceptsTable({
    concepts,
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
    isLoading,
    canManage,
    onEdit,
    onDelete,
}: ConceptsTableProps) {
    const axis = useSubjectAxisLabel();
    const columns: Column<ConceptDto>[] = [
        {
            header: "Descripción",
            accessor: (item) => (
                <Typography variant="small" color="blue-gray" className="font-normal min-w-[200px] max-w-[450px] whitespace-normal break-words">
                    {item.description}
                </Typography>
            ),
            className: "w-auto",
        },
        {
            header: "Valoración",
            accessor: (item) => (
                <Chip
                    value={item.valuationType}
                    color={VALUATION_CHIP_COLOR[item.valuationType]}
                    size="sm"
                    variant="ghost"
                    className="rounded-full w-fit"
                />
            ),
        },
        {
            header: "Autor",
            accessor: (item) => (
                <div className="flex flex-col min-w-[50px]">
                    <Typography variant="small" className="font-normal">
                        {item.author?.name || 'Desconocido'}
                    </Typography>
                    <Typography variant="small" className="font-normal text-purple-500 opacity-70 uppercase text-xs">
                        {item.author?.role || ''}
                    </Typography>
                </div>
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
            header: axis.singular,
            accessor: (item) => (
                <Typography variant="small" className="font-normal min-w-[50px]">
                    {item.subject.name}
                </Typography>
            ),
        },
        {
            header: "Acciones",
            accessor: (item) => (
                canManage(item) ? (
                    <div className="flex items-center gap-2 min-w-[50px]">
                        <Tooltip content="Editar" size="sm">
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
                )
            ),
        },
    ];

    return (
        <DataTable
            data={concepts}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onNextPage={onNextPage}
            onPrevPage={onPrevPage}
            isLoading={isLoading}
            emptyMessage="No se encontraron conceptos con los filtros seleccionados."
        />
    );
}
