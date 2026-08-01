import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { TaskStatus, TaskStatusRequest } from "../types/taskStatus.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetTaskStatuses = (
  params: { page?: number; limit?: number; search?: string } = {},
  enabled = true,
) =>
  useApiQuery<
    ApiListResponse<ApiPaginatedData<TaskStatus>> | ApiListResponseArray<TaskStatus>
  >("/task-status", {
    enabled,
    retry: 0,
    queryParams: buildPageQuery(params),
  });

export const useAddTaskStatus = () =>
  useApiMutation<TaskStatusRequest>("post", "/task-status");

export const useUpdateTaskStatus = (id?: number) =>
  useApiMutation<TaskStatusRequest>("put", `/task-status/${id}`);

export const useDeleteTaskStatus = () =>
  useApiMutation("delete", "/task-status");
