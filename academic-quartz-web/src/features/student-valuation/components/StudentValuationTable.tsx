import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import {
    Card,
    CardHeader,
    Input,
    Typography,
    CardBody,
    CardFooter,
    IconButton,
    Tooltip,
} from "@material-tailwind/react";
import { useStudentValuationStore } from "../useStudentValuationStore";
import { useAuthStore } from "../../auth/useAuthStore";
import type { UserDto } from "../types/api";
import { SpinnerIcon } from "../../../components/icons";
import ValuationChecklist from "./ValuationChecklist";
 
import { apiGet } from "../../../api/apiClient";
import type { IStudentValuationDTO } from "../types";

const TABLE_HEAD = [
    "ID",
    "Nombres",
    "Apellidos",
    "Tipo ID",
    "Número",
    "Lista de chequeo",
];

export default function StudentValuationTable({ users, onOpenChecklist }: { users: UserDto[]; onOpenChecklist?: (studentId: string) => void }) {
    const { isLoading, error } = useStudentValuationStore();
        const [searchTerm, setSearchTerm] = useState("");
        const [filteredUsers, setFilteredUsers] = useState<UserDto[]>(users || []);
        const sessionData = useAuthStore((s) => s.sessionData);

        const handleOpenChecklist = (studentId: string) => {
            onOpenChecklist?.(studentId);
        };

    // Filter users based on search term
    useEffect(() => {
        const filtered = (users || []).filter((user) => {
            const fullName = `${user.firstName} ${user.middleName || ""} ${user.lastName} ${user.secondLastName || ""
                }`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return (
                fullName.includes(searchLower) ||
                user._id.toLowerCase().includes(searchLower) ||
                user.identificationNumber.toString().includes(searchTerm)
            );
        });
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

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
        <Card className="h-full w-full">
            <CardHeader floated={false} shadow={false} className="rounded-none">
                <div className="mb-8 flex items-center justify-between gap-8">
                    <div>
                        <Typography variant="h5" color="blue-gray">
                            Estudiantes
                        </Typography>
                        <Typography color="gray" className="mt-1 font-normal">
                            Lista de estudiantes de la institución
                        </Typography>
                    </div>
                </div>
                <div className="w-full">
                    <Input
                        label="Buscar por nombre, ID o número de identificación"
                        icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        crossOrigin="anonymous"
                    />
                </div>
            </CardHeader>

            <CardBody className="overflow-x-auto px-0">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {TABLE_HEAD.map((head) => (
                                <th
                                    key={head}
                                    className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
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
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => {
                                const isLast = index === filteredUsers.length - 1;
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
                                    <tr key={user._id}>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {index + 1}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {fullFirstName}
                                            </Typography>
                                        </td>
                                        <td className={classes}>
                                            <Typography variant="small" color="blue-gray" className="font-normal">
                                                {fullLastName}
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
            </CardBody>

            

            <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal">
                    Total: {filteredUsers.length} estudiante(s)
                </Typography>
            </CardFooter>
        </Card>
    );
}
