import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  PreventiveMaintenanceRequestPojo,
  PreventiveMaintenanceResponse,
} from "../types/preventativeMaintenance.types";
import {
  ApiListResponse,
  ApiListResponseArray,
  ApiPaginatedData,
} from "./auth.api";

export const useGetPreventiveMaintenance = (
  buildingId: number | undefined,
  year: number | undefined,
  enabled = true,
  page?: number,
  limit?: number,
) => {
  const queryParams: Record<string, number> = {};
  if (year != null) queryParams.year = year;
  if (page != null) queryParams.page = page;
  if (limit != null) queryParams.limit = limit;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<PreventiveMaintenanceResponse>>
    | ApiListResponseArray<PreventiveMaintenanceResponse>
  >(
    buildingId != null
      ? `/preventive-maintenance/building/${buildingId}`
      : "",
    {
      enabled: enabled && buildingId != null,
      retry: 0,
      queryParams: Object.keys(queryParams).length ? queryParams : undefined,
    },
  );
};

export const useGetPreventiveMaintenanceById = (
  id: number | undefined,
  enabled = true,
) =>
  useApiQuery<ApiListResponse<PreventiveMaintenanceResponse>>(
    id != null ? `/preventive-maintenance/${id}` : "",
    {
      enabled: enabled && id != null,
      retry: 0,
    },
  );

export const useGetPreventiveMaintenanceYears = (enabled = true) =>
  useApiQuery<ApiListResponseArray<number>>("/preventive-maintenance/years", {
    enabled,
    retry: 0,
  });

export const useAddPreventiveMaintenance = (buildingId: number | undefined) =>
  useApiMutation<PreventiveMaintenanceRequestPojo>(
    "post",
    `/preventive-maintenance/building/${buildingId}`,
  );

export const useUpdatePreventiveMaintenance = (
  id: number | undefined,
  buildingId: number | undefined,
) =>
  useApiMutation<PreventiveMaintenanceRequestPojo>(
    "put",
    (vars?: { id?: number; buildingId?: number }) =>
      `/preventive-maintenance/${vars?.id ?? id}/building/${vars?.buildingId ?? buildingId}`,
  );

export const useDeletePreventiveMaintenance = () =>
  useApiMutation<{ id: number; buildingId: number }>(
    "delete",
    (vars) =>
      `/preventive-maintenance/${vars?.id}/building/${vars?.buildingId}`,
  );

/** Year must be a query param — backend uses @RequestParam, not body. */
export const useLoadPreventiveMaintenanceDefaults = (
  buildingId: number | undefined,
) =>
  useApiMutation<{ year?: number }>(
    "post",
    (vars) => {
      const bid = buildingId ?? 0;
      const year = vars?.year;
      return `/preventive-maintenance/building/${bid}/load-defaults${
        year != null ? `?year=${year}` : ""
      }`;
    },
    { showSuccessToast: true },
  );
