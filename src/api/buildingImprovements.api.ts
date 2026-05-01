import { useApiMutation } from "../hooks/api/useApiMutation";
import { useApiQuery } from "../hooks/api/useApiQuery";
import {
  BuildingImprovementMutationPayload,
  BuildingImprovementResponse,
} from "../types/building-improvements.type";
import { ApiListResponse, ApiPaginatedData } from "./auth.api";

export const useGetBuildingImprovements = (
  buildingId: number | undefined,
  page?: number,
  limit?: number,
  enabled: boolean = true,
) => {
  const queryParams: Record<string, number> = {};
  if (buildingId != null) queryParams.buildingId = buildingId;
  if (page != null) queryParams.page = page;
  if (limit != null) queryParams.limit = limit;

  return useApiQuery<
    ApiListResponse<ApiPaginatedData<BuildingImprovementResponse>>
  >("/building-improvements", {
    enabled: enabled && buildingId != null && buildingId > 0,
    retry: 0,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
};

export const useGetBuildingImprovementById = (
  id: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponse<BuildingImprovementResponse>>(
    `/building-improvements/${id}`,
    {
      enabled: enabled && id != null && id > 0,
      retry: 0,
    },
  );

export const useCreateBuildingImprovement = () =>
  useApiMutation<BuildingImprovementMutationPayload>(
    "post",
    "/building-improvements",
  );

export const useUpdateBuildingImprovement = (
  improvementId: number | undefined,
) =>
  useApiMutation<BuildingImprovementMutationPayload>(
    "put",
    `/building-improvements/${improvementId}`,
  );

export const useDeleteBuildingImprovement = (id: number | undefined) =>
  useApiMutation("delete", `building-improvements/${id}`);

export const useDeleteBuildingImprovementImage = (
  improvementId: number | undefined,
) => useApiMutation("delete", `/building-improvements/${improvementId}`);
