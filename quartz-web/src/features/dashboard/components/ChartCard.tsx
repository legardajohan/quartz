import type { ComponentType, ReactNode } from "react";
import { Card, Typography } from "@material-tailwind/react";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  isEmpty?: boolean;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Clase Tailwind de alto para el cuerpo (esqueleto y estado vacío incluidos): mantiene la geometría final. */
  bodyHeightClassName?: string;
}

export function ChartCard({
  title,
  subtitle,
  isLoading,
  isEmpty = false,
  emptyIcon = BarChart3,
  emptyTitle = "Sin datos para este filtro",
  emptyDescription,
  action,
  children,
  className = "",
  bodyHeightClassName = "h-64",
}: ChartCardProps) {
  return (
    <Card className={`border border-gray-200 p-5 shadow-none ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <Typography variant="h6" color="blue-gray" className="font-semibold">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="small" className="mt-0.5 font-normal text-gray-500">
              {subtitle}
            </Typography>
          )}
        </div>
        {action}
      </div>

      {isLoading ? (
        <Skeleton className={`w-full ${bodyHeightClassName}`} />
      ) : isEmpty ? (
        <div className={`flex items-center justify-center ${bodyHeightClassName}`}>
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
