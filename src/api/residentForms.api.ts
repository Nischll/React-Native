import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import {
  ForwardResidentFormsRequest,
  ResidentForm,
  ResidentFormForward,
} from "../types/residentForm.types";

export const useGetResidentForms = (
  params: { page?: number; limit?: number; buildingId?: number } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<ResidentForm>> | ApiListResponseArray<ResidentForm>
  >("/resident-forms", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useCreateResidentForm = () =>
  useApiMutation<FormData>("post", "/resident-forms");

export const useUpdateResidentForm = (id?: number) =>
  useApiMutation<FormData>("put", `/resident-forms/${id}`);

export const useDeleteResidentForm = (id?: number) =>
  useApiMutation("delete", `/resident-forms/${id}`);

export const useGetResidentFormForwards = (
  params: {
    page?: number;
    limit?: number;
    buildingId?: number;
    residentId?: number;
  } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<ResidentFormForward>> | ApiListResponseArray<ResidentFormForward>
  >("/resident-form-forwards", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useForwardResidentForms = () =>
  useApiMutation<ForwardResidentFormsRequest>("post", "/resident-form-forwards");

export const useGetResidentFormForwardById = (
  id?: number,
  residentId?: number,
  enabled = true,
) =>
  useApiQuery<ApiListResponse<ResidentFormForward>>(`/resident-form-forwards/${id}`, {
    enabled: enabled && !!id,
    retry: 0,
    queryParams: residentId != null ? { residentId } : undefined,
  });
