import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { TowerRequest, TowerResponse } from "../types/tower.types";
import { ApiListResponse, ApiListResponseArray } from "./auth.api";

export const useGetTowers = (enabled = true) =>
  useApiQuery<ApiListResponseArray<TowerResponse>>("/tower", {
    enabled,
    retry: 0,
  });

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
