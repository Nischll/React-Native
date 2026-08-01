import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  ResidentBasicRequestPojo,
  ResidentResponse,
} from "../types/resident.types";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetResidentByBuildingResidenceOnly = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponse<ResidentResponse>>(`/resident/${residentId}`, {
    enabled: enabled && residentId !== undefined,
    retry: 0,
  });

export const useGetAllResidents = (
  params: {
    page?: number;
    limit?: number;
    buildingId?: number;
    search?: string;
  },
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<ApiListResponse<ApiPaginatedData<ResidentResponse>>>(
    "/resident/get-all",
    {
      enabled: enabled && params.buildingId != null,
      retry: 0,
      queryParams: Object.keys(queryParams).length ? queryParams : undefined,
    },
  );
};

export const useGetResidentsByBuilding = (buildingId?: number, enabled = true) =>
  useApiQuery<ApiListResponse<ResidentResponse[]>>(
    `/resident/building/${buildingId}`,
    { enabled: enabled && buildingId != null, retry: 0 },
  );

export const useAddResident = () =>
  useApiMutation<ResidentBasicRequestPojo>("post", "/resident/save");

export const useUpdateResident = (id: number | undefined) =>
  useApiMutation<ResidentBasicRequestPojo>("put", `/resident/update/${id}`);

export const useDeleteResident = (id: number | undefined) =>
  useApiMutation("delete", `/resident/delete/${id}`);
