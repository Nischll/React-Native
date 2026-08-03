import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import {
  TrainingCreateRequest,
  TrainingDetail,
  TrainingResponse,
  TrainingTemplate,
  TrainingUpdateRequest,
} from "../types/training.types";

export const useGetTrainings = (
  params: { page?: number; limit?: number; buildingId?: number } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<TrainingResponse>> | ApiListResponseArray<TrainingResponse>
  >("/trainings", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useGetTrainingById = (id?: number, enabled = true) =>
  useApiQuery<ApiListResponse<TrainingDetail>>(`/trainings/${id}`, {
    enabled: enabled && !!id,
    retry: 0,
  });

export const useCreateTraining = () =>
  useApiMutation<TrainingCreateRequest>("post", "/trainings");

export const useUpdateTraining = (id?: number) =>
  useApiMutation<TrainingUpdateRequest>("put", `/trainings/${id}`);

export const useDeleteTraining = (id?: number) =>
  useApiMutation("delete", `/trainings/${id}`);

export const useCompleteEmployeeTraining = () =>
  useApiMutation<undefined, any, { trainingEmployeeId: number }>(
    "put",
    (vars) => `/trainings/employee/${vars?.trainingEmployeeId}/complete`,
  );

export const useDeleteEmployeeTraining = () =>
  useApiMutation<undefined, any, { trainingEmployeeId: number }>(
    "delete",
    (vars) => `/trainings/employee/${vars?.trainingEmployeeId}`,
  );

export const useGetTrainingTemplates = (
  params: { page?: number; limit?: number; buildingId?: number } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<TrainingTemplate>> | ApiListResponseArray<TrainingTemplate>
  >("/training/templates", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useUploadTrainingTemplate = () =>
  useApiMutation<FormData>("post", "/training/templates");

export const useUpdateTrainingTemplate = (id?: number) =>
  useApiMutation<FormData>("put", `/training/templates/${id}`);

export const useDeleteTrainingTemplate = (id?: number) =>
  useApiMutation("delete", `/training/templates/${id}`);
