import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { Building, BuildingRequest } from "../types/building.types";
import { ApiListResponse, ApiListResponseArray } from "./auth.api";

export const useGetBuildings = (
  params: { page?: number; limit?: number; buildingName?: string } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<ApiListResponseArray<Building>>("/building/get-all", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useGetBuildingById = (id?: number, enabled = true) =>
  useApiQuery<ApiListResponse<Building>>(`/building/${id}`, {
    enabled: enabled && !!id,
    retry: 0,
  });

export const useAddBuilding = () =>
  useApiMutation<BuildingRequest>("post", "/building/save");

export const useUpdateBuilding = (id?: number) =>
  useApiMutation<BuildingRequest>("put", `/building/update/${id}`);

export const useDeleteBuilding = () =>
  useApiMutation("delete", "/building/delete");
