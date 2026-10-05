import type { ComponentType, ReactNode } from "react";
import { Typography } from "@material-tailwind/react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-4 py-10 text-center ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
      <Typography variant="small" color="blue-gray" className="font-medium">
        {title}
      </Typography>
      {description && (
        <Typography variant="small" className="max-w-xs text-xs font-normal text-gray-500">
          {description}
        </Typography>
      )}
      {action}
    </div>
  );
}
