import { useApiQuery } from "../hooks/api/useApiQuery";
import { DashboardStatisticsResponse } from "../types/dashboard.types";
import { ApiListResponse } from "./auth.api";

export const useGetDashboardStatistics = (
  buildingId: number | undefined,
  month?: string,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponse<DashboardStatisticsResponse>>(
    "/dashboard/statistics",
    {
      queryParams: buildingId
        ? { buildingId, ...(month ? { month } : {}) }
        : undefined,
      enabled: enabled && buildingId !== undefined,
      retry: 0,
    },
  );
