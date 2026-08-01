import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { TowerRequest, TowerResponse } from "../types/tower.types";
import { buildPageQuery } from "../utils/listPagination";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";

export const useGetTowers = (
  params: { page?: number; limit?: number; search?: string; buildingId?: number } | boolean = {},
  enabledArg = true,
) => {
  // Backward compatible: useGetTowers(true) / useGetTowers()
  const paramsObj =
    typeof params === "boolean" ? {} : (params ?? {});
  const enabled = typeof params === "boolean" ? params : enabledArg;

  return useApiQuery<
    | ApiListResponse<ApiPaginatedData<TowerResponse>>
    | ApiListResponseArray<TowerResponse>
  >("/tower", {
    enabled,
    retry: 0,
    queryParams: buildPageQuery(paramsObj as Record<string, any>),
  });
};

export const useGetTowerById = (id?: number, enabled = true) =>
  useApiQuery<ApiListResponse<TowerResponse>>(`/tower/${id}`, {
    enabled: enabled && !!id,
    retry: 0,
  });

export const useAddTower = () =>
  useApiMutation<TowerRequest>("post", "/tower");

export const useUpdateTower = (id?: number) =>
  useApiMutation<TowerRequest>("put", `/tower/${id}`);

export const useDeleteTower = () => useApiMutation("delete", "/tower");
