import { useApiQuery } from "../hooks/api/useApiQuery";
import { ResidenceData } from "../types/residence.types";
import { ApiListResponse } from "./auth.api";

export const useGetResidenceByBuilding = (buildingId?: number) => {
  return useApiQuery<ApiListResponse<ResidenceData[]>>(
    buildingId ? `/resident/building/${buildingId}/residence-only` : "",
    {
      enabled: !!buildingId,
      retry: 0,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  );
};
