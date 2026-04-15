import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  ParcelRequestPojo,
  ParcelResponse,
} from "../types/parcelManagement.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetParcels = (
  params: {
    page?: number;
    limit?: number;
    trackingId?: string;
    buildingId?: number;
    residentId?: number;
  },
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.trackingId?.trim())
    queryParams.trackingId = params.trackingId.trim();
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.residentId != null) queryParams.residentId = params.residentId;

  return useApiQuery<ApiListResponse<ApiPaginatedData<ParcelResponse>>>(
    "/parcels",
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  );
};

export const useAddParcel = (buildingId: number) =>
  useApiMutation<ParcelRequestPojo>("post", `/parcels/building/${buildingId}`);

export const useGetParcelById = (parcelId: number) => {
  return useApiQuery<ApiListResponse<ParcelResponse>>(`parcels/${parcelId}`, {
    enabled: parcelId != null,
    retry: 0,
    refetchOnMount: true,
    // refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useDeleteParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) => useApiMutation("delete", `/parcels/${parcelId}/building/${buildingId}`);

export const useRemindParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) =>
  useApiMutation(
    "post",
    `/parcels/${parcelId}/building/${buildingId}/remind-now`,
  );

export const useDeliverParcel = (
  parcelId: number | undefined,
  buildingId: number | undefined,
) =>
  useApiMutation("post", `/parcels/${parcelId}/building/${buildingId}/deliver`);
