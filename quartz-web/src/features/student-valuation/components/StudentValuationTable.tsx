import { ClipboardDocumentListIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import {
    Avatar,
    Card,
    Typography,
    CardFooter,
    IconButton,
    Tooltip,
} from "@material-tailwind/react";
import { useStudentValuationStore } from "../useStudentValuationStore";
import { SpinnerIcon } from "../../../components/icons";
import { ConfirmationModal } from "../../../components/common/ConfirmationModal";
import toast from "react-hot-toast";
import { useState } from "react";

import type { UserDto } from "../types/store";
import {
    API_STATUS_TO_VALUATION_STATE,
    ValuationState,
} from '../types/domain';
import { ValuationStatusBadge } from './ValuationStatusBadge';
import userImage from "../../../assets/images/default-user.jpg";

export const ITEMS_PER_PAGE = 10;

const TABLE_HEAD = [
    "ID",
    "Apellidos",
    "Nombres",
    "Identificación",
    "Grado",
    "Sede",
    "Estado",
    "Acciones",
];

interface StudentValuationTableProps {
    users: UserDto[];
    onOpenChecklist?: (studentId: string) => void;
    currentPage: number;
    totalPages: number;
    onNextPage: () => void;
    onPrevPage: () => void;
}
export default function StudentValuationTable({ users, onOpenChecklist, currentPage, totalPages, onNextPage, onPrevPage }: StudentValuationTableProps) {
    const { isLoading, error, deleteValuation } = useStudentValuationStore();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedValuationId, setSelectedValuationId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>("");

    const handleOpenChecklist = (studentId: string) => {
        onOpenChecklist?.(studentId);
    };

    const handleDeleteClick = (valuationId: string, userId: string, studentName: string) => {
        setSelectedValuationId(valuationId);
        setSelectedUserId(userId);
        setSelectedStudentName(studentName);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedValuationId || !selectedUserId) return;

        try {
            await deleteValuation(selectedValuationId, selectedUserId);
            setDeleteModalOpen(false);
            toast.success("Evaluación eliminada con éxito");
            setSelectedValuationId(null);
            setSelectedUserId(null);
            setSelectedStudentName("");
        } catch (err: any) {
            toast.error(`Error al eliminar la evaluación: ${err.message}`);
        }
    };

    const getValuationState = (status: string | null | undefined): ValuationState => {
        if (!status) return 'NOT_STARTED';
        return API_STATUS_TO_VALUATION_STATE[status] || 'NOT_STARTED';
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <SpinnerIcon />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <Typography color="red">Error: {error}</Typography>
            </div>
        );
    }

    return (
        <Card className="h-full w-full overflow-auto border border-gray-200 px-6 mt-8">
            <table className="w-full min-w-max table-auto text-left">
                <thead>
                    <tr>
                        {TABLE_HEAD.map((head) => (
                            <th
                                key={head}
                                className="border-b border-blue-gray-100 bg-white p-3"
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold text-xs uppercase opacity-70"
                                >
                                    {head}
                                </Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user, index) => {
                            const isLast = index === users.length - 1;
                            const classes = isLast
                                ? "p-4"
                                : "p-4 border-b border-blue-gray-50";

                            const fullFirstName = [user.firstName, user.middleName]
                                .filter(Boolean)
                                .join(" ");

                            const fullLastName = [user.lastName, user.secondLastName]
                                .filter(Boolean)
                                .join(" ");

                            const valuationState = getValuationState(user.valuations[0]?.status);

                            return (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <div className="flex items-center gap-3">
                                            <Avatar src={userImage} alt="user_imgage" size="sm" />
                                            <div className="flex flex-col">
                                                <Typography variant="small" color="blue-gray" className="font-normal">
                                                    {fullLastName}
                                                </Typography>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                            {fullFirstName}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                            {user.identificationNumber}
                                        </Typography>
                                        <Typography variant="small" color="blue-gray" className="font-normal opacity-70">
                                            {user.identificationType}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                            {user.gradesTaught[0]}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                            {user.school.name}
                                        </Typography>
                                        <Typography
                                            variant="small"
                                            color="blue-gray"
                                            className="font-normal opacity-70"
                                        >
                                            Sede {user.school.schoolNumber}
                                        </Typography>
                                    </td>
                                    <td className={`${classes} w-1 whitespace-nowrap`}>
                                        <ValuationStatusBadge
                                            status={valuationState}
                                        />
                                    </td>
                                    <td className={classes}>
                                        <div className="flex items-center gap-2">
                                            <Tooltip
                                                content={valuationState === 'NOT_STARTED' ? "Iniciar Evaluación" : "Ver Evaluación"}
                                                size="sm"
                                            >
                                                <IconButton
                                                    variant="text"
                                                    onClick={() => handleOpenChecklist(user._id)}
                                                    size="sm"
                                                >
                                                    {valuationState === 'NOT_STARTED' ? (
                                                        <PlusIcon className="h-5 w-5 text-gray-500" />
                                                    ) : (

                                                        <ClipboardDocumentListIcon
                                                            className={`h-6 w-6 ${valuationState === 'COMPLETED'
                                                                ? 'text-green-500'
                                                                : valuationState === 'IN_PROGRESS'
                                                                    ? 'text-blue-500'
                                                                    : 'text-gray-500'
                                                                }`}
                                                        />
                                                    )}
                                                </IconButton>
                                            </Tooltip>
                                            {valuationState !== 'NOT_STARTED' && user.valuations[0]?._id && (
                                                <Tooltip content="Borrar Evaluación" size="sm">
                                                    <IconButton
                                                        variant="text"
                                                        onClick={() => handleDeleteClick(
                                                            user.valuations[0]._id,
                                                            user._id,
                                                            `${user.firstName} ${user.lastName} ${user.secondLastName || ''}`
                                                        )}
                                                        size="sm"
                                                        className="hover:bg-gray-100"
                                                    >
                                                        <TrashIcon className="h-5 w-5 text-gray-400 hover:text-pink-400 transition-colors" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={TABLE_HEAD.length} className="p-4 text-center">
                                <Typography color="blue-gray" className="font-normal">
                                    No se encontraron estudiantes
                                </Typography>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <ConfirmationModal
                open={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿Deseas eliminar la Evaluación?"
                body={
                    <p className="text-gray-600">
                        Lista de Chequeo de{" "}
                        <span className="font-bold">
                            {selectedStudentName}
                        </span>
                    </p>
                }
                confirmColor="pink"
            />
            <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal">
                    Página {currentPage} de {totalPages}
                </Typography>
                <div className="flex gap-2">
                    <IconButton variant="outlined" size="sm" onClick={onPrevPage} disabled={currentPage === 1}>
                        <ArrowLeftIcon className="h-4 w-4" />
                    </IconButton>
                    <IconButton variant="outlined" size="sm" onClick={onNextPage} disabled={currentPage === totalPages}>
                        <ArrowRightIcon className="h-4 w-4" />
                    </IconButton>
                </div>
            </CardFooter>
        </Card >

    );
}
