import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { VehicleRequestPojo, VehicleResponse } from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetVehiclesByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<VehicleResponse>>(
    `/vehicle/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

export const useAddVehicle = (residentId: number | undefined) =>
  useApiMutation<VehicleRequestPojo>(
    "post",
    `/vehicle/resident/${residentId}`,
  );

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
