import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  CategoryResponse,
  TaskResponse,
  TaskStatus,
} from "../types/task-management.types";
import { ApiListResponse, ApiListResponseArray } from "./auth.api";

// TASK API
export const useAddTask = () => useApiMutation("post", "/task");

export const useGetAllTaskStatus = () =>
  useApiQuery<ApiListResponseArray<TaskStatus>>("/task-status", {
    // staleTime: 1000 * 60,
    // refetchOnMount: true,
    // refetchOnWindowFocus: true,
    retry: 0,
  });

export const useGetAllCategory = () =>
  useApiQuery<ApiListResponseArray<CategoryResponse>>("/category", {
    retry: 0,
  });

// export const useGetTaskByStatusId = (
//   statusId: number | undefined,
//   page?: number,
//   limit?: number,
//   search?: string,
//   assignedTo?: number,
//   buildingId?: number,
//   enabled?: boolean,
// ) => {
//   // Build query params, only including defined values
//   const queryParams: Record<string, any> = {};

//   if (page !== undefined) queryParams.page = page;
//   if (limit !== undefined) queryParams.limit = limit;
//   if (search !== undefined && search !== "") queryParams.search = search;
//   if (assignedTo !== undefined) queryParams.assignedTo = assignedTo;
//   if (buildingId !== undefined) queryParams.buildingId = buildingId;

//   return useApiQuery<ApiListResponse<TaskResponse>>(
//     `/task/task-status/${statusId}`,
//     {
//       enabled: enabled !== false && !!statusId,
//       retry: 0,
//       queryParams,
//     },
//   );
// };

export const useGetTaskByStatusId = (
  statusId: number | undefined,
  page?: number,
  limit?: number,
  search?: string,
  assignedTo?: number,
  buildingId?: number,
  residentId?: number,
  fromDate?: string,
  toDate?: string,
  enabled?: boolean,
) => {
  const queryParams: Record<string, any> = {};

  if (page !== undefined) queryParams.page = page;
  if (limit !== undefined) queryParams.limit = limit;

  if (search) queryParams.search = search;
  if (assignedTo) queryParams.assignedTo = assignedTo;
  if (buildingId) queryParams.buildingId = buildingId;

  if (residentId) queryParams.residentId = residentId;
  if (fromDate) queryParams.fromDate = fromDate;
  if (toDate) queryParams.toDate = toDate;

  return useApiQuery<ApiListResponse<TaskResponse>>(
    `/task/task-status/${statusId}`,
    {
      enabled: enabled !== false && !!statusId,
      retry: 0,
      queryParams,
    },
  );
};

export const useUpdateTaskDetails = (taskId: number | undefined) =>
  useApiMutation("put", `/task/update/${taskId}`);

export const useGetTaskById = (
  taskId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponse<TaskResponse>>(`/task/${taskId}`, {
    enabled: enabled && !!taskId,
    retry: 0,
  });

export const useUpdateTaskStatus = (taskId: number | undefined) =>
  useApiMutation("put", `/task/${taskId}`);

export const useDeleteAtachment = (attachmentId: number | undefined) =>
  useApiMutation("delete", `/attachment/delete/${attachmentId}`);
