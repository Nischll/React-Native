import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { VehicleRequestPojo, VehicleResponse } from "../types/resident.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetVehiclesByResident = (
  residentId: number | undefined,
  params: { page?: number; limit?: number; search?: string } = {},
  enabled: boolean = true,
) =>
  useApiQuery<
    ApiListResponse<ApiPaginatedData<VehicleResponse>> | ApiListResponseArray<VehicleResponse>
  >(`/vehicle/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
    queryParams: buildPageQuery(params as Record<string, any>),
  });

export const useAddVehicle = (residentId: number | undefined) =>
  useApiMutation<VehicleRequestPojo>("post", `/vehicle/resident/${residentId}`);

export const useUpdateVehicle = (
  residentId: number | undefined,
  vehicleId: number | undefined,
) =>
  useApiMutation<VehicleRequestPojo>(
    "put",
    `/vehicle/${vehicleId}/resident/${residentId}`,
  );

export const useDeleteVehicle = (
  residentId: number | undefined,
  vehicleId: number | undefined,
) => useApiMutation("delete", `/vehicle/${vehicleId}/resident/${residentId}`);
