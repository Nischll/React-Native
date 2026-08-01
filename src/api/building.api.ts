import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { Building, BuildingRequest } from "../types/building.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetBuildings = (
  params: { page?: number; limit?: number; buildingName?: string; search?: string } = {},
  enabled = true,
) => {
  const q = { ...params };
  if (q.search && !q.buildingName) {
    q.buildingName = q.search;
    delete q.search;
  }
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<Building>> | ApiListResponseArray<Building>
  >("/building/get-all", {
    enabled,
    retry: 0,
    queryParams: buildPageQuery(q),
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
