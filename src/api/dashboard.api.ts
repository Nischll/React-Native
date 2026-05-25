import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { DashboardStatisticsResponse, Notice } from "../types/dashboard.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

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

export const useGetNotice = (page: number, limit?: number) =>
  useApiQuery<ApiListResponse<ApiPaginatedData<Notice>>>("/notice", {
    queryParams: { page, ...(limit !== undefined ? { limit } : {}) },
    enabled: true,
    retry: 0,
  });

export const usePostNotice = () => useApiMutation("post", "/notice");
