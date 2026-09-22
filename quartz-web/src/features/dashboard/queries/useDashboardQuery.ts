import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/api/apiClient";
import type { GetDashboardQuery, IDashboardResponse } from "../types";

export const dashboardQueryKey = (params?: GetDashboardQuery) => ["dashboard", params] as const;

export function useDashboardQuery(params?: GetDashboardQuery) {
  return useQuery({
    queryKey: dashboardQueryKey(params),
    queryFn: () => apiGet<IDashboardResponse>("/dashboard", { params }),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
