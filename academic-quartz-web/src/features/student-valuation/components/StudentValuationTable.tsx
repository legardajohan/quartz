import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import {
    Avatar,
    Card,
    Chip,
    Typography,
    CardFooter,
    IconButton,
    Tooltip,
    Button,
} from "@material-tailwind/react";
import { useStudentValuationStore } from "../useStudentValuationStore";
import { SpinnerIcon } from "../../../components/icons";

import type { UserDto } from "../types/store";
import userImage from "../../../assets/images/default-user.jpg";

export const ITEMS_PER_PAGE = 10;

const TABLE_HEAD = [
    "ID",
    "Apellidos",
    "Nombres",
    "Tipo de Id.",
    "Número",
    "Estado",
    "Lista de chequeo",
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
    const { isLoading, error } = useStudentValuationStore();

    const handleOpenChecklist = (studentId: string) => {
        onOpenChecklist?.(studentId);
    };

    const getChipProps = (status: string | null | undefined) => {
        let chipValue: string;
        let chipColor: "green" | "blue" | "gray" | "red" | "yellow" | "amber" | "orange" | "deep-orange" | "brown" | "light-green" | "deep-purple" | "indigo" | "purple" | "pink" | "teal" | "cyan" | "light-blue";

        switch (status?.toUpperCase()) {
            case "EVALUADO":
                chipValue = "Evaluado";
                chipColor = "green";
                break;
            case "EVALUANDO":
                chipValue = "Evaluando";
                chipColor = "blue";
                break;
            case "CREADO":
                chipValue = "Creado";
                chipColor = "gray";
                break;
            default:
                chipValue = "Sin iniciar";
                chipColor = "gray";
                break;
        }
        return { chipValue, chipColor };
    };

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
                                className="border-b border-blue-gray-100 bg-white p-4"
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none opacity-70"
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
                                            {user.identificationType}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" color="blue-gray" className="font-normal">
                                            {user.identificationNumber}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <div className="w-max">
                                            {(() => {
                                                const { chipValue, chipColor } = getChipProps(user.valuations[0]?.status);
                                                return (
                                                    <Chip
                                                        variant="ghost"
                                                        size="sm"
                                                        value={chipValue}
                                                        color={chipColor}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className={classes}>
                                        <Tooltip content="Ver lista de chequeo">
                                            <IconButton variant="text" onClick={() => handleOpenChecklist(user._id)}>
                                                <ClipboardDocumentListIcon className="h-4 w-4" />
                                            </IconButton>
                                        </Tooltip>
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
            <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal">
                    Page {currentPage} of {totalPages}
                </Typography>
                <div className="flex gap-2">
                    <Button variant="outlined" size="sm" onClick={onPrevPage} disabled={currentPage === 1}>
                        Previous
                    </Button>
                    <Button variant="outlined" size="sm" onClick={onNextPage} disabled={currentPage === totalPages}>
                        Next
                    </Button>
                </div>
            </CardFooter>
        </Card>

    );
}
