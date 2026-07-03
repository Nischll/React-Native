import { useApiQuery } from "../hooks/api/useApiQuery";
import { ResidentResponse } from "../types/resident.types";
import { ApiListResponseArray } from "./auth.api";

export const useGetResidentByBuildingResidenceOnly = (
  residentId: number | undefined,
  enabled: boolean = true,
) =>
  useApiQuery<ApiListResponseArray<ResidentResponse>>(
    `/resident/${residentId}`,
    {
      enabled: enabled && residentId !== undefined,
      retry: 0,
    },
  );
