import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { TaskStatus, TaskStatusRequest } from "../types/taskStatus.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetTaskStatuses = (enabled = true) =>
  useApiQuery<ApiListResponseArray<TaskStatus>>("/task-status", {
    enabled,
    retry: 0,
  });

export const useAddTaskStatus = () =>
  useApiMutation<TaskStatusRequest>("post", "/task-status");

export const useUpdateTaskStatus = (id?: number) =>
  useApiMutation<TaskStatusRequest>("put", `/task-status/${id}`);

export const useDeleteTaskStatus = () =>
  useApiMutation("delete", "/task-status");
