import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ResourceItem, ResourceType } from "../types/resource.types";
import {
  ApiListResponse,
  ApiListResponseArray,
  ApiPaginatedData,
} from "./auth.api";

/** Web resources are not building-scoped — only type / page / limit. */
export const useGetResources = (
  params: { page?: number; limit?: number; type?: ResourceType } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.type) queryParams.type = params.type;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<ResourceItem>>
    | ApiListResponseArray<ResourceItem>
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

export const useDeleteResource = () =>
  useApiMutation<{ id: number }>(
    "delete",
    (vars) => `/resources/${vars?.id}`,
  );

export const useDeleteResourceAttachment = () =>
  useApiMutation<{ attachmentId: number }>(
    "delete",
    (vars) => `/resources/attachments/${vars?.attachmentId}`,
  );
