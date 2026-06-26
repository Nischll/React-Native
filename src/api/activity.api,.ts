import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  DashboardReminderPeriod,
  DashboardRemindersResponse,
} from "../types/activity.types";
import { Notice } from "../types/dashboard.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetNotice = (page: number, limit?: number) =>
  useApiQuery<ApiListResponse<ApiPaginatedData<Notice>>>("/notice", {
    queryParams: { page, ...(limit !== undefined ? { limit } : {}) },
    enabled: true,
    retry: 0,
  });

export const usePostNotice = () => useApiMutation("post", "/notice");

export const useEditNotice = (id: number | undefined) =>
  useApiMutation("put", `/notice/${id}`);

export const useDeleteNotice = (id: number | undefined) =>
  useApiMutation("delete", `/notice/${id}`);

export const useGetReminders = (
  buildingId: number | undefined,
  period: DashboardReminderPeriod | undefined,
) => {
  return useApiQuery<ApiListResponse<DashboardRemindersResponse>>(
    `/dashboard/reminders`,
    {
      queryParams: { buildingId, period },
      retry: 0,
    },
  );
};
