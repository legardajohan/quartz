import {
    Card,
    Typography,
    CardFooter,
    IconButton,
} from "@material-tailwind/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export const ITEMS_PER_PAGE = 10;

export interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    currentPage: number;
    totalPages: number;
    onNextPage: () => void;
    onPrevPage: () => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

import { Loading } from "../ui/Loading";

export function DataTable<T extends { _id: string }>({
    data,
    columns,
    currentPage,
    totalPages,
    onNextPage,
    onPrevPage,
    isLoading,
    emptyMessage = "No se encontraron datos",
}: DataTableProps<T>) {

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loading />
            </div>
        );
    }

    return (
        <Card className="h-full w-full overflow-auto border border-gray-200 px-6 mt-8">
            <table className="w-full table-auto text-left">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className="border-b border-blue-gray-100 bg-white p-3"
                            >
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold text-xs uppercase opacity-70"
                                >
                                    {col.header}
                                </Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item, index) => {
                            const isLast = index === data.length - 1;
                            const classes = isLast
                                ? "p-4"
                                : "p-4 border-b border-blue-gray-50";

                            return (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className={`${classes} ${col.className || ""}`}>
                                            <div className="flex items-center gap-3">
                                                {col.accessor(item)}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="p-4 text-center">
                                <Typography color="blue-gray" className="font-normal">
                                    {emptyMessage}
                                </Typography>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal">
                    Página {currentPage} de {totalPages}
                </Typography>
                <div className="flex gap-2">
                    <IconButton
                        variant="outlined"
                        size="sm"
                        onClick={onPrevPage}
                        disabled={currentPage === 1}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                        variant="outlined"
                        size="sm"
                        onClick={onNextPage}
                        disabled={currentPage === totalPages}
                    >
                        <ArrowRightIcon className="h-4 w-4" />
                    </IconButton>
                </div>
            </CardFooter>
        </Card>
    );
}
