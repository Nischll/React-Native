import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  BuildingVisitorParkingPolicyRequestPojo,
  BuildingVisitorParkingPolicyResponse,
  VisitorParkingInspectionCreatePojo,
  VisitorParkingInspectionResponse,
} from "../types/visitorParking.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetVisitorParkingInspections = (
  params: {
    page?: number;
    limit?: number;
    buildingId?: number;
    licensePlate?: string;
    residentId?: number;
    fromDate?: string;
    toDate?: string;
  },
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  if (params.page != null) queryParams.page = params.page;
  if (params.limit != null) queryParams.limit = params.limit;
  if (params.buildingId != null) queryParams.buildingId = params.buildingId;
  if (params.licensePlate) queryParams.licensePlate = params.licensePlate;
  if (params.residentId != null) queryParams.residentId = params.residentId;
  if (params.fromDate) queryParams.fromDate = params.fromDate;
  if (params.toDate) queryParams.toDate = params.toDate;

  return useApiQuery<
    ApiListResponse<ApiPaginatedData<VisitorParkingInspectionResponse>>
  >("/visitor-parking-inspection", {
    enabled: enabled && params.buildingId != null,
    retry: 0,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetVisitorParkingInspectionById = (
  id: number | undefined,
  enabled = true,
) =>
  useApiQuery<ApiListResponse<VisitorParkingInspectionResponse>>(
    `/visitor-parking-inspection/${id}`,
    { enabled: enabled && id != null, retry: 0 },
  );

export const useCheckInVisitorParkingInspection = () =>
  useApiMutation<VisitorParkingInspectionCreatePojo>(
    "post",
    "/visitor-parking-inspection/check-in",
    { successMessage: "Vehicle checked in" },
  );

export const useCheckOutVisitorParkingInspection = () =>
  useApiMutation<{ pathVars: { id: number } }, unknown, { id: number }>(
    "post",
    (vars) => `/visitor-parking-inspection/${vars?.id}/check-out`,
    { successMessage: "Vehicle checked out" },
  );

export const useUpdateVisitorParkingInspection = (id: number | undefined) =>
  useApiMutation<VisitorParkingInspectionCreatePojo>(
    "put",
    `/visitor-parking-inspection/${id}`,
  );

export const useDeleteVisitorParkingInspection = () =>
  useApiMutation<{ id: number }, any, { id: number }>(
    "delete",
    (vars) => `/visitor-parking-inspection/${vars?.id}`,
  );

export const useGetVisitorParkingPolicy = (
  buildingId: number | undefined,
  enabled = true,
) =>
  useApiQuery<ApiListResponse<BuildingVisitorParkingPolicyResponse>>(
    `/building/${buildingId}/visitor-parking-policy`,
    { enabled: enabled && buildingId != null, retry: 0 },
  );

export const useUpdateVisitorParkingPolicy = (
  buildingId: number | undefined,
) =>
  useApiMutation<BuildingVisitorParkingPolicyRequestPojo>(
    "put",
    `/building/${buildingId}/visitor-parking-policy`,
  );
