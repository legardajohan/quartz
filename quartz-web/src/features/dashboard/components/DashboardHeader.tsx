import { useEffect, useState } from "react";
import { Typography, IconButton, Tooltip } from "@material-tailwind/react";
import { RefreshCw } from "lucide-react";
import { formatRelativeTime } from "../types";
import { DashboardFilters, type DashboardFilterValues } from "./DashboardFilters";

interface DashboardHeaderProps {
  filters: DashboardFilterValues;
  onFiltersChange: (values: DashboardFilterValues) => void;
  dataUpdatedAt?: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ filters, onFiltersChange, dataUpdatedAt, isFetching, onRefresh }: DashboardHeaderProps) {
  // Recalcula "actualizado hace X" con el paso del tiempo, sin depender de un nuevo fetch.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Typography variant="h4" color="blue-gray" className="font-bold">
          Panel
        </Typography>
        <Typography variant="small" className="mt-1 font-normal text-gray-500">
          {dataUpdatedAt ? `Actualizado ${formatRelativeTime(dataUpdatedAt)}` : "Cargando datos…"}
        </Typography>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DashboardFilters values={filters} onChange={onFiltersChange} />
        <Tooltip content="Actualizar">
          <IconButton
            variant="outlined"
            color="purple"
            onClick={onRefresh}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${isFetching ? "animate-spin" : ""}`} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
