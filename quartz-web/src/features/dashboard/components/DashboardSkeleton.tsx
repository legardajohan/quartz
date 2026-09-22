import { Skeleton } from "@/components/ui/Skeleton";

interface DashboardSkeletonProps {
  isAreaLead: boolean;
}

export function DashboardSkeleton({ isAreaLead }: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-gray-200 p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-7 w-14" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {isAreaLead && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )}

      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
