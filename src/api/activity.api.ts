import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  DashboardReminderPeriod,
  DashboardRemindersResponse,
} from "../types/activity.types";
import { Notice } from "../types/dashboard.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetNotice = (
  page: number,
  limit: number,
  seenStatus: string = "all",
) =>
  useApiQuery<ApiListResponse<ApiPaginatedData<Notice>>>("/notice", {
    queryParams: { page, limit, seenStatus },
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
  period: DashboardReminderPeriod = "today",
) =>
  useApiQuery<ApiListResponse<DashboardRemindersResponse>>(
    "/dashboard/reminders",
    {
      queryParams:
        buildingId != null ? { buildingId, period } : undefined,
      enabled: buildingId != null && buildingId > 0,
      retry: 0,
      staleTime: 0,
      refetchOnMount: true,
    },
  );

export type NoticeReactionPayload = {
  noticeId: number;
  reactionType: string;
  userId: number;
};

export function useToggleNoticeReaction() {
  const qc = useQueryClient();

  const mutation = useApiMutation<NoticeReactionPayload>(
    "post",
    "/notice-reaction",
    { showSuccessToast: false },
  );

  const mutateWithRefresh = (
    payload: NoticeReactionPayload,
    opts?: Parameters<typeof mutation.mutate>[1],
  ) => {
    mutation.mutate(payload, {
      ...opts,
      onSuccess: (...args) => {
        qc.invalidateQueries({
          predicate: (q) => String(q.queryKey[0]).includes("/notice"),
        });
        opts?.onSuccess?.(...args);
      },
    });
  };

  return { ...mutation, mutate: mutateWithRefresh };
}
