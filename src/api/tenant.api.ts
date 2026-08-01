import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { TenantRequestPojo, TenantResponse } from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetTenantsByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<TenantResponse>>(
    `/tenant/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

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
