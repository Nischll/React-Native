import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  EmployeeBuildingAssignmentRequest,
  EmployeeBuildingAssignmentResponse,
} from "../types/employeeBuildingAssignment.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetAllEmployeeBuildingAssignments = (
  params: { page?: number; limit?: number; search?: string } = {},
  enabled = true,
) =>
  useApiQuery<
    | ApiListResponse<ApiPaginatedData<EmployeeBuildingAssignmentResponse>>
    | ApiListResponseArray<EmployeeBuildingAssignmentResponse>
  >("/employee-building-assignment", {
    enabled,
    retry: 0,
    queryParams: buildPageQuery(params),
  });

export const useAddEmployeeBuildingAssignment = () =>
  useApiMutation<EmployeeBuildingAssignmentRequest>(
    "post",
    "/employee-building-assignment",
  );

export const useUpdateEmployeeBuildingAssignment = (
  assignmentId: number | undefined,
) =>
  useApiMutation<EmployeeBuildingAssignmentRequest>(
    "put",
    `/employee-building-assignment/${assignmentId}`,
  );

export const useDeleteEmployeeBuildingAssignment = (
  assignmentId: number | undefined,
) =>
  useApiMutation("delete", `/employee-building-assignment/${assignmentId}`);
