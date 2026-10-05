import type { ComponentType } from "react";
import { Typography } from "@material-tailwind/react";
import { Skeleton } from "@/components/ui/Skeleton";

type Accent = "brand" | "green" | "amber" | "red" | "blue" | "gray";

const ACCENT_CLASSES: Record<Accent, string> = {
  brand: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
};

interface StatTileProps {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  helpText?: string;
  isLoading?: boolean;
  accent?: Accent;
}

export function StatTile({ label, value, icon: Icon, helpText, isLoading = false, accent = "brand" }: StatTileProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-7 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <Typography variant="small" className="font-medium text-gray-500">
          {label}
        </Typography>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${ACCENT_CLASSES[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <Typography variant="h4" color="blue-gray" className="mt-2 font-bold">
        {value}
      </Typography>
      {helpText && (
        <Typography variant="small" className="mt-1 font-normal text-gray-500">
          {helpText}
        </Typography>
      )}
    </div>
  );
}
