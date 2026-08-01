import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { EmployeeBuildingAssignmentRequest, EmployeeBuildingAssignmentResponse } from "../types/employeeBuildingAssignment.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetAllEmployeeBuildingAssignments = () =>
  useApiQuery<ApiListResponseArray<EmployeeBuildingAssignmentResponse>>(
    "/employee-building-assignment",
    { retry: 0 },
  );

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
