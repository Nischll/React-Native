import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import { ApiListResponse, ApiListResponseArray, ApiPaginatedData } from "./auth.api";
import { RecommendationItem, RecommendationRequest } from "../types/recommendation.types";

export const useGetRecommendations = (
  params: { page?: number; limit?: number; buildingId?: number } = {},
  enabled = true,
) => {
  const queryParams: Record<string, any> = {};
  Object.entries(params as Record<string, any>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams[k] = v;
  });
  return useApiQuery<
    ApiListResponse<ApiPaginatedData<RecommendationItem>> | ApiListResponseArray<RecommendationItem>
  >("/recommendations", {
    enabled,
    retry: 0,
    queryParams: Object.keys(queryParams).length ? queryParams : undefined,
  });
};

export const useCreateRecommendation = () =>
  useApiMutation<RecommendationRequest>("post", "/recommendations");

export const useDeleteRecommendation = (id?: number) =>
  useApiMutation("delete", `/recommendations/${id}`);
