import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { TenantRequestPojo, TenantResponse } from "../types/resident.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetTenantsByResident = (
  residentId: number | undefined,
  params: { page?: number; limit?: number; search?: string } = {},
  enabled: boolean = true,
) =>
  useApiQuery<
    ApiListResponse<ApiPaginatedData<TenantResponse>> | ApiListResponseArray<TenantResponse>
  >(`/tenant/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });

export const useAddTenant = (residentId: number | undefined) =>
  useApiMutation<TenantRequestPojo>("post", `/tenant/resident/${residentId}`);

export const useUpdateTenant = (
  residentId: number | undefined,
  tenantId: number | undefined,
) =>
  useApiMutation<TenantRequestPojo>(
    "put",
    `/tenant/${tenantId}/resident/${residentId}`,
  );

export const useDeleteTenant = (
  residentId: number | undefined,
  tenantId: number | undefined,
) => useApiMutation("delete", `/tenant/${tenantId}/resident/${residentId}`);
