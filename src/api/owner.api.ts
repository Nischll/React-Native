import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { OwnerRequestPojo, OwnerResponse } from "../types/resident.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetOwnersByResident = (
  residentId: number | undefined,
  params: { page?: number; limit?: number; search?: string } = {},
  enabled: boolean = true,
) =>
  useApiQuery<
    ApiListResponse<ApiPaginatedData<OwnerResponse>> | ApiListResponseArray<OwnerResponse>
  >(`/owner/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });

export const useAddOwner = (residentId: number | undefined) =>
  useApiMutation<OwnerRequestPojo>("post", `/owner/resident/${residentId}`);

export const useUpdateOwner = (
  residentId: number | undefined,
  ownerId: number | undefined,
) =>
  useApiMutation<OwnerRequestPojo>(
    "put",
    `/owner/${ownerId}/resident/${residentId}`,
  );

export const useDeleteOwner = (
  residentId: number | undefined,
  ownerId: number | undefined,
) => useApiMutation("delete", `/owner/${ownerId}/resident/${residentId}`);
