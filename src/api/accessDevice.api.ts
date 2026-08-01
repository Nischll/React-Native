import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  AccessDeviceRequestPojo,
  AccessDeviceResponse,
} from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetAccessDevicesByResident = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<AccessDeviceResponse>>(
    `/access-device/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );

export const useAddAccessDevice = (residentId: number | undefined) =>
  useApiMutation<AccessDeviceRequestPojo>(
    "post",
    `/access-device/resident/${residentId}`,
  );

export const useUpdateAccessDevice = (
  residentId: number | undefined,
  deviceId: number | undefined,
) =>
  useApiMutation<AccessDeviceRequestPojo>(
    "put",
    `/access-device/${deviceId}/resident/${residentId}`,
  );

export const useDeleteAccessDevice = (
  residentId: number | undefined,
  deviceId: number | undefined,
) =>
  useApiMutation(
    "delete",
    `/access-device/${deviceId}/resident/${residentId}`,
  );
