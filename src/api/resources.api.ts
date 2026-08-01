import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import { ResourceItem, ResourceType } from "../types/resource.types";

export const useGetResources = (
  params: { page?: number; limit?: number; buildingId?: number; type?: ResourceType } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<ResourceItem>> | ApiListResponseArray<ResourceItem>
  >("/resources", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useGetResourceById = (id?: number, enabled = true) =>
  useApiQuery<ApiListResponse<ResourceItem>>(`/resources/${id}`, {
    enabled: enabled && !!id,
    retry: 0,
  });

export const useCreateResource = () =>
  useApiMutation<FormData>("post", "/resources");

export const useUpdateResource = (id?: number) =>
  useApiMutation<FormData>("put", `/resources/${id}`);

export const useDeleteResource = (id?: number) =>
  useApiMutation("delete", `/resources/${id}`);
